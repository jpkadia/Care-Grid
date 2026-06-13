const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const ChatConversation = require('../models/ChatConversation');
const { answerFromAdminData } = require('../services/adminChat');

const summarizeAppointments = (appointments) => appointments.map(appointment => ({
  id: appointment._id,
  doctor: appointment.doctorSnapshot,
  patient: { name: appointment.patient?.name },
  treatment: appointment.treatment,
  preferredDate: appointment.preferredDate,
  timeSlot: appointment.timeSlot,
  status: appointment.status,
  createdAt: appointment.createdAt
}));

const summarizeDoctor = doctor => ({
  id: doctor._id,
  name: doctor.name,
  slug: doctor.slug,
  theme: doctor.theme,
  clinic: {
    name: doctor.personalDetails?.clinicName,
    speciality: doctor.personalDetails?.speciality,
    location: doctor.personalDetails?.location,
    workDays: doctor.personalDetails?.workDays,
    visitingHours: doctor.personalDetails?.visitingHours
  }
});

const saveExchange = async (ownerType, owner, message, answer) => {
  const conversation = await ChatConversation.findOneAndUpdate(
    { ownerType, owner },
    {
      $push: {
        messages: {
          $each: [
            { role: 'user', content: message },
            { role: 'assistant', content: answer }
          ],
          $slice: -200
        }
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return conversation.messages;
};

const getHistory = async (ownerType, owner) => {
  const conversation = await ChatConversation.findOne({ ownerType, owner }).select('messages');
  return conversation?.messages || [];
};

exports.getDoctorChatHistory = async (req, res, next) => {
  try {
    const doctor = req.doctor || await Doctor.findById(req.doctorId).select('_id');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: await getHistory('doctor', doctor._id) });
  } catch (error) {
    next(error);
  }
};

exports.getSuperAdminChatHistory = async (req, res, next) => {
  try {
    res.json({ success: true, data: await getHistory('admin', req.adminId) });
  } catch (error) {
    next(error);
  }
};

exports.doctorChat = async (req, res, next) => {
  try {
    const doctor = req.doctor || await Doctor.findById(req.doctorId).select('-password');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    const appointments = await Appointment.find({ doctor: doctor._id }).sort({ createdAt: -1 }).limit(200);
    const answer = await answerFromAdminData({
      role: 'doctor admin',
      message: req.body.message,
      history: req.body.history,
      context: { doctor: summarizeDoctor(doctor), appointments: summarizeAppointments(appointments) }
    });
    await saveExchange('doctor', doctor._id, req.body.message, answer);
    res.json({ success: true, answer });
  } catch (error) {
    next(error);
  }
};

exports.superAdminChat = async (req, res, next) => {
  try {
    const [doctors, appointments] = await Promise.all([
      Doctor.find().select('-password').sort({ createdAt: -1 }),
      Appointment.find().sort({ createdAt: -1 }).limit(500)
    ]);
    const answer = await answerFromAdminData({
      role: 'super admin',
      message: req.body.message,
      history: req.body.history,
      context: {
        totals: { doctors: doctors.length, appointments: appointments.length },
        doctors: doctors.map(summarizeDoctor),
        appointments: summarizeAppointments(appointments)
      }
    });
    await saveExchange('admin', req.adminId, req.body.message, answer);
    res.json({ success: true, answer });
  } catch (error) {
    next(error);
  }
};
