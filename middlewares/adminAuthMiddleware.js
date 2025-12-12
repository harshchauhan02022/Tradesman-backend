// middlewares/adminAuthMiddleware.js
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
require('dotenv').config();

exports.verifyAdminToken = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ success: false, message: 'No token provided' });

    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Invalid token format' });

    const token = parts[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: e.message || 'Invalid token' });
    }

    const admin = await Admin.findByPk(decoded.id);
    if (!admin) return res.status(401).json({ success: false, message: 'Admin not found' });

    req.user = { id: admin.id, role: admin.role, name: admin.name, email: admin.email };
    next();
  } catch (err) {
    console.error('verifyAdminToken error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
