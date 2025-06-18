const mongoose = require('mongoose');

const exchangerWalletSchema = new mongoose.Schema({
    exchangerId: { type: mongoose.SchemaTypes.ObjectId },
    availableBalance: { type: Number, default: 0 },
    totalPurchasedGSC: { type: Number, default: 0 },
    totalSoldGSC: { type: Number, default: 0 },
    ledger: { type: Number, default: 0 },
}, { timestamps: true });

const exchangerWalletModel = mongoose.model('exchangerWallets', exchangerWalletSchema);

module.exports = exchangerWalletModel;