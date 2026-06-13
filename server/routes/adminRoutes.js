const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const upload = require('../middlewares/upload');
const verifyAdminToken = require('../middlewares/adminAuth');
const validate = require('../middlewares/validator');
const { loginSchema } = require('../validations/admin.validation');
const { updateSchema } = require('../validations/doctor.validation');
const { updateStatusSchema, chatSchema } = require('../validations/appointment.validation');

const adminController = require('../controllers/admin.controller');
const appointmentController = require('../controllers/appointment.controller');
const chatController = require('../controllers/chat.controller');
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' } });

router.post('/login', loginLimiter, validate(loginSchema), adminController.loginAdmin);

router.get('/doctors', verifyAdminToken, adminController.getAllDoctors);
router.get('/appointments', verifyAdminToken, appointmentController.getAllAppointments);
router.patch('/appointments/:id/status', verifyAdminToken, validate(updateStatusSchema), appointmentController.updateAppointmentStatusAsAdmin);
router.get('/chat/history', verifyAdminToken, chatController.getSuperAdminChatHistory);
router.post('/chat', verifyAdminToken, validate(chatSchema), chatController.superAdminChat);

router.delete('/doctors/:id', verifyAdminToken, adminController.deleteDoctor);

router.put(
  '/doctors/:id', 
  verifyAdminToken, 
  upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'sliderImages', maxCount: 8 }
  ]),
  upload.validateImages,
  validate(updateSchema),
  adminController.updateDoctorAsAdmin
);

module.exports = router;
