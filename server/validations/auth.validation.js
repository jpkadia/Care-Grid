const Joi = require('joi');

const verifyOtpSchema = Joi.object({
  challengeId: Joi.string().hex().length(24).required(),
  otp: Joi.string().pattern(/^\d{6}$/).required()
});

const resendOtpSchema = Joi.object({
  challengeId: Joi.string().hex().length(24).required()
});

const requestRegistrationOtpSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required()
});

module.exports = { verifyOtpSchema, resendOtpSchema, requestRegistrationOtpSchema };
