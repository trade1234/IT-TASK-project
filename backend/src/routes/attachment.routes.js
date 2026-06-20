const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto'); // ✅ Built-in Node.js - NO package needed!
const { protect } = require('../middleware/auth');
const Task = require('../models/Task');

// ✅ Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

// ✅ Upload attachment - USING crypto.randomUUID()
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📤 Uploading attachment for task: - attachment.routes.js:38', id);
    
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    console.log('📁 File uploaded: - attachment.routes.js:56', req.file.filename);
    
    // ✅ USING crypto.randomUUID() - Built into Node.js
    const attachment = {
      _id: crypto.randomUUID(), // ✅ No package needed!
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };
    
    task.attachments.push(attachment);
    await task.save();
    
    console.log('✅ Attachment saved successfully - attachment.routes.js:72');
    
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      attachment: attachment
    });
  } catch (error) {
    console.error('Upload attachment error: - attachment.routes.js:80', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading file'
    });
  }
});

// ✅ Get attachments
router.get('/', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    res.status(200).json({
      success: true,
      attachments: task.attachments || []
    });
  } catch (error) {
    console.error('Get attachments error: - attachment.routes.js:106', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attachments'
    });
  }
});

// ✅ Delete attachment
router.delete('/:attachmentId', protect, async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    const attachmentIndex = task.attachments.findIndex(
      att => att._id === attachmentId // ✅ String comparison
    );
    
    if (attachmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }
    
    const attachment = task.attachments[attachmentIndex];
    if (attachment.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this attachment'
      });
    }
    
    task.attachments.splice(attachmentIndex, 1);
    await task.save();
    
    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Delete attachment error: - attachment.routes.js:154', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting attachment'
    });
  }
});

module.exports = router;