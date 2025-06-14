const mongoose = require('mongoose');

const userWalletSchema = new mongoose.Schema({
    userId: { type: mongoose.SchemaTypes.ObjectId },
    GSCBalance: { type: Number, default: 0 },
    CPTBalance: { type: Number, default: 0 },
    totalPurchasedCPT: { type: Number, default: 0 },
    poolBalance: { type: Number, default: 0 },
    incubatorBalance: { type: Number, default: 0 },
    ledger: { type: Number, default: 0 },
}, { timestamps: true });

const userWalletModel = mongoose.model('userWallets', userWalletSchema);

module.exports = userWalletModel;