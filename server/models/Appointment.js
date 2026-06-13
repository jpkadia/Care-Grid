const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  doctorSnapshot: {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    clinicName: String
  },
  patient: {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true }
  },
  treatment: { type: String, required: true, trim: true },
  preferredDate: { type: Date, required: true, index: true },
  timeSlot: { type: String, required: true, trim: true },
  message: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  source: { type: String, default: 'doctor-website' }
}, { timestamps: true });

AppointmentSchema.index({ doctor: 1, createdAt: -1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
