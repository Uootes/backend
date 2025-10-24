const Task = require('../models/task')
const User = require('../models/user');
const userTaskProgress = require('../models/userTaskProgress');


const mongoose = require('mongoose');
const { createIncubatorCard } = require('../services/incubator-utils');

exports.accessUserTaskProgress = async (req, res) => {
  try {

    const userIdString = req.user.id;
    // converting the userIdString to a Mongoose ObjectId instance
    const userId = new mongoose.Types.ObjectId(userIdString);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    };

    // find an existing userTaskProgress document for this user
    let userProgress = await userTaskProgress.findOne({ userId })
      .populate({
        path: 'tasks.taskId',
        model: 'Task',
        select: 'title description link'
      });

    // Check if a userTaskProgress document was found.
    if (userProgress) {
      return res.status(200).json({
        message: 'User task progress retrieved successfully.',
        data: userProgress
      });
    } else {
      // Fetch all active tasks from the Task collection.
      const activeTasks = await Task.find({ isActive: true });

      if (activeTasks.length === 0) {
        return res.status(404).json({ message: "No active tasks available to start." });
      };

      // Create the initial progress list for the new user.
      const progressList = activeTasks.map(task => ({
        taskId: task._id,
        status: 'start'
      }));

      const newProgress = new userTaskProgress({
        userId,
        userName: `${user.firstName} ${user.lastName}`,
        tasks: progressList,
        completedCount: 0,
        rewardClaimed: false,
        rewardClaimedAt: null
      });

      await newProgress.save();

      // Populate the newly saved document for the response,includeing the task details (title, description, link).
      await newProgress.populate({
        path: 'tasks.taskId',
        model: 'Task',
        select: 'title description link'
      });

      return res.status(201).json({
        message: 'Task progress started and retrieved.',
        data: newProgress
      });
    }
  } catch (error) {
    console.error("Error accessing task progress:", error);
    res.status(500).json({
      message: 'Error accessing task progress.',
      error: error.message || 'An unexpected error occurred.'
    })
  };
};

exports.getUserTaskProgress = async (req, res) => {
  try {

    const id = req.user.id;
    const userId = new mongoose.Types.ObjectId(id);
    const progress = await userTaskProgress.findOne({ userId: userId }).populate('tasks.taskId');
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
    const id = req.user.id
    const convetedId = new mongoose.Types.ObjectId(id);

    const userProgress = await userTaskProgress.findOne({ userId: convetedId });
    if (!userProgress) {
      return res.status(404).json({ message: 'User progress not found.' });
    };

    // const taskIndex = userProgress.tasks.findIndex((task) => task.taskId.toString() === taskId.toString)();

    const taskIndex = userProgress.tasks.findIndex(
      (task) => task.taskId.toString() === taskId.toString()
    );

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
    console.log('Error updating task status:', error);
    res.status(500).json({ message: 'Error updating task.', error: error.message });
  };
};

exports.claimTaskReward = async (req, res) => {
  try {
    const id = req.user.id;
    const userProgress = await userTaskProgress.findOne({ id });
    if (!userProgress || userProgress.rewardClaimed === true) {
      return res.status(400).json({ message: 'Reward already claimed or progress not found.' });
    }

    const totalTasks = await Task.countDocuments({ isActive: true });
    if (userProgress.completedCount < totalTasks) {
      return res.status(400).json({ message: 'Please complete all tasks to claim reward' });
    }

    const CPT_REWARD = 100000;
    // create incubator card instead of modifying user directly
    const card = await createIncubatorCard({ userId: id, cptAmount: CPT_REWARD});

    userProgress.rewardClaimed = true;
    await userProgress.save();

    return res.status(200).json({ message: 'Reward claimed successfully.', card });
  } catch (error) {
    return res.status(500).json({ message: 'Error claiming reward.', error: error.message });
  }
};


exports.getUserProgressCount = async (req, res) => {
  try {
    const id = req.user.id;
    const userId = new mongoose.Types.ObjectId(id);
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
