const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const generateReferralCode = require('../utils/generateReferralCode');
const { sendEmail } = require('../utils/nodemailer');
const { initReferral, promoteVisitorToReferral } = require('./referral');
const { createWallet } = require('./userWallet');
const userWallet = require('../models/userWallet');
const { getActivationToken } = require('../utils/companyWallet');
const cloudinary = require('../config/cloudinary');
const fs = require('fs')

const JWT_SECRET = process.env.JWT_SECRET;

// Signup
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, country, referralCode } = req.body;

    let result = null;
    if (req.file) {
      try {
        result = await cloudinary.uploader.upload(req.file.path);
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload profile picture' });
      }
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword || !country) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      if (result) {
        await cloudinary.uploader.destroy(result.public_id)
      }
      return res.status(400).json({
        message: `User with email: ${email} already exists`
      })
    };
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
      accountType: referralCode ? 'Silver' : 'Bronze',
      profilePicture: result ? {
        imageUrl: result.secure_url,
        publicId: result.public_id
      } : null,
      referralCode: userReferralCode,
      referredBy: referrerUser ? referrerUser._id : null,
    });
    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP and expiration (10 minutes)
    newUser.passwordResetOtp = otp;
    newUser.passwordResetOtpExpires = Date.now() + 10 * 60 * 1000;

    await newUser.save();
    await sendEmail({
      email: newUser.email,
      subject: 'Otp Verification',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #f2f2f2; padding: 20px;">
            <div style="max-width: 500px; margin: auto; background: #0C1D3C; padding: 30px; border-radius: 12px; color: white;">
              <h2 style="text-align: center; color: white;">Verify Your Email</h2>
              <p>Hi ${newUser.firstName},</p>
              <p>Use the OTP code below to verify your account:</p>

              <div style="display: flex; justify-content: space-between; margin: 30px 0; gap: 10px;">
                ${otp.split('').map(char => `
                  <div style="flex: 1; text-align: center; font-size: 28px; font-weight: bold; padding: 15px 0; border-radius: 8px; background: #10254A; border: 1px solid #3C5A99;">
                    ${char}
                  </div>
                `).join('')}
              </div>

              <p>This code will expire in <strong>10 minutes</strong>.</p>
              <p>If you didn’t request this, you can ignore this email.</p>
              <p style="margin-top: 30px;">The Uootes Team</p>
            </div>
          </body>
        </html>
      `
    });
    await createWallet(newUser._id);

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET);

    const newUserName = `${newUser.firstName} ${newUser.lastName}`;
    await initReferral(newUser._id, referrerUser?._id || null, newUserName);

    // Send email to referrer (unchanged, as it's just a notification)
    if (referrerUser) {
      await sendEmail({
        email: referrerUser.email,
        subject: 'You’ve Got a New Referral!',
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; background: #f2f2f2; padding: 20px;">
              <div style="max-width: 500px; margin: auto; background: #0C1D3C; padding: 30px; border-radius: 12px; color: white;">
                <h2 style="text-align: center; color: white;">🎉 You’ve Earned a Referral</h2>
                <p>Hi ${referrerUser.firstName},</p>
                <p><strong>${newUser.firstName} ${newUser.lastName}</strong> just signed up using your referral code <strong>${referrerUser.referralCode}</strong>.</p>
                <p>Thanks for spreading the word! Keep referring to earn more rewards 🎁.</p>

                <p>Cheers,</p>
                <p>The Uootes Team</p>
              </div>
            </body>
          </html>
        `
      });
    }

    res.status(201).json({
      message: 'User registered successfully, OTP sent to email',
      token,
      data: newUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to register user: ' + error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const user = await User.findOne({ passwordResetOtp: otp });
    if (!user) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (!user.passwordResetOtpExpires || user.passwordResetOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Mark user as verified (add emailVerified field if not present)
    user.emailVerified = true;

    // Clear OTP fields
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to verify OTP: ' + error.message });
  }
};
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
          <body style="font-family: Arial, sans-serif; background: #f2f2f2; padding: 20px;">
            <div style="max-width: 500px; margin: auto; background: #0C1D3C; padding: 30px; border-radius: 12px; color: white;">
              <h2 style="text-align: center; color: white;">Reset Your Password</h2>
              <p>Hi ${user.firstName},</p>
              <p>You requested to reset your password. Use the OTP code below to proceed:</p>
              
              <div style="display: flex; justify-content: space-between; margin: 30px 0; gap: 10px;">
                ${otp.split('').map(char => `
                  <div style="flex: 1; text-align: center; font-size: 28px; font-weight: bold; padding: 15px 0; border-radius: 8px; background: #10254A; border: 1px solid #3C5A99;">
                    ${char}
                  </div>
                `).join('')}
              </div>
    
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
    const { newPassword, confirmPassword } = req.body;
    const { id: userId } = req.params;
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      })
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: 'Password do not match'
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt)
    user.password = hashedPassword
    await user.save();

    res.status(200).json({
      message: 'Password reset successful'
    })

  } catch (error) {
    res.status(500).json({
      message: 'Error reseting password', error
    });

  }
}

// Activate Account
const activate = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const wallet = await userWallet.findOne({ userId: user._id });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    if (wallet.GSCBalance >= 2.15) {
      wallet.GSCBalance -= 2.15;
      user.activationStatus = "active";
      await getActivationToken(2.15);
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
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  activate
};