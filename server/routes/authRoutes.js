const express = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middlewares/validator');
const { verifyOtpSchema, resendOtpSchema, requestRegistrationOtpSchema } = require('../validations/auth.validation');
const authController = require('../controllers/auth.controller');

const router = express.Router();
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many verification attempts. Please try again later.' } });

router.post('/registration-otp', otpLimiter, validate(requestRegistrationOtpSchema), authController.requestRegistrationOtp);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', otpLimiter, validate(resendOtpSchema), authController.resendOtp);

module.exports = router;
