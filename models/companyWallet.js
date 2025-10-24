const mongoose = require('mongoose');

const companyWalletSchema = new mongoose.Schema({
  revenueBalance: { type: Number, default: 0 },
  companyBalance: { type: Number, default: 0 },
  poolBalance: { type: Number, default: 0 },
  accumulation: { type: Number, default: 0 },
  supplyBalance: { type: Number, default: 0 },
}, { timestamps: true });

const companyWalletModel = mongoose.model('companyWallets', companyWalletSchema);

module.exports = companyWalletModel;