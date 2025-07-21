const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', required: true 
},
  description: { 
    type: String, 
    required: true },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
});

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
