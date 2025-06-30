const mongoose = require("mongoose")

const userTaskProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  userName: {
    type: String,
    required: true
  },
  tasks: [
    {
      taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
      },
      status: {
        type: String,
        required: true,
        enum: ['start', 'done'],
        default: 'start'
      }
    }
  ],
  completedCount: { 
    type: Number,
    default: 0
  },
  rewardClaimed: { 
    type: Boolean,
    default: false,
  },
  rewardClaimedAt: { 
    type: Date,
  }
}, { timestamps: true }); 

const UserTaskProgress = mongoose.model('UserTaskProgress', userTaskProgressSchema);

module.exports = UserTaskProgress;