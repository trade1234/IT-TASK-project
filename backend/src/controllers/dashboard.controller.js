const User = require('../models/User');
const Task = require('../models/Task');

const getAdminDashboard = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const totalEmployees = await User.countDocuments({ role: 'employee', status: 'active' });
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
    const overdueTasks = await Task.countDocuments({ status: 'overdue' });
    
    res.status(200).json({
      success: true,
      totalEmployees,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
};

const getEmployeeDashboard = async (req, res) => {
  try {
    const user = req.user._id;
    
    const assignedTasks = await Task.countDocuments({ assignedTo: user });
    const completedTasks = await Task.countDocuments({ assignedTo: user, status: 'completed' });
    const inProgressTasks = await Task.countDocuments({ assignedTo: user, status: 'in-progress' });
    const overdueTasks = await Task.countDocuments({ assignedTo: user, status: 'overdue' });
    
    const completionRate = assignedTasks > 0 
      ? Math.round((completedTasks / assignedTasks) * 100) 
      : 0;
    
    res.status(200).json({
      success: true,
      assignedTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
};

module.exports = {
  getAdminDashboard,
  getEmployeeDashboard
};