const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const upload = require('../middlewares/upload');
const verifyToken = require('../middlewares/auth');
const validate = require('../middlewares/validator');
const { registerSchema, loginSchema, updateSchema, forgotPasswordRequestSchema, resetPasswordSchema } = require('../validations/doctor.validation');
const { createAppointmentSchema, updateStatusSchema, chatSchema } = require('../validations/appointment.validation');

const doctorController = require('../controllers/doctor.controller');
const appointmentController = require('../controllers/appointment.controller');
const chatController = require('../controllers/chat.controller');
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' } });
const bookingLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 12, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many appointment requests. Please try again later.' } });
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 6, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many password reset attempts. Please try again later.' } });
const registrationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many registration attempts. Please try again later.' } });

router.post(
  '/register',
  registrationLimiter,
  upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'sliderImages', maxCount: 8 }
  ]),
  upload.validateImages,
  validate(registerSchema),
  doctorController.registerDoctor
);

router.post(
  '/:slug/login', 
  loginLimiter,
  validate(loginSchema),
  doctorController.loginDoctor
);

router.post('/:slug/forgot-password', resetLimiter, validate(forgotPasswordRequestSchema), doctorController.requestPasswordReset);
router.post('/:slug/reset-password', resetLimiter, validate(resetPasswordSchema), doctorController.resetPassword);
router.get('/:slug/session', verifyToken, doctorController.getDoctorSession);

router.post('/:slug/appointments', bookingLimiter, validate(createAppointmentSchema), appointmentController.createAppointment);
router.get('/:slug/appointments', verifyToken, appointmentController.getDoctorAppointments);
router.patch('/:slug/appointments/:appointmentId/status', verifyToken, validate(updateStatusSchema), appointmentController.updateDoctorAppointmentStatus);
router.get('/:slug/chat/history', verifyToken, chatController.getDoctorChatHistory);
router.post('/:slug/chat', verifyToken, validate(chatSchema), chatController.doctorChat);

router.put(
  '/:slug/update', 
  verifyToken, 
  upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'sliderImages', maxCount: 8 }
  ]),
  upload.validateImages,
  validate(updateSchema),
  doctorController.updateDoctor
);

router.get(
  '/:slug', 
  doctorController.getDoctorProfile
);

module.exports = router;
