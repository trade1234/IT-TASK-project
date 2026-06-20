const mongoose = require('mongoose');
const Task = require('./src/models/Task');
const User = require('./src/models/User');
require('dotenv').config();

async function fixOverdue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB - fix-overdue.js:9');
    
    const now = new Date();
    
    // Find tasks that are overdue (dueDate < now, not completed)
    const result = await Task.updateMany(
      { 
        dueDate: { $lt: now },
        status: { $nin: ['completed', 'overdue'] }
      },
      { status: 'overdue' }
    );
    
    console.log(`✅ ${result.modifiedCount} tasks marked as overdue - fix-overdue.js:22`);
    
    // Show all overdue tasks
    const overdueTasks = await Task.find({ status: 'overdue' })
      .populate('assignedTo', 'fullName');
    
    console.log('\n📋 Overdue Tasks: - fix-overdue.js:28');
    if (overdueTasks.length === 0) {
      console.log('No overdue tasks found - fix-overdue.js:30');
    } else {
      overdueTasks.forEach(task => {
        console.log(`${task.title} (${task.assignedTo?.fullName || 'Unassigned'}) due: ${new Date(task.dueDate).toLocaleDateString()} - fix-overdue.js:33`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error: - fix-overdue.js:39', error);
    process.exit(1);
  }
}

fixOverdue();