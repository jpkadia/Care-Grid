const logger = require('../utils/logger');

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

const sendEmailViaAPI = async (toEmail, subject, textContent, htmlContent) => {
  // Brevo HTTP API bypassing cloud SMTP blocks
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'CareGrid Security', email: process.env.EMAIL_USER },
      to: [{ email: toEmail }],
      subject: subject,
      textContent: textContent,
      htmlContent: htmlContent
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Email API Error: ${JSON.stringify(errorData)}`);
  }
  return await response.json();
};

const sendOtp = async ({ email, otp, purpose = 'login' }) => {
  const copy = purposeCopy[purpose] || purposeCopy.login;
  try {
    const textContent = `${copy.detail} Your CareGrid verification code is ${otp}. It expires in 5 minutes. Do not share this code.`;
    const htmlContent = `
      <div style="background:#f3f7f6;padding:32px;font-family:Arial,sans-serif;color:#16332d">
        <div style="max-width:520px;margin:auto;background:#fff;border-radius:20px;padding:32px;border:1px solid #dce9e5">
          <div style="font-size:13px;font-weight:700;letter-spacing:2px;color:#0f8c77">CAREGRID SECURITY</div>
          <h2 style="margin:16px 0 8px">${copy.heading}</h2>
          <p style="color:#60736e;line-height:1.6">${copy.detail} It expires in 5 minutes.</p>
          <div style="font-size:34px;letter-spacing:10px;font-weight:800;color:#087f74;background:#ecf9f5;padding:20px;text-align:center;border-radius:14px;margin:24px 0">${otp}</div>
          <p style="font-size:13px;color:#7a8d88">Never share this code. If you did not request it, you can safely ignore this email.</p>
        </div>
      </div>`;

    await sendEmailViaAPI(email, copy.subject, textContent, htmlContent);
  } catch (error) {
    logger.error('OTP email failed', { message: error.message, purpose });
    const mailError = new Error('Verification email could not be sent. Please try again.');
    mailError.statusCode = 503;
    throw mailError;
  }
};

const sendPasswordResetConfirmation = async ({ email }) => {
  try {
    const textContent = 'Your doctor portal password was changed successfully. If this was not you, contact your CareGrid administrator immediately.';
    const htmlContent = `<p>${textContent}</p>`;
    await sendEmailViaAPI(email, 'Your CareGrid password was changed', textContent, htmlContent);
  } catch (error) {
    logger.error('Password reset confirmation email failed', { message: error.message });
  }
};

// Dummy check taaki server.js me connection verify ho sake aur backend crash na ho
const verifyEmailConnection = async () => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is missing in environment variables.");
  }
  if (!process.env.EMAIL_USER) {
    throw new Error("EMAIL_USER is missing in environment variables.");
  }
  return Promise.resolve(true);
};

module.exports = { sendOtp, sendPasswordResetConfirmation, verifyEmailConnection };