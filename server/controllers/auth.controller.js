const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const { resendChallenge, verifyChallenge } = require('../services/otpService');
const { issueChallenge } = require('../services/otpService');

exports.requestRegistrationOtp = async (req, res, next) => {
  try {
    const existing = await Doctor.exists({ 'personalDetails.email': req.body.email });
    if (existing) return res.status(409).json({ success: false, message: 'This email is already registered.', errors: { email: 'This email is already registered.' } });
    const challenge = await issueChallenge({ accountType: 'doctor', purpose: 'registration', email: req.body.email });
    res.json({ success: true, message: 'Verification code sent to your email', ...challenge });
  } catch (error) {
    next(error);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const challenge = await verifyChallenge(req.body.challengeId, req.body.otp);
    if (challenge.purpose === 'registration') {
      const emailVerificationToken = jwt.sign(
        { purpose: 'registration', email: challenge.email },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      return res.json({ success: true, message: 'Email verified successfully', emailVerificationToken });
    }
    if (challenge.purpose === 'password-reset') {
      const resetToken = jwt.sign(
        { purpose: 'password-reset', id: challenge.accountId, email: challenge.email, slug: challenge.metadata?.slug, ver: challenge.metadata?.authVersion || 0 },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );
      return res.json({ success: true, message: 'Code verified successfully', resetToken });
    }
    const role = challenge.accountType === 'superadmin' ? 'superadmin' : 'doctor';
    let authVersion;
    if (role === 'doctor') {
      const doctor = await Doctor.findById(challenge.accountId).select('+authVersion');
      if (!doctor) return res.status(401).json({ success: false, message: 'Doctor account no longer exists.' });
      authVersion = doctor.authVersion || 0;
    }
    const token = jwt.sign({ id: challenge.accountId, role, ver: authVersion }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, message: 'Login verified successfully', token, role });
  } catch (error) {
    next(error);
  }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const result = await resendChallenge(req.body.challengeId);
    res.json({ success: true, message: 'A new verification code was sent', ...result });
  } catch (error) {
    next(error);
  }
};
