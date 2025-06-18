const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Exchanger = require('../models/exchanger');
const { sendEmail } = require('../utils/nodemailer');

const JWT_SECRET = process.env.JWT_SECRET;

// Signup
const register = async (req, res) => {
   try {
    const { firstName, lastName, country, email, password, confirmPassword } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !country || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingExchanger = await Exchanger.findOne({ email: email.toLowerCase() });
    if (existingExchanger) return res.status(400).json({ message: 'Email already in use' });

    const pinHash = await bcrypt.hash(password, 10);

    const newExchanger = new Exchanger({
        firstName,
        lastName,
        country,
        email: email.toLowerCase(),
        pinHash,
        kycStatus: 'pending',
        accountType: 'regular',
        activationStatus: false
    });

    await newExchanger.save();

    // Send welcome email
    await sendWelcomeEmail(newExchanger.email, newExchanger.firstName);

    const token = jwt.sign({ id: newExchanger._id }, JWT_SECRET);
    res.status(201).json({ 
      message: 'Exchanger registered successfully', 
      token,
      user: {
        id: newExchanger._id,
        firstName: newExchanger.firstName,
        lastName: newExchanger.lastName,
        email: newExchanger.email
      }
    });  
   } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Failed to register exchanger: ' + error.message });
   }
};

// Helper function for welcome email
const sendWelcomeEmail = async (email, firstName) => {
  await sendEmail({
    email: email,
    subject: 'Welcome to Our Exchange Platform',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
          <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 8px;">
            <h2 style="color: #9B3EFF;">Welcome to Our Exchange Platform</h2>
            <p>Hi ${firstName},</p>
            <p>Thank you for registering with us! Your account has been successfully created.</p>
            <p>You can now log in to your account and start exchanging.</p>
            <p style="margin-top: 30px;">– The Team</p>
          </div>
        </body>
      </html>
    `
  });
};

// Login remains the same as before
const login = async (req, res) => {
   try {
    const { email, password } = req.body;
    const exchanger = await Exchanger.findOne({ email: email.toLowerCase() });
    if (!exchanger || !(await exchanger.comparePIN(password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: exchanger._id }, JWT_SECRET);
    res.status(200).json({ 
      message: 'Exchanger logged in successfully', 
      token,
      user: {
        id: exchanger._id,
        firstName: exchanger.firstName,
        lastName: exchanger.lastName,
        email: exchanger.email
      }
    });
   } catch (error) {
    res.status(500).json({ message: 'Failed to login exchanger: ' + error.message });
   }
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const exchanger = await Exchanger.findOne({ email: email.toLowerCase() });
    if (!exchanger) return res.status(404).json({ message: 'Exchanger not found' });

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP and expiration (10 minutes)
    exchanger.passwordResetOtp = otp;
    exchanger.passwordResetOtpExpires = Date.now() + 10 * 60 * 1000;
    await exchanger.save();

    await sendEmail({
      email: exchanger.email,
      subject: 'Reset your Password',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
            <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 8px;">
              <h2 style="color: #9B3EFF;">Reset Your Password</h2>
              <p>Hi ${exchanger.firstName},</p>
              <p>You requested to reset your password. Use the OTP code below to proceed:</p>
              <h1 style="text-align: center; letter-spacing: 4px; font-size: 36px;">${otp}</h1>
              <p>This code will expire in <strong>10 minutes</strong>.</p>
              <p>If you didn't make this request, just ignore this email.</p>
              <p style="margin-top: 30px;">– The Team</p>
            </div>
          </body>
        </html>
      `
    });

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP: ' + error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword, confirmPassword } = req.body;

    if ( !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const exchanger = await Exchanger.findOne({ email: email.toLowerCase() });
    if (!exchanger) return res.status(404).json({ message: 'Exchanger not found' });

    // Check OTP and expiration
    if (
      !exchanger.passwordResetOtp ||
      exchanger.passwordResetOtp !== otp ||
      !exchanger.passwordResetOtpExpires ||
      exchanger.passwordResetOtpExpires < Date.now()
    ) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Hash the new password and update exchanger
    const pinHash = await bcrypt.hash(newPassword, 10);
    exchanger.pinHash = pinHash;

    // Clear OTP fields after successful reset
    exchanger.passwordResetOtp = undefined;
    exchanger.passwordResetOtpExpires = undefined;

    await exchanger.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password: ' + error.message });
  }
};

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword
};
