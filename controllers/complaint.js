const Complaint = require('../models/complaint');
const nodemailer = require('../utils/nodemailer');
const User = require('../models/user');
const Exchanger = require('../models/exchanger');

// Submit a new complaint (for customerservice)
const submitComplaint = async (req, res) => {
  try {
    const { description } = req.body;
    const customerId = req.user.id;

    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }

    const complaint = new Complaint({
      customerId,
      description,
      customerType: 'User' // Default for backward compatibility
    });

    await complaint.save();
    res.status(201).json({ message: 'Complaint submitted successfully', complaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to submit complaint' });
  }
};

// Submit complaint for users
const submitUserComplaint = async (req, res) => {
  try {
    const { description } = req.body;
    const customerId = req.user.id;

    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }

    const complaint = new Complaint({
      customerId,
      description,
      customerType: 'User'
    });

    await complaint.save();

    // Send automatic response email
    try {
      const user = await User.findById(customerId);
      if (user && user.email) {
        await nodemailer.sendEmail(
          user.email,
          'Complaint Received - We\'re Here to Help',
          `Dear ${user.firstName},\n\n${complaint.responseMessage}\n\nComplaint ID: ${complaint._id}\n\nBest regards,\nCustomer Support Team`
        );
      }
    } catch (emailError) {
      console.error('Failed to send response email:', emailError);
    }

    res.status(201).json({ 
      message: 'Complaint submitted successfully. You will receive a confirmation email shortly.',
      complaint: {
        _id: complaint._id,
        description: complaint.description,
        status: complaint.status,
        responseMessage: complaint.responseMessage,
        createdAt: complaint.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to submit complaint' });
  }
};

// Submit complaint for exchangers
const submitExchangerComplaint = async (req, res) => {
  try {
    const { description } = req.body;
    const customerId = req.user.id;

    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }

    const complaint = new Complaint({
      customerId,
      description,
      customerType: 'Exchanger'
    });

    await complaint.save();

    // Send automatic response email
    try {
      const exchanger = await Exchanger.findById(customerId);
      if (exchanger && exchanger.email) {
        await nodemailer.sendEmail(
          exchanger.email,
          'Complaint Received - We\'re Here to Help',
          `Dear ${exchanger.firstName},\n\n${complaint.responseMessage}\n\nComplaint ID: ${complaint._id}\n\nBest regards,\nCustomer Support Team`
        );
      }
    } catch (emailError) {
      console.error('Failed to send response email:', emailError);
    }

    res.status(201).json({ 
      message: 'Complaint submitted successfully. You will receive a confirmation email shortly.',
      complaint: {
        _id: complaint._id,
        description: complaint.description,
        status: complaint.status,
        responseMessage: complaint.responseMessage,
        createdAt: complaint.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to submit complaint' });
  }
};

// Get all complaints (for customerservice)
const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('resolvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    // Manually populate customer data based on customerType
    const populatedComplaints = await Promise.all(
      complaints.map(async (complaint) => {
        let customerData = null;
        if (complaint.customerType === 'User') {
          customerData = await User.findById(complaint.customerId).select('firstName lastName email');
        } else if (complaint.customerType === 'Exchanger') {
          customerData = await Exchanger.findById(complaint.customerId).select('firstName lastName email');
        }
        
        return {
          ...complaint.toObject(),
          customerId: customerData
        };
      })
    );
    
    res.status(200).json({ complaints: populatedComplaints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch complaints' });
  }
};

// Resolve a complaint
const resolveComplaint = async (req, res) => {
  try {
    const complaintId = req.params.id;
    const adminId = req.admin.id;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.status === 'resolved') {
      return res.status(400).json({ message: 'Complaint already resolved' });
    }

    complaint.status = 'resolved';
    complaint.resolvedAt = new Date();
    complaint.resolvedBy = adminId;

    await complaint.save();
    res.json({ message: 'Complaint resolved successfully', complaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to resolve complaint' });
  }
};

module.exports = {
  submitComplaint,
  submitUserComplaint,
  submitExchangerComplaint,
  getComplaints,
  resolveComplaint
};
