// models/AdminUser.js
const mongoose = require('mongoose');

const AdminUserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, default: 'admin123' },
  role: { type: String, enum: ['super_admin', 'admin'], default: 'admin' },
  source: { type: String, enum: ['worker', 'contractor', 'manual', 'system'], default: 'manual' },
  addedBy: { type: String },
  addedOn: { type: Date, default: Date.now },
  canManageAdmins: { type: Boolean, default: false }
});

module.exports = mongoose.model('AdminUser', AdminUserSchema);