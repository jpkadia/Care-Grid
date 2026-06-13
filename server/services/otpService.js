const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const OtpChallenge = require('../models/OtpChallenge');
const { sendOtp } = require('./emailService');

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_WAIT_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const maskEmail = (email) => {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(2, name.length - 2))}@${domain}`;
};

const issueChallenge = async ({ accountType, purpose, accountId, email, metadata = {} }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const selector = { accountType, purpose, email: normalizedEmail };
  if (accountId) selector.accountId = accountId;
  await OtpChallenge.deleteMany(selector);
  const challenge = await OtpChallenge.create({
    accountType,
    purpose,
    accountId,
    email: normalizedEmail,
    metadata,
    otpHash,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    lastSentAt: new Date()
  });
  try {
    await sendOtp({ email: normalizedEmail, otp, purpose });
  } catch (error) {
    await challenge.deleteOne();
    throw error;
  }
  return { challengeId: challenge._id, maskedEmail: maskEmail(normalizedEmail), expiresInSeconds: OTP_EXPIRY_MS / 1000 };
};

const resendChallenge = async (challengeId) => {
  const challenge = await OtpChallenge.findById(challengeId);
  if (!challenge || challenge.expiresAt <= new Date()) {
    const error = new Error('Verification session expired. Please start again.');
    error.statusCode = 400;
    throw error;
  }
  if (Date.now() - challenge.lastSentAt.getTime() < RESEND_WAIT_MS) {
    const error = new Error('Please wait before requesting another code.');
    error.statusCode = 429;
    throw error;
  }
  const otp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  await sendOtp({ email: challenge.email, otp, purpose: challenge.purpose });
  challenge.otpHash = otpHash;
  challenge.attempts = 0;
  challenge.expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  challenge.lastSentAt = new Date();
  await challenge.save();
  return { maskedEmail: maskEmail(challenge.email), expiresInSeconds: OTP_EXPIRY_MS / 1000 };
};

const verifyChallenge = async (challengeId, otp) => {
  const challenge = await OtpChallenge.findById(challengeId);
  if (!challenge || challenge.expiresAt <= new Date()) {
    const error = new Error('Verification code expired. Please start again.');
    error.statusCode = 400;
    throw error;
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    await challenge.deleteOne();
    const error = new Error('Too many incorrect attempts. Please start again.');
    error.statusCode = 429;
    throw error;
  }
  const matches = await bcrypt.compare(otp, challenge.otpHash);
  if (!matches) {
    challenge.attempts += 1;
    await challenge.save();
    const error = new Error('Invalid verification code.');
    error.statusCode = 400;
    throw error;
  }
  await challenge.deleteOne();
  return challenge;
};

module.exports = { issueChallenge, resendChallenge, verifyChallenge };
