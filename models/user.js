const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  country: { type: String, required: true },
  referralCode: { type: String, unique: true, required: false },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  profilePicture: {
    imageUrl: { type: String },
    publicId: { type: String }
  },
  activationStatus: { type: String, enum: ['active', 'inactive'], default: 'inactive'},
  accountType: { type: String, enum: ['Bronze', 'Silver', 'Gold'], default: 'Bronze' },
  passwordResetOtp: String,
  passwordResetOtpExpires: Date,
  createdAt: { type: Date, default: Date.now }
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model('User', userSchema); 
module.exports = User