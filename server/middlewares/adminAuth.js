const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const verifyAdminToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Unauthorized Access" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'superadmin') {
        return res.status(403).json({ success: false, message: "Forbidden: Super Admin access required" });
    }
    const adminExists = await Admin.exists({ _id: decoded.id });
    if (!adminExists) return res.status(401).json({ success: false, message: 'Admin session is no longer valid' });
    req.adminId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

module.exports = verifyAdminToken;
