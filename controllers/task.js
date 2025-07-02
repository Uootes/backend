const Task = require("../models/task");

exports.createTask = async (req, res) => {
    try {
        const { title, description, link } = req.body;

        const taskExist = await Task.findOne({ title: title.toLowerCase() });
        if (taskExist) {
            return res.status(400).json({ message: "Task already exist" })
        };

        const newTask = new Task({
            title,
            description,
            link
        });

        await newTask.save();

        return res.status(201).json({ message: 'Task created successfully', task: newTask });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    };
};

exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find().select('title description link isActive');
        const taskCount = await Task.countDocuments();

        return res.status(200).json({message: 'Task fetched successfulle', data: tasks , count: taskCount });

    } catch (err) {
        console.log("Error fetching tasks:", err);
        
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getTaskById = async (req, res) => {
    try {
        const { id } = req.params;

        const task = await Task.findById(id).select('title', 'description', 'link', 'isActive');;
        if (!task) return res.status(404).json({ message: 'Task not found' });

        return res.status(200).json({message: "Task retrieved successfully", data: task });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    };
};

exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedTask = await Task.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedTask) return res.status(404).json({ message: 'Task not found' });

        return res.status(200).json({ message: 'Task updated successfully', task: updatedTask });

    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Task.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'Task not found' });

        return res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};
