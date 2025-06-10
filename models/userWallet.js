const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: { type: mongoose.SchemaTypes.ObjectId },
    GSCBalance: { type: Number, default: 0 },
    CPTBalance: { type: Number, default: 0 },
    totalPurchasedCPT: { type: Number, default: 0 },
    poolBalance: { type: Number, default: 0 },
    incubatorBalance: { type: Number, default: 0 },
    ledger: { type: Number, default: 0 },
}, { timestamps: true });

const walletModel = mongoose.model('wallets', walletSchema);

module.exports = walletModel;