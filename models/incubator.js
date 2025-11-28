const mongoose = require('mongoose');

const incubatorCardSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tier: {
        type: String,
        enum: ['Bronze', 'Silver', 'Gold'],
        required: true
    },

    cptAmount: { type: Number, required: true },
    gscWorth: { type: Number, required: true },

    totalDuration: { type: Number, required: true },
    remainingTime: { type: Number, required: true },

    startedAt: { type: Date },
    endsAt: { type: Date },

    status: {
        type: String,
        enum: ['active', 'claimable', 'claimed'],
        default: 'active'
    },
}, { timestamps: true });

const Incubator = mongoose.model('Incubator', incubatorCardSchema);

module.exports = Incubator;
