const Task = require('../models/task')
const User = require('../models/user');
const userTaskProgress = require('../models/userTaskProgress');

exports.accessUserTaskProgress = async (req, res) => {
  try {
    const { id: userId } = req.user; 
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." }); 
    };

    let userProgress = await userTaskProgress.findOne({ userId }).populate('tasks.taskId');

    if (userProgress) {
      return res.status(200).json({
        message: 'User task progress retrieved successfully.',
        data: userProgress
      });
    };
    
// initialize a new user task progress for the user if it doesn't exist
    const activeTasks = await Task.find({ isActive: true });
    if (activeTasks.length === 0) {
      return res.status(404).json({ message: "No active tasks available to start." });
    };

    const progressList = activeTasks.map(task => ({
      taskId: task._id,
      status: 'start' 
    }));

    const newProgress = new userTaskProgress({
      userId,
      tasks: progressList,
      completedCount: 0,
      isRewardClaimed: false
    });

    await newProgress.save();
    await newProgress.populate('tasks.taskId');

    return res.status(201).json({
      message: 'Task progress started and retrieved.',
      data: newProgress
    });

  } catch (error) {
    console.error("Error accessing task progress:", error);
    return res.status(500).json({ message: 'Error accessing task progress.', error: error.message });
  }
};


 exports.getUserTaskProgress = async (req, res) => {
   try {

    const { id: userId } = req.user;
    const progress = await userTaskProgress.findOne({ userId }).populate('tasks.taskId');
    if (!progress) {
      return res.status(404).json({ message: 'No progress found.' });
    };

    return res.status(200).json({ data: progress });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching progress.', error });
  };
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const  userId = req.user.id

    const userProgress = await userTaskProgress.findOne({ userId });
    if (!userProgress) {
      return res.status(404).json({ message: 'User progress not found.' });
    };

    const taskIndex = userProgress.tasks.findIndex((task) => task.taskId.toString() === taskId.toString)();
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found in progress list.' });
    }; 

    if (userProgress.tasks[taskIndex].status === 'done') {
      return res.status(400).json({ message: 'Task already completed.' });
    };

    userProgress.tasks[taskIndex].status = 'done';
    userProgress.completedCount += 1;
    await userProgress.save();

    return res.status(200).json({ message: 'Task marked as completed.', data: userProgress });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating task.', error });
  };
};

exports.claimTaskReward = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const userProgress = await userTaskProgress.findOne({ userId });
    if (!userProgress || userProgress.rewardClaimed === true) {
      return res.status(400).json({ message: 'Reward already claimed or progress not found.' });
    };

    const totalTasks = await Task.countDocuments({ isActive: true });
    if (userProgress.completedCount < totalTasks) {
      return res.status(400).json({ message: 'please complete all task to claim reward' });
    };

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

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
    userProgress.rewardClaimed = true;
    await userProgress.save();

    return res.status(200).json({ message: 'Reward claimed successfully.' });

  } catch (error) {
    return res.status(500).json({ message: 'Error claiming reward.', error });
  }
};

exports.getUserProgressCount = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const progress = await userTaskProgress.findOne({ userId });
    if (!progress) {
      return res.status(404).json({ message: 'User progress not found.' });
    };

    const totalTasks = await Task.countDocuments({ isActive: true });
    const completed = progress.completedCount;

    return res.status(200).json({ progress: `${completed}/${totalTasks}` });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving progress.', error });
  }
};
