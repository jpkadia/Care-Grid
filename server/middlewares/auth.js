const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Unauthorized Access" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'doctor') {
      return res.status(403).json({ success: false, message: "Forbidden: Doctor access required" });
    }
    const doctor = await Doctor.findById(decoded.id).select('+authVersion');
    if (!doctor || decoded.ver !== (doctor.authVersion || 0)) {
      return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
    }
    req.doctorId = decoded.id;
    req.doctor = doctor;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

module.exports = verifyToken;
