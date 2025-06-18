const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const exchangerSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    country: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    pinHash: { type: String, required: true },
    kycStatus: { type: String, enum: ['pending', 'verified'], default: 'pending' },
    accountType: { type: String, enum: ['regular', 'admin'], default: 'regular' },
    activationStatus: { type: Boolean, default: false },
    balance: { type: Number, default: 0 },
    otp: { 
      code: String, 
      expiresAt: Date 
    },
    passwordResetOtp: { type: String },
    passwordResetOtpExpires: { type: Date },
}, { timestamps: true });

exchangerSchema.methods.comparePIN = function (pin) {
    return bcrypt.compare(pin, this.pinHash);
};

const Exchanger = mongoose.model('Exchanger', exchangerSchema);

module.exports = Exchanger;