const mongoose = require('mongoose');

// ✅ FIXED: Attachment Schema - NO manual _id
const attachmentSchema = new mongoose.Schema({
  _id: {
    type: String, // ✅ CORRECT - capital S
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalname: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned user is required']
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigner is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'assigned', 'in-progress', 'completed', 'overdue'],
    default: 'new'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  completionDate: {
    type: Date
  },
  attachments: [attachmentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update status based on progress and due date
taskSchema.pre('save', function(next) {
  if (this.progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completionDate = new Date();
  }
  
  const now = new Date();
  if (this.dueDate < now && this.status !== 'completed' && this.status !== 'overdue') {
    this.status = 'overdue';
  }
  
  next();
});

// Method to update progress
taskSchema.methods.updateProgress = function(progress) {
  this.progress = Math.min(100, Math.max(0, progress));
  if (this.progress === 100) {
    this.status = 'completed';
    this.completionDate = new Date();
  } else if (this.progress > 0 && this.progress < 100 && this.status === 'new') {
    this.status = 'in-progress';
  }
  return this.save();
};

taskSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Task', taskSchema);