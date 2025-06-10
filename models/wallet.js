const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: { type: mongoose.SchemaTypes.ObjectId },
    availabeGSC: { type: Number, default: 0 },
    CPT: { type: Number, default: 0 },
    pool: { type: Number, default: 0 },
    incubatorBalance: { type: Number, default: 0 },
    ledger: [
        {
            type: { type: String, enum: ['deposit', 'withdrawal', 'buy', 'sell', 'reward', 'correction'] },
            tokenType: { type: String, enum: ['GSC', 'CPT'] },
            amount: { type: Number },
            balanceBefore: { type: Number },
            balanceAfter: { type: Number },
            referenceId: { type: String },
            notes: { type: String },
            createdAt: { type: Date, default: Date.now, },
        }
    ],
}, { timestamps: true });

const walletModel = mongoose.model('wallets', walletSchema);

module.exports = walletModel;