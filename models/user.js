const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    pinHash: { type: String, required: true },
    kycStatus: { type: String, enum: ['pending', 'verified'], default: 'pending' },
    referralCode: { type: String, unique: true },
    referredBy: { type: String },
    accountType: { type: String, enum: ['regular', 'admin'], default: 'regular' },
    activationStatus: { type: Boolean, default: false },
    balance: { type: Number, default: 0 },
    otp: { code: String, expiresAt: Date },
    passwordResetOtp: { type: String },
    passwordResetOtpExpires: { type: Date },
}, { timestamps: true });

userSchema.methods.comparePIN = function (pin) {
    return bcrypt.compare(pin, this.pinHash);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
