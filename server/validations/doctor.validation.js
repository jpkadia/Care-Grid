const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().required().min(2).max(100),
  education: Joi.string().trim().required().min(2).max(150),
  speciality: Joi.string().trim().required().min(2).max(100),
  clinicName: Joi.string().trim().required().min(2).max(150),
  location: Joi.string().trim().required().min(5).max(500),
  phone: Joi.string().trim().pattern(/^\d{10}$/).required().messages({ 'string.pattern.base': 'Mobile number must contain exactly 10 digits' }),
  email: Joi.string().trim().lowercase().email().required(),
  workDays: Joi.string().trim().max(100).required(),
  visitingHours: Joi.string().trim().max(100).required(),
  theme: Joi.string().valid('gold-dark', 'classic-blue', 'nature-green').default('gold-dark'),
  password: Joi.string().required().min(8).max(72).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/),
  emailVerificationToken: Joi.string().required()
});

const loginSchema = Joi.object({
  identifier: Joi.string().trim().lowercase().max(150).required(),
  password: Joi.string().max(72).required()
});

const updateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  theme: Joi.string().valid('gold-dark', 'classic-blue', 'nature-green'),
  education: Joi.string().trim().min(2).max(150),
  speciality: Joi.string().trim().min(2).max(100),
  clinicName: Joi.string().trim().min(2).max(150),
  location: Joi.string().trim().min(5).max(500),
  phone: Joi.string().trim().pattern(/^\d{10}$/).messages({ 'string.pattern.base': 'Mobile number must contain exactly 10 digits' }),
  email: Joi.string().trim().lowercase().email(),
  workDays: Joi.string().trim().max(100),
  visitingHours: Joi.string().trim().max(100),
  tagline: Joi.string().trim().min(3).max(100),
  heroHeadline: Joi.string().trim().min(5).max(80),
  about: Joi.string().trim().min(20).max(1500),
  services: Joi.string().trim().min(10).max(1500)
});

const forgotPasswordRequestSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required()
});

const resetPasswordSchema = Joi.object({
  resetToken: Joi.string().required(),
  newPassword: Joi.string().required().min(8).max(72).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
});

module.exports = {
  registerSchema,
  loginSchema,
  updateSchema,
  forgotPasswordRequestSchema,
  resetPasswordSchema
};
