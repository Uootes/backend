const Complaint = require('../models/complaint');

// Submit a new complaint
const submitComplaint = async (req, res) => {
  try {
    const { description } = req.body;
    const customerId = req.user.id;

    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }

    const complaint = new Complaint({
      customerId,
      description
    });

    await complaint.save();
    res.status(201).json({ message: 'Complaint submitted successfully', complaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to submit complaint' });
  }
};

// Get all complaints (for customerservice)
const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('customerId', 'firstName lastName email').sort({ createdAt: -1 });
    res.json({ complaints });
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
  getComplaints,
  resolveComplaint
};
