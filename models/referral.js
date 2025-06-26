const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // one referral record per user
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  visitors: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      fullName: {
        type: String,
        required: true,
      },
    },
  ],
  referrals: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      fullName: {
        type: String,
        required: true,
      },
    },
  ],
  upgradeTokens: {
    type: Number,
    default: 0,
  },
});

const Referral = mongoose.model('Referral', referralSchema);
module.exports = Referral