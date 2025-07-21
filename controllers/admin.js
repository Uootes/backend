const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../utils/nodemailer');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;

const createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, role } = req.body;

    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Automatically assign superadmin role if email is uootes@gmail.com
    let assignedRole = role;
    if (email.toLowerCase() === 'uootes@gmail.com') {
      assignedRole = 'superadmin';
    } else if (!['admin', 'customerservice', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    const generatedPassword = crypto.randomBytes(6).toString('hex');

    const newAdmin = new Admin({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: generatedPassword,
      role: assignedRole
    });

    await newAdmin.save();

    // Send email with login details
    await sendEmail({
      email: newAdmin.email,
      subject: 'Your Admin Account Details',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #f2f2f2; padding: 20px;">
            <div style="max-width: 500px; margin: auto; background: #0C1D3C; padding: 30px; border-radius: 12px; color: white;">
              <h2 style="text-align: center; color: white;">Verify Your Email</h2>
              <p>Hi ${newAdmin.firstName},</p>
              <p>Your admin account has been created with the following credentials:</p>
              <p>Email: ${newAdmin.email}</p>
              <p>Password: ${generatedPassword}</p>
              <p>Please login and change your password if you wish.</p>
              <p style="margin-top: 30px;">The Uootes Team</p>
            </div>
          </body>
        </html>
      `
    });

    res.status(201).json({ message: 'Admin created and login details sent via email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create admin' });
  }
};

// Admin login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET);
    res.status(200).json({
      message: 'Admin logged in successfully',
      token,
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to login admin' });
  }
};

// Admin change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const adminId = req.admin.id;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to change password' });
  }
};

module.exports = {
  createAdmin,
  login,
  changePassword
};
