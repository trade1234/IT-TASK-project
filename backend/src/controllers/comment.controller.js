const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { message } = req.body;
    
    console.log('📝 Adding comment to task: - comment.controller.js:10', taskId);
    console.log('💬 Message: - comment.controller.js:11', message);
    console.log('👤 User: - comment.controller.js:12', req.user._id);
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Comment message is required'
      });
    }
    
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'fullName email')
      .populate('assignedBy', 'fullName email');
      
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // ✅ Create comment
    const comment = await Comment.create({
      taskId,
      user: req.user._id,
      message
    });
    
    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'fullName email');
    
    // ✅ Send notification to the assigned employee (if comment is not from them)
    if (task.assignedTo && task.assignedTo._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: task.assignedTo._id,
        title: 'New Comment on Your Task',
        message: `${req.user.fullName} commented on task: "${task.title}"`,
        type: 'comment_added',
        relatedId: task._id,
        relatedModel: 'Task'
      });
      console.log('✅ Notification sent to assigned employee: - comment.controller.js:52', task.assignedTo.email);
    }
    
    // ✅ Send notification to the admin who created the task (if different from commenter and assignee)
    if (task.assignedBy && 
        task.assignedBy._id.toString() !== req.user._id.toString() && 
        task.assignedBy._id.toString() !== task.assignedTo?._id?.toString()) {
      await Notification.create({
        user: task.assignedBy._id,
        title: 'New Comment on Task',
        message: `${req.user.fullName} commented on task: "${task.title}"`,
        type: 'comment_added',
        relatedId: task._id,
        relatedModel: 'Task'
      });
      console.log('✅ Notification sent to admin: - comment.controller.js:67', task.assignedBy.email);
    }
    
    res.status(201).json({
      success: true,
      comment: populatedComment
    });
  } catch (error) {
    console.error('Add comment error: - comment.controller.js:75', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    });
  }
};

const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    console.log('📡 Fetching comments for task: - comment.controller.js:88', taskId);
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    const total = await Comment.countDocuments({ taskId });
    const comments = await Comment.find({ taskId })
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    res.status(200).json({
      success: true,
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get comments error: - comment.controller.js:116', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    });
  }
};

module.exports = {
  addComment,
  getComments
};