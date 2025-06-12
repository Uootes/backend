const mongoose = require('mongoose');

const userTaskProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    tasks: [
        {
            taskId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Task',
                required: true,
            },
            status: {
                type: String,
                enum: ['start', 'done'],
                default: 'start',
            }
        }
    ],
    isRewardClaimed: {
        type: Boolean,
        default: false,
    },
    rewardClaimedAt: {
        type: Date,
    }
}, { timestamps: true });

module.exports = mongoose.model('UserTaskProgress', userTaskProgressSchema);
