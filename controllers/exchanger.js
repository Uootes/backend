const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Exchanger = require('../models/exchanger');
const { sendEmail } = require('../utils/nodemailer');

const exchangerWallet = require('../models/userWallet');

const JWT_SECRET = process.env.JWT_SECRET;

// Signup
const register = async (req, res) => {
   try {
    const { email, pin } = req.body;

    const existingExchanger = await Exchanger.findOne({ email: email.toLowerCase() });
    if (existingExchanger) return res.status(400).json({ message: 'Email already in use' });

    const pinHash = await bcrypt.hash(pin, 10);

    const newExchanger = new Exchanger({
        email,
        pinHash
    });

    await newExchanger.save();

    const token = jwt.sign({ id: newExchanger._id }, JWT_SECRET);
    res.status(201).json({ message: 'Exchanger registered successfully', token });  
   } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Failed to register exchanger' + error});
   }
};

// Login
const login = async (req, res) => {
   try {
    const { email, pin } = req.body;
    const exchanger = await Exchanger.findOne({ email : email.toLowerCase()});
    if (!exchanger || !(await exchanger.comparePIN(pin))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: exchanger._id }, JWT_SECRET);
    res.status(200).json({ message: 'Exchanger logged in successfully', token });
   } catch (error) {
    res.status(500).json({ message: 'Failed to login exchanger' });
   }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const exchanger = await Exchanger.findOne({ email: email.toLowerCase() });
    if (!exchanger) return res.status(404).json({ message: 'Exchanger not found' });

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP and expiration (e.g., 15 minutes) to exchanger document
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
      <p>Hi there ,</p>
      <p>You requested to reset your password. Use the OTP code below to proceed:</p>
      <h1 style="text-align: center; letter-spacing: 4px; font-size: 36px;">${otp}</h1>
      <p>This code will expire in <strong>10 minutes</strong>.</p>
      <p>If you didn't make this request, just ignore this email.</p>
      <p style="margin-top: 30px;">– The Team</p>
    </div>
  </body>
</html>
    `});
   
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP: ' + error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPin } = req.body;

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

    // Hash the new PIN and update exchanger
    const pinHash = await bcrypt.hash(newPin, 10);
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
