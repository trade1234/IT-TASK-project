const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskProgress
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth');
const Task = require('../models/Task');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created uploads directory: - task.routes.js:23', uploadDir);
}

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// All task routes require authentication
router.use(protect);

// Task CRUD operations
router.post('/', createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/progress', updateTaskProgress);

// Attachment routes
router.post('/:id/attachments', upload.single('file'), async (req, res) => {
  try {
    console.log('=== UPLOAD REQUEST === - task.routes.js:57');
    console.log('Task ID: - task.routes.js:58', req.params.id);
    console.log('File received: - task.routes.js:59', req.file ? req.file.originalname : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const attachment = {
     _id: new mongoose.Types.ObjectId(),
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };
    
    if (!task.attachments) task.attachments = [];
    task.attachments.push(attachment);
    await task.save();
    
    console.log('Attachment saved successfully - task.routes.js:84');
    res.json({ success: true, attachment: attachment });
  } catch (error) {
    console.error('Upload error: - task.routes.js:87', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/attachments', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, attachments: task.attachments || [] });
  } catch (error) {
    console.error('Get attachments error: - task.routes.js:100', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const attachment = task.attachments?.find(a => a._id.toString() === req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }
    
    const filePath = path.join(uploadDir, attachment.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    
    res.download(filePath, attachment.originalname);
  } catch (error) {
    console.error('Download error: - task.routes.js:124', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const attachment = task.attachments?.find(a => a._id.toString() === req.params.attachmentId);
    if (attachment) {
      const filePath = path.join(uploadDir, attachment.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    task.attachments = task.attachments?.filter(a => a._id.toString() !== req.params.attachmentId);
    await task.save();
    
    res.json({ success: true, message: 'Attachment deleted' });
  } catch (error) {
    console.error('Delete error: - task.routes.js:149', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;