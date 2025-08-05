const Admin = require('../models/admin');
const User = require('../models/user');
const Exchanger = require('../models/exchanger');
const CompanyWallet = require('../models/companyWallet');
const Transaction = require('../models/transaction');
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

// Admin forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    admin.passwordResetOtp = otp;
    admin.passwordResetOtpExpires = otpExpires;
    await admin.save();

    await sendEmail({
      email: admin.email,
      subject: 'Password Reset OTP',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #f2f2f2; padding: 20px;">
            <div style="max-width: 500px; margin: auto; background: #0C1D3C; padding: 30px; border-radius: 12px; color: white;">
              <h2 style="text-align: center; color: white;">Password Reset OTP</h2>
              <p>Hi ${admin.firstName},</p>
              <p>Your password reset OTP is: <strong>${otp}</strong></p>
              <p>This OTP will expire in 10 minutes.</p>
              <p style="margin-top: 30px;">The Uootes Team</p>
            </div>
          </body>
        </html>
      `
    });

    res.json({ message: 'Password reset OTP sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send password reset OTP' });
  }
};

// Admin reset password
const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword, confirmPassword } = req.body;

    if (!otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'OTP, new password, and confirm password are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const admin = await Admin.findOne({
      passwordResetOtp: otp,
      passwordResetOtpExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    admin.password = newPassword;
    admin.passwordResetOtp = undefined;
    admin.passwordResetOtpExpires = undefined;
    await admin.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// Admin dashboard overview
const getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activatedUsers = await User.countDocuments({ activationStatus: true });
    const bronzeUsers = await User.countDocuments({ accountType: 'Bronze' });
    const silverUsers = await User.countDocuments({ accountType: 'Silver' });
    const goldUsers = await User.countDocuments({ accountType: 'Gold' });
    const totalExchangers = await Exchanger.countDocuments();
    
    // Get today's active users
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyActiveUsers = await User.countDocuments({
      lastLogin: { $gte: today }
    });

    // Get company wallet data
    const companyWallet = await CompanyWallet.findOne();
    
    const dashboard = {
      users: {
        total: totalUsers,
        activated: activatedUsers,
        dailyActive: dailyActiveUsers,
        bronze: bronzeUsers,
        silver: silverUsers,
        gold: goldUsers
      },
      exchangers: totalExchangers,
      wallet: {
        cpt: {
          supplyBalance: companyWallet?.supplyBalance || 0,
          demand: 0, // Calculate based on requirements
          burned: 0, // Calculate based on requirements
          circulation: 0 // Calculate based on requirements
        },
        income: {
          revenueBalance: companyWallet?.revenueBalance || 0,
          poolBalance: companyWallet?.poolBalance || 0,
          companyBalance: companyWallet?.companyBalance || 0,
          accumulateBalance: companyWallet?.accumulation || 0
        }
      },
      cptSales: {
        milestone: '5 Billion of 5 Trillion',
        progress: '0/1,000',
        batches: '1&2'
      }
    };

    res.json(dashboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
};

// Get all users with search functionality
const getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, accountType, status } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { referralId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (accountType) {
      query.accountType = accountType;
    }
    
    if (status) {
      query.activationStatus = status === 'activated';
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Token management - get current settings
const getTokenSettings = async (req, res) => {
  try {
    const companyWallet = await CompanyWallet.findOne();
    
    const settings = {
      supplyBalance: companyWallet?.supplyBalance || 0,
      cptBuyingPrice: 0.00004, // GSC
      cptSellingPrice: {
        bronze: 0.0000301, // GSC
        silver: 0.0000258, // GSC
        gold: 0.0000215 // GSC
      },
      activationFee: 2.5, // Updated to 2.5 GSC
      depositLimits: {
        min: 5, // GSC
        max: 1000000 // USD
      },
      withdrawalLimits: {
        min: 100, // GSC
        max: 1000000 // GSC
      }
    };
    
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch token settings' });
  }
};

// Update token settings
const updateTokenSettings = async (req, res) => {
  try {
    const {
      supplyBalance,
      cptBuyingPrice,
      cptSellingPrice,
      activationFee,
      depositLimits,
      withdrawalLimits
    } = req.body;
    
    // Update company wallet if needed
    if (supplyBalance !== undefined) {
      await CompanyWallet.findOneAndUpdate(
        {},
        { supplyBalance },
        { upsert: true }
      );
    }
    
    // Here you would typically store these settings in a configuration collection
    // For now, we'll just return success
    
    res.json({ message: 'Token settings updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update token settings' });
  }
};

// Suspend/Activate user account
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; // 'suspend' or 'activate'
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (action === 'suspend') {
      user.activationStatus = false;
    } else if (action === 'activate') {
      user.activationStatus = true;
    }
    
    await user.save();
    
    res.json({ message: `User ${action}d successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};

// Get user transaction history
const getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Transaction.countDocuments({ userId });
    
    res.json({
      transactions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch user transactions' });
  }
};

// Withdraw from company balance
const withdrawFromCompanyBalance = async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    
    const companyWallet = await CompanyWallet.findOne();
    if (!companyWallet || companyWallet.companyBalance < amount) {
      return res.status(400).json({ message: 'Insufficient company balance' });
    }
    
    companyWallet.companyBalance -= amount;
    await companyWallet.save();
    
    // Create transaction record
    const transaction = new Transaction({
      type: 'company_withdrawal',
      amount,
      description: description || 'Company balance withdrawal',
      adminId: req.admin.id,
      status: 'completed'
    });
    await transaction.save();
    
    res.json({ 
      message: 'Withdrawal successful',
      newBalance: companyWallet.companyBalance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to process withdrawal' });
  }
};

module.exports = {
  createAdmin,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
  getDashboard,
  getUsers,
  getTokenSettings,
  updateTokenSettings,
  toggleUserStatus,
  getUserTransactions,
  withdrawFromCompanyBalance
};
