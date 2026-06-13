const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, required: true },
  theme: { type: String, default: 'gold-dark' },
  password: { type: String, required: true },
  authVersion: { type: Number, default: 0, select: false },
  personalDetails: {
    education: String,
    speciality: String,
    clinicName: String,
    location: String,
    phone: { type: String, required: true, match: /^\d{10}$/ },
    email: { type: String, required: true, lowercase: true, trim: true },
    workDays: String,
    visitingHours: String
  },
  photoUrl: String,
  sliderImages: [String],
  aiContent: {
    about: String,
    services: [String],
    tagline: String,
    heroHeadline: String
  }
}, { timestamps: true });

DoctorSchema.index({ 'personalDetails.email': 1 }, { unique: true });

module.exports = mongoose.model('Doctor', DoctorSchema);
