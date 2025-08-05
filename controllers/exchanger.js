const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Exchanger = require('../models/exchanger');
const { sendEmail } = require('../utils/nodemailer');
const exchangerWallet = require('../models/userWallet');
const { createWallet } = require('./exhangerWallet');
const cloudinary = require('../config/cloudinary');
const fs = require('fs')
const JWT_SECRET = process.env.JWT_SECRET;

// Signup
const register = async (req, res) => {
   try {
    const { firstName, lastName, country, email, password, confirmPassword } = req.body;

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
    if (!firstName || !lastName || !country || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingExchanger = await Exchanger.findOne({ email: email.toLowerCase() });
    if (existingExchanger) { 
      if (result) {
        await cloudinary.uploader.destroy(result.public_id)
      }
      return res.status(400).json({
        message: `User with email: ${email} already exists`
      })
    }
    const passwordHash = await bcrypt.hash(password, 10);

    const newExchanger = new Exchanger({
        firstName,
        lastName,
        country,
        email: email.toLowerCase(),
        password: passwordHash,
        kycStatus: 'pending',
        accountType: 'regular',
        activationStatus: false,
        profilePicture: result ? {
          imageUrl: result.secure_url,
          publicId: result.public_id
        } : null
    });

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP and expiration (10 minutes)
    newExchanger.passwordResetOtp = otp;
    newExchanger.passwordResetOtpExpires = Date.now() + 10 * 60 * 1000;

    await createWallet(newExchanger._id);
    await newExchanger.save();

    await sendEmail({
      email: newExchanger.email,
      subject: 'OTP Verification',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #f2f2f2; padding: 20px;">
            <div style="max-width: 500px; margin: auto; background: #0C1D3C; padding: 30px; border-radius: 12px; color: white;">
              <h2 style="text-align: center; color: white;">Verify Your Email</h2>
              <p>Hi ${newExchanger.firstName},</p>
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

    const token = jwt.sign({ id: newExchanger._id }, JWT_SECRET);
    res.status(201).json({ 
      message: 'Exchanger registered successfully, OTP sent to Mail', 
      token,
      data: newExchanger
    });  
   } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Failed to register exchanger: ' + error.message });
   }
};
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const exchanger = await Exchanger.findOne({ passwordResetOtp: otp });
    if (!exchanger) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (!exchanger.passwordResetOtpExpires || exchanger.passwordResetOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Mark exchanger as verified (add emailVerified field if not present)
    exchanger.emailVerified = true;

    // Clear OTP fields
    exchanger.passwordResetOtp = undefined;
    exchanger.passwordResetOtpExpires = undefined;

    await exchanger.save();

    res.status(200).json({ message: 'verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to verify OTP: ' + error.message });
  }
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
        email: exchanger.email,
        country: exchanger.country,
        accountType: exchanger.accountType,
        activationStatus: exchanger.activationStatus,
        profilePicture: exchanger.profilePicture
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
          <body style="font-family: Arial, sans-serif; background: #f2f2f2; padding: 20px;">
            <div style="max-width: 500px; margin: auto; background: #0C1D3C; padding: 30px; border-radius: 12px; color: white;">
              <h2 style="text-align: center; color: white;">Reset Your Password</h2>
              <p>Hi ${exchanger.firstName},</p>
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
    res.status(500).json({ message: 'Failed to send OTP: ' + error.message });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword, confirmPassword } = req.body;
    
    // Validate required fields
    if (!otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: 'OTP, new password, and confirm password are required'
      });
    }

    // Find exchanger by OTP
    const exchanger = await Exchanger.findOne({ passwordResetOtp: otp });
    if (!exchanger) {
      return res.status(400).json({
        message: 'Invalid OTP'
      });
    }

    // Check if OTP is expired
    if (!exchanger.passwordResetOtpExpires || exchanger.passwordResetOtpExpires < Date.now()) {
      return res.status(400).json({
        message: 'OTP has expired'
      });
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match'
      });
    }

    // Hash new password and update exchanger
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    exchanger.password = hashedPassword;
    
    // Clear OTP fields
    exchanger.passwordResetOtp = undefined;
    exchanger.passwordResetOtpExpires = undefined;
    
    await exchanger.save();

    res.status(200).json({
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      message: 'Error resetting password',
      error: error.message
    });
  }
}
const getProfile = async (req, res) => {
  try {
    const exchanger = await Exchanger.findById(req.user.id).select('firstName lastName email country accountType activationStatus profilePicture');
    if (!exchanger) {
      return res.status(404).json({ message: 'Exchanger not found' });
    }
    res.json({ profile: exchanger });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, country } = req.body;
    const exchanger = await Exchanger.findById(req.user.id);
    if (!exchanger) {
      return res.status(404).json({ message: 'Exchanger not found' });
    }
    if (firstName) exchanger.firstName = firstName;
    if (lastName) exchanger.lastName = lastName;
    if (country) exchanger.country = country;

    await exchanger.save();
    res.json({ message: 'Profile updated successfully', profile: exchanger });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const exchanger = await Exchanger.findById(req.user.id);
    if (!exchanger) {
      return res.status(404).json({ message: 'Exchanger not found' });
    }

    // Upload new image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);
    // Delete local file after upload
    fs.unlinkSync(req.file.path);

    // Delete old profile picture from cloudinary if exists
    if (exchanger.profilePicture && exchanger.profilePicture.publicId) {
      await cloudinary.uploader.destroy(exchanger.profilePicture.publicId);
    }

    // Update exchanger profile picture
    exchanger.profilePicture = {
      imageUrl: result.secure_url,
      publicId: result.public_id
    };

    await exchanger.save();

    res.json({ message: 'Profile picture updated successfully', profilePicture: exchanger.profilePicture });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to upload profile picture' });
  }
};

module.exports = {
    register,
    verifyOtp,
    login,
    forgotPassword,
    resetPassword,
    getProfile,
    updateProfile,
    uploadProfilePicture
};
