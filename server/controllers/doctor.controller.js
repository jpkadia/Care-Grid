const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const OtpChallenge = require('../models/OtpChallenge');
const { uploadToCloudinary } = require('../services/cloudinary');
const { applyDoctorProfileUpdate } = require('../services/doctorProfile');
const { generateDoctorContent } = require('../services/openai');
const { issueChallenge } = require('../services/otpService');
const { sendPasswordResetConfirmation } = require('../services/emailService');

exports.registerDoctor = async (req, res, next) => {
  try {
    let verification;
    try {
      verification = jwt.verify(req.body.emailVerificationToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Email verification expired. Please verify your email again.' });
    }
    if (verification.purpose !== 'registration' || verification.email !== req.body.email) {
      return res.status(401).json({ success: false, message: 'Please verify the same email before creating your website.' });
    }
    if (!req.files?.profilePhoto?.[0]) {
      return res.status(400).json({ success: false, message: 'A profile photo is required.', errors: { profilePhoto: 'A profile photo is required.' } });
    }
    const existingEmail = await Doctor.findOne({ "personalDetails.email": req.body.email });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: "Email already exists", errors: { email: 'This email is already registered.' } });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    let profilePhotoUrl = "";
    if (req.files && req.files.profilePhoto) {
      profilePhotoUrl = await uploadToCloudinary(req.files.profilePhoto[0].buffer, 'image');
    }

    let sliderImageUrls = [];
    if (req.files && req.files.sliderImages) {
      const uploadPromises = req.files.sliderImages.map(file => uploadToCloudinary(file.buffer, 'image'));
      sliderImageUrls = await Promise.all(uploadPromises);
    }

    const aiContent = await generateDoctorContent(req.body);

    let slug = req.body.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const existing = await Doctor.findOne({ slug });
    if (existing) {
        slug = `${slug}-${Date.now()}`;
    }

    const newDoctor = new Doctor({
      name: req.body.name,
      slug: slug,
      theme: req.body.theme || 'gold-dark',
      password: hashedPassword,
      personalDetails: {
        education: req.body.education,
        speciality: req.body.speciality,
        clinicName: req.body.clinicName,
        location: req.body.location,
        phone: req.body.phone,
        email: req.body.email,
        workDays: req.body.workDays,
        visitingHours: req.body.visitingHours
      },
      photoUrl: profilePhotoUrl,
      sliderImages: sliderImageUrls,
      aiContent: aiContent
    });

    await newDoctor.save();
    res.status(201).json({ success: true, slug: slug });

  } catch (error) {
    next(error);
  }
};

exports.loginDoctor = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { identifier, password } = req.body;

    const doctor = await Doctor.findOne({ 
      slug: slug,
      $or: [
        { "personalDetails.email": identifier },
        { "personalDetails.phone": identifier }
      ]
    });

    if (!doctor) {
      return res.status(401).json({ success: false, message: "Invalid credentials for this portal" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!doctor.personalDetails?.email) {
      return res.status(400).json({ success: false, message: 'A registered email is required for secure login.' });
    }
    const challenge = await issueChallenge({
      accountType: 'doctor',
      purpose: 'login',
      accountId: doctor._id,
      email: doctor.personalDetails.email
    });
    res.json({ success: true, requiresOtp: true, message: 'Verification code sent to your registered email', ...challenge });

  } catch (error) {
    next(error);
  }
};

exports.updateDoctor = async (req, res, next) => {
  try {
    const doctor = req.doctor || await Doctor.findById(req.doctorId).select('+authVersion');

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    if (req.body.email && req.body.email !== doctor.personalDetails.email) {
      return res.status(400).json({ success: false, message: 'Login email cannot be changed from the profile editor. Contact the super admin.', errors: { email: 'Login email cannot be changed from the profile editor. Contact the super admin.' } });
    }

    const doctorResponse = await applyDoctorProfileUpdate({ doctor, body: req.body, files: req.files });
    res.json({ success: true, data: doctorResponse });

  } catch (error) {
    next(error);
  }
};

exports.getDoctorProfile = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const doctor = await Doctor.findOne({ slug: slug }).select('-password');
    
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }
    
    res.json({ success: true, data: doctor });

  } catch (error) {
    next(error);
  }
};

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ slug: req.params.slug, 'personalDetails.email': req.body.email }).select('+authVersion');
    let challenge = { challengeId: crypto.randomBytes(12).toString('hex'), maskedEmail: 'your registered email', expiresInSeconds: 300 };
    if (doctor) {
      challenge = await issueChallenge({
        accountType: 'doctor',
        purpose: 'password-reset',
        accountId: doctor._id,
        email: doctor.personalDetails.email,
        metadata: { slug: doctor.slug, authVersion: doctor.authVersion || 0 }
      });
    }
    res.json({ success: true, message: 'If that email matches this doctor portal, a verification code has been sent.', ...challenge });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    let payload;
    try {
      payload = jwt.verify(req.body.resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Password reset session expired. Please start again.' });
    }
    if (payload.purpose !== 'password-reset' || payload.slug !== req.params.slug) {
      return res.status(401).json({ success: false, message: 'Invalid password reset session.' });
    }
    const doctor = await Doctor.findOne({ _id: payload.id, slug: req.params.slug, 'personalDetails.email': payload.email }).select('+authVersion');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor account not found.' });
    if ((doctor.authVersion || 0) !== payload.ver) {
      return res.status(401).json({ success: false, message: 'This password reset link has already been used. Please start again.' });
    }
    doctor.password = await bcrypt.hash(req.body.newPassword, 10);
    doctor.authVersion = (doctor.authVersion || 0) + 1;
    await doctor.save();
    await OtpChallenge.deleteMany({ accountType: 'doctor', purpose: 'password-reset', accountId: doctor._id });
    await sendPasswordResetConfirmation({ email: doctor.personalDetails.email });
    res.json({ success: true, message: 'Password updated successfully. Please sign in with your new password.' });
  } catch (error) {
    next(error);
  }
};

exports.getDoctorSession = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.doctorId).select('-password');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};
