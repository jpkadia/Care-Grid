const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter;
const TRANSIENT_EMAIL_CODES = new Set(['ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ECONNRESET', 'EDNS', 'EAI_AGAIN']);

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const resetTransporter = () => {
  if (transporter) {
    try {
      transporter.close();
    } catch {
      // Nothing to close when the initial SMTP connection never completed.
    }
  }
  transporter = undefined;
};

const isTransientConnectionError = error => {
  // Never retry after SMTP has started sending message data, because that could
  // deliver the same OTP twice. Retries are limited to connection setup.
  if (error?.command && !['CONN', 'EHLO'].includes(error.command)) return false;
  return (
    TRANSIENT_EMAIL_CODES.has(error?.code)
    || error?.command === 'CONN'
    || /connection timeout|getaddrinfo|socket/i.test(error?.message || '')
  );
};

const emailErrorDetails = error => ({
  message: error?.message,
  code: error?.code,
  command: error?.command,
  responseCode: error?.responseCode
});

const retryConnectionOperation = async (operation, attempts = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientConnectionError(error) || attempt === attempts) throw error;
      logger.warn('Transient email connection failure; retrying', {
        ...emailErrorDetails(error),
        attempt,
        attempts
      });
      resetTransporter();
      await wait(attempt * 1500);
    }
  }
  throw lastError;
};

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      // Ye ek line add karni hai IPv6 ko bypass karne ke liye 👇
      tls: { rejectUnauthorized: false }, 
      family: 4 
    });
  }
  return transporter;
};

const purposeCopy = {
  login: {
    subject: 'Your CareGrid login verification code',
    heading: 'Verify your secure login',
    detail: 'Use this one-time code to finish signing in.'
  },
  registration: {
    subject: 'Verify your email to create your CareGrid website',
    heading: 'Verify your email address',
    detail: 'Use this one-time code to continue creating your doctor website.'
  },
  'password-reset': {
    subject: 'Your CareGrid password reset code',
    heading: 'Reset your doctor portal password',
    detail: 'Use this one-time code to continue resetting your password.'
  }
};

const sendOtp = async ({ email, otp, purpose = 'login' }) => {
  const copy = purposeCopy[purpose] || purposeCopy.login;
  try {
    await retryConnectionOperation(() => getTransporter().sendMail({
      from: { name: 'CareGrid Security', address: process.env.EMAIL_USER },
      to: email,
      subject: copy.subject,
      text: `${copy.detail} Your CareGrid verification code is ${otp}. It expires in 5 minutes. Do not share this code.`,
      html: `
        <div style="background:#f3f7f6;padding:32px;font-family:Arial,sans-serif;color:#16332d">
          <div style="max-width:520px;margin:auto;background:#fff;border-radius:20px;padding:32px;border:1px solid #dce9e5">
            <div style="font-size:13px;font-weight:700;letter-spacing:2px;color:#0f8c77">CAREGRID SECURITY</div>
            <h2 style="margin:16px 0 8px">${copy.heading}</h2>
            <p style="color:#60736e;line-height:1.6">${copy.detail} It expires in 5 minutes.</p>
            <div style="font-size:34px;letter-spacing:10px;font-weight:800;color:#087f74;background:#ecf9f5;padding:20px;text-align:center;border-radius:14px;margin:24px 0">${otp}</div>
            <p style="font-size:13px;color:#7a8d88">Never share this code. If you did not request it, you can safely ignore this email.</p>
          </div>
        </div>`
    }), 2);
  } catch (error) {
    logger.error('OTP email failed', { ...emailErrorDetails(error), purpose });
    const mailError = new Error('Verification email could not be sent. Please try again.');
    mailError.statusCode = 503;
    throw mailError;
  }
};

const sendPasswordResetConfirmation = async ({ email }) => {
  try {
    await getTransporter().sendMail({
      from: { name: 'CareGrid Security', address: process.env.EMAIL_USER },
      to: email,
      subject: 'Your CareGrid password was changed',
      text: 'Your doctor portal password was changed successfully. If this was not you, contact your CareGrid administrator immediately.'
    });
  } catch (error) {
    logger.error('Password reset confirmation email failed', { message: error.message });
  }
};

const verifyEmailConnection = async () => retryConnectionOperation(() => getTransporter().verify(), 3);

module.exports = { sendOtp, sendPasswordResetConfirmation, verifyEmailConnection };
