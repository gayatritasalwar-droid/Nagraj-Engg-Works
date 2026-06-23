const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  applicationId: { type: String, unique: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  experience: { type: String, default: '0' },
  status: { 
    type: String, 
    default: 'pending_ceo'
  },
  salary: { type: Number, default: null },
  dailyRate: { type: Number, default: null },
  joiningDate: { type: Date, default: null },
  bondYears: { type: Number, default: 2 },
  esiPfPercentage: { type: Number, default: 3.25 },
  applyESI: { type: Boolean, default: false },
  subDept: { type: String, default: 'Others' },
  category: { type: String, default: 'Non-Muster' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Worker', WorkerSchema);