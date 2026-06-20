const Task = require('../models/Task');
const Notification = require('../models/Notification');

const createTask = async (req, res) => {
  try {
    const taskData = {
      title: req.body.title,
      description: req.body.description,
      assignedTo: req.body.assignedTo,
      assignedBy: req.user._id,
      priority: req.body.priority || 'medium',
      category: req.body.category,
      startDate: req.body.startDate,
      dueDate: req.body.dueDate,
      status: 'new',
      progress: 0
    };
    
    const task = await Task.create(taskData);
    
    // Handle attachments if any
    if (req.files && req.files.length > 0) {
      const attachments = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        attachments.push({
          filename: file.filename,
          originalname: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy: req.user._id,
          uploadedAt: new Date()
        });
      }
      
      task.attachments = attachments;
      await task.save();
    }
    
    await Notification.create({
      user: task.assignedTo,
      title: 'New Task Assigned',
      message: 'You have been assigned a new task: ' + task.title,
      type: 'task_assigned',
      relatedId: task._id,
      relatedModel: 'Task'
    });
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email');
    
    res.status(201).json({
      success: true,
      task: populatedTask
    });
  } catch (error) {
    console.error('Create task error: - task.controller.js:58', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating task'
    });
  }
};

const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, assignedTo, search } = req.query;
    
    let query = {};
    
    if (req.user.role === 'employee') {
      query.assignedTo = req.user._id;
    }
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo && req.user.role === 'admin') query.assignedTo = assignedTo;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('assignedTo', 'fullName email department')
      .populate('assignedBy', 'fullName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tasks error: - task.controller.js:106', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'fullName email department')
      .populate('assignedBy', 'fullName email');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    if (req.user.role === 'employee' && task.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this task'
      });
    }
    
    res.status(200).json({
      success: true,
      task: task
    });
  } catch (error) {
    console.error('Get task by ID error: - task.controller.js:139', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task'
    });
  }
};

const updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }
    
    const allowedUpdates = ['title', 'description', 'priority', 'category', 'startDate', 'dueDate'];
    if (req.user.role === 'admin') {
      allowedUpdates.push('assignedTo', 'status', 'progress');
    }
    
    const updates = {};
    for (let i = 0; i < allowedUpdates.length; i++) {
      const field = allowedUpdates[i];
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    task = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'fullName email')
     .populate('assignedBy', 'fullName email');
    
    res.status(200).json({
      success: true,
      task: task
    });
  } catch (error) {
    console.error('Update task error: - task.controller.js:190', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task'
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete tasks'
      });
    }
    
    await task.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error: - task.controller.js:223', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task'
    });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const status = req.body.status;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }
    
    task.status = status;
    
    if (status === 'completed') {
      task.progress = 100;
      task.completionDate = new Date();
      console.log(`✅ Task completed: "${task.title}" - task.controller.js:256`);
      await Notification.create({
        user: task.assignedBy,
        title: 'Task Completed',
        message: 'Task "' + task.title + '" has been marked as completed',
        type: 'task_completed',
        relatedId: task._id,
        relatedModel: 'Task'
      });
    } else if (status === 'in-progress' && task.progress === 0) {
      task.progress = 50;
    } else if ((status === 'new' || status === 'assigned') && task.progress > 0) {
      task.progress = 0;
    }
    
    await task.save();
    
    res.status(200).json({
      success: true,
      task: task
    });
  } catch (error) {
    console.error('Update task status error: - task.controller.js:278', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task status'
    });
  }
};

const updateTaskProgress = async (req, res) => {
  try {
    const progress = req.body.progress;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }
    
    task.progress = Math.min(100, Math.max(0, progress));
    
    if (task.progress === 100) {
      task.status = 'completed';
      task.completionDate = new Date();
    } else if (task.progress > 0 && task.progress < 100) {
      if (task.status === 'completed' || task.status === 'new' || task.status === 'assigned') {
        task.status = 'in-progress';
      }
    } else if (task.progress === 0) {
      if (task.status === 'completed' || task.status === 'in-progress') {
        task.status = 'assigned';
      }
    }
    
    await task.save();
    
    console.log(`✅ Progress updated for task "${task.title}" to ${task.progress}%  Status: ${task.status} - task.controller.js:326`);
    
    res.status(200).json({
      success: true,
      task: task
    });
  } catch (error) {
    console.error('Error updating task progress: - task.controller.js:333', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task progress'
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskProgress
};