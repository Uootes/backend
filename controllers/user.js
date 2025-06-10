const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const generateReferralCode = require('../utils/generateReferralCode');
const { sendEmail } = require('../utils/nodemailer');
const { createWallet } = require('./wallet');


const JWT_SECRET = process.env.JWT_SECRET;

// Signup
const register = async (req, res) => {
  try {
    const { email, pin, referralCode } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ message: 'Email already in use' });

    const pinHash = await bcrypt.hash(pin, 10);
    const userReferralCode = generateReferralCode();

    const newUser = new User({
      email,
      pinHash,
      referralCode: userReferralCode,
      referredBy: referralCode || null
    });

    await createWallet(newUser._id);
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET);
    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    cconsole.log(error.message)
    res.status(500).json({ message: 'Failed to register user' + error });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, pin } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePIN(pin))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.status(200).json({ message: 'User logged in successfully', token });
  } catch (error) {
    res.status(500).json({ message: 'Failed to login user' });
  }
};



const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP and expiration (e.g., 15 minutes) to user document
    user.passwordResetOtp = otp;
    user.passwordResetOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail({
      email: rider.email,
      subject: 'Reset your Password',
      html: `
      <!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 8px;">
      <h2 style="color: #9B3EFF;">Reset Your Uootes Password</h2>
      <p>Hi there ,</p>
      <p>You requested to reset your password. Use the OTP code below to proceed:</p>
      <h1 style="text-align: center; letter-spacing: 4px; font-size: 36px;">${otp}</h1>
      <p>This code will expire in <strong>10 minutes</strong>.</p>
      <p>If you didn't make this request, just ignore this email.</p>
      <p style="margin-top: 30px;">– The Uootes Team</p>
    </div>
  </body>
</html>
    `})

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP: ' + error.message });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPin } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check OTP and expiration
    if (
      !user.passwordResetOtp ||
      user.passwordResetOtp !== otp ||
      !user.passwordResetOtpExpires ||
      user.passwordResetOtpExpires < Date.now()
    ) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Hash the new PIN and update user
    const pinHash = await bcrypt.hash(newPin, 10);
    user.pinHash = pinHash;

    // Clear OTP fields after successful reset
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password: ' + error.message });
  }
};


// Activate Account
const activate = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.balance >= 2.15) {
    user.balance -= 2.15;
    user.activationStatus = true;
    await user.save();
    res.json({ message: 'Account activated' });
  } else {
    res.status(400).json({ message: 'Insufficient balance to activate account' });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  activate
}