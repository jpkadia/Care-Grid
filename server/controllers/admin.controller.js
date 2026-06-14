
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const ChatConversation = require('../models/ChatConversation');
const OtpChallenge = require('../models/OtpChallenge');
const { deleteFromCloudinary } = require('../services/cloudinary');
const { applyDoctorProfileUpdate } = require('../services/doctorProfile');
const { issueChallenge } = require('../services/otpService');

exports.loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    }

    const challenge = await issueChallenge({
      accountType: 'superadmin',
      purpose: 'login',
      accountId: admin._id,
      email: admin.email
    });
    res.json({ success: true, requiresOtp: true, message: 'Verification code sent to your registered email', ...challenge });

  } catch (error) {
    next(error);
  }
};

exports.getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().select('-password').sort({ _id: -1 });
    res.json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
};

exports.deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const photoUrl = doctor.photoUrl;
    const sliderImages = [...(doctor.sliderImages || [])];
    await doctor.deleteOne();
    await Appointment.deleteMany({ doctor: doctor._id });
    await ChatConversation.deleteMany({ ownerType: 'doctor', owner: doctor._id });
    await OtpChallenge.deleteMany({ accountType: 'doctor', accountId: doctor._id });
    if (photoUrl) await deleteFromCloudinary(photoUrl);
    await Promise.all(sliderImages.map(url => deleteFromCloudinary(url)));
    res.json({ success: true, message: "Doctor completely removed" });

  } catch (error) {
    next(error);
  }
};

exports.updateDoctorAsAdmin = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    // Yahan hum try karenge, agar crash hua toh error log hoga
    const doctorResponse = await applyDoctorProfileUpdate({
      doctor,
      body: req.body,
      files: req.files,
      allowEmailChange: true
    });
    res.json({ success: true, data: doctorResponse });

  } catch (error) {
    // Ab proper global error handler trigger hoga aur exact field error UI me dikhega
    logger.error("SUPER ADMIN DOCTOR UPDATE ERROR:", error);
    next(error);
  }
};