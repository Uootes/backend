const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  customerType: {
    type: String,
    enum: ['User', 'Exchanger'],
    required: true
  },
  description: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['open', 'resolved'], 
    default: 'open' 
  },
  responseMessage: {
    type: String,
    default: 'Thank you for your complaint. We have received it and will review it carefully. Our team will work to resolve your issue and get back to you as soon as possible.'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  resolvedAt: { 
    type: Date 
  },
  resolvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin' 
  }
});

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
