// controllers/userTaskProgress.controller.js
Task = require('../models/task')
const UserTaskProgress = require('../models/userTaskProgress');
const User = require('../models/user')

exports.startTaskProgress = async (req, res) => {
  const { userId } = req.params;

  try {
    // Check if user progress already exists
    const existingProgress = await UserTaskProgress.findOne({ userId });
    if (existingProgress) {
      return res.status(400).json({ message: 'Task progress already started.' });
    }

    const tasks = await Task.find({ isActive: true });
    const progressList = tasks.map(task => ({
      taskId: task._id,
      status: 'not_started'
    }));

    const newProgress = new UserTaskProgress({
      userId,
      tasks: progressList,
      completedCount: 0,
      rewardClaimed: false
    });

    await newProgress.save();

    return res.status(201).json({ message: 'Task progress started.', data: newProgress });
  } catch (error) {
    return res.status(500).json({ message: 'Error starting task progress.', error });
  }
};

 exports.getUserTaskProgress = async (req, res) => {
  const { userId } = req.params;

  try {
    const progress = await UserTaskProgress.findOne({ userId }).populate('tasks.taskId');
    if (!progress) {
      return res.status(404).json({ message: 'No progress found.' });
    }

    return res.status(200).json({ data: progress });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching progress.', error });
  }
};

exports.updateTaskStatus = async (req, res) => {
  const { userId, taskId } = req.params;

  try {
    const userProgress = await UserTaskProgress.findOne({ userId });
    if (!userProgress) {
      return res.status(404).json({ message: 'User progress not found.' });
    }

    const taskIndex = userProgress.tasks.findIndex(t => t.taskId.toString() === taskId);
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found in progress.' });
    }

    if (userProgress.tasks[taskIndex].status === 'completed') {
      return res.status(400).json({ message: 'Task already completed.' });
    }

    userProgress.tasks[taskIndex].status = 'completed';
    userProgress.completedCount += 1;
    await userProgress.save();

    return res.status(200).json({ message: 'Task marked as completed.', data: userProgress });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating task.', error });
  }
};git

exports.claimTaskReward = async (req, res) => {
  const { userId } = req.params;

  try {
    const userProgress = await UserTaskProgress.findOne({ userId });
    if (!userProgress || userProgress.rewardClaimed) {
      return res.status(400).json({ message: 'Reward already claimed or progress not found.' });
    }

    const totalTasks = await Task.countDocuments({ isActive: true });

    if (userProgress.completedCount < totalTasks) {
      return res.status(400).json({ message: 'Not all tasks completed yet.' });
    }

    // Reward logic
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Add CPT tokens to user’s incubator (assuming user has incubator schema or field)
    const CPT_REWARD = 100000;
    user.incubatorBalance = (user.incubatorBalance || 0) + CPT_REWARD;

    // Set lock time based on account type
    const lockDurations = {
      bronze: 360, // 15 days
      silver: 168, // 7 days
      gold: 72     // 3 days
    };

    const lockHours = lockDurations[user.accountType.toLowerCase()] || 360;
    user.incubatorLockUntil = new Date(Date.now() + lockHours * 60 * 60 * 1000);

    await user.save();

    // Mark reward as claimed
    userProgress.rewardClaimed = true;
    await userProgress.save();

    return res.status(200).json({ message: 'Reward claimed successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error claiming reward.', error });
  }
};

exports.getUserProgressCount = async (req, res) => {
  const { userId } = req.params;

  try {
    const progress = await UserTaskProgress.findOne({ userId });
    if (!progress) {
      return res.status(404).json({ message: 'User progress not found.' });
    }

    const totalTasks = await Task.countDocuments({ isActive: true });
    const completed = progress.completedCount;

    return res.status(200).json({ progress: `${completed}/${totalTasks}` });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving progress.', error });
  }
};
