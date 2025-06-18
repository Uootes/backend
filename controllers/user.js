const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const generateReferralCode = require('../utils/generateReferralCode');
const { sendEmail } = require('../utils/nodemailer');
const { initReferral, promoteVisitorToReferral, upgradeAccount } = require('./referral');
const { createWallet } = require('./userWallet');
const userWallet = require('../models/userWallet');

const JWT_SECRET = process.env.JWT_SECRET;

// Signup
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, country, referralCode } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword || !country) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ message: 'Email already in use' });

    // Check referral code validity before creating user
    let referrerUser = null;
    if (referralCode) {
      referrerUser = await User.findOne({ referralCode });
      if (!referrerUser) {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userReferralCode = generateReferralCode();

    if (!userReferralCode) {
      return res.status(500).json({ message: 'Failed to generate referral code' });
    }

    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash,
      country,
      referralCode: userReferralCode,
      referredBy: referrerUser ? referrerUser._id : null,
    });

    await newUser.save();
    await createWallet(newUser._id);

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET);

    // Initialize referral relationship
    await initReferral(newUser._id, referrerUser?._id || null);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        userReferralCode
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to register user: ' + error.message });
  }
}

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.status(200).json({
      message: 'User logged in successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to login user' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP and expiration (10 minutes)
    user.passwordResetOtp = otp;
    user.passwordResetOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail({
      email: user.email,
      subject: 'Reset your Password',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
            <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 8px;">
              <h2 style="color: #9B3EFF;">Reset Your Password</h2>
              <p>Hi ${user.firstName},</p>
              <p>You requested to reset your password. Use the OTP code below to proceed:</p>
              <h1 style="text-align: center; letter-spacing: 4px; font-size: 36px;">${otp}</h1>
              <p>This code will expire in <strong>10 minutes</strong>.</p>
              <p>If you didn't make this request, just ignore this email.</p>
              <p style="margin-top: 30px;">The Uootes Team</p>
            </div>
          </body>
        </html>
      `
    });

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send OTP: ' + error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword, confirmPassword } = req.body;

    if (!otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await User.findOne({ passwordResetOtp: otp });
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

    // Hash the new password and update user
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;

    // Clear OTP fields after successful reset
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to reset password: ' + error.message });
  }
};

// Activate Account
const activate = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const wallet = await userWallet.findOne({ userId: user._id });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    if (wallet.GSCBalance >= 2.15) {
      wallet.GSCBalance -= 2.15;
      user.activationStatus = true;
      await promoteVisitorToReferral(user._id);
      await wallet.save();
      await user.save();
      res.json({ message: 'Account activated' });
    } else {
      res.status(400).json({ message: 'Insufficient balance to activate account' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to activate account' });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  activate
};