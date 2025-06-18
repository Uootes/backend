const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  country: { type: String, required: true },
  referralCode: { type: String, unique: true },
  referredBy: { type:String },
  activationStatus: { type: Boolean, default: false },
  passwordResetOtp: String,
  passwordResetOtpExpires: Date,
  createdAt: { type: Date, default: Date.now }
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);