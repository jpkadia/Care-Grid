const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

exports.createAppointment = async (req, res, next) => {
  try {
    const requestedDate = new Date(req.body.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (requestedDate < today) {
      return res.status(400).json({ success: false, message: 'Preferred date cannot be in the past' });
    }

    const doctor = await Doctor.findOne({ slug: req.params.slug }).select('name slug personalDetails.clinicName');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const appointment = await Appointment.create({
      doctor: doctor._id,
      doctorSnapshot: {
        name: doctor.name,
        slug: doctor.slug,
        clinicName: doctor.personalDetails?.clinicName || ''
      },
      patient: {
        name: req.body.patientName,
        phone: req.body.phone,
        email: req.body.email || ''
      },
      treatment: req.body.treatment,
      preferredDate: req.body.preferredDate,
      timeSlot: req.body.timeSlot,
      message: req.body.message || ''
    });

    res.status(201).json({
      success: true,
      message: 'Appointment request submitted successfully',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

exports.getDoctorAppointments = async (req, res, next) => {
  try {
    const doctor = req.doctor || await Doctor.findById(req.doctorId).select('_id');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const appointments = await Appointment.find({ doctor: doctor._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};

exports.updateDoctorAppointmentStatus = async (req, res, next) => {
  try {
    const doctor = req.doctor || await Doctor.findById(req.doctorId).select('_id');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.appointmentId, doctor: doctor._id },
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

exports.getAllAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find()
      .populate('doctor', 'name slug personalDetails.clinicName')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};

exports.updateAppointmentStatusAsAdmin = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};
