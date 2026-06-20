const Task = require('../models/Task');
const User = require('../models/User');

const getTaskReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    
    let query = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (employeeId) {
      query.assignedTo = employeeId;
    }
    
    const tasks = await Task.find(query)
      .populate('assignedTo', 'fullName email department')
      .populate('assignedBy', 'fullName email');
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
    
    // Group tasks by employee
    const tasksByEmployee = {};
    tasks.forEach(task => {
      const employeeName = task.assignedTo?.fullName || 'Unknown';
      if (!tasksByEmployee[employeeName]) {
        tasksByEmployee[employeeName] = {
          assigned: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0
        };
      }
      tasksByEmployee[employeeName].assigned++;
      if (task.status === 'completed') tasksByEmployee[employeeName].completed++;
      if (task.status === 'in-progress') tasksByEmployee[employeeName].inProgress++;
      if (task.status === 'overdue') tasksByEmployee[employeeName].overdue++;
    });
    
    res.status(200).json({
      success: true,
      summary: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      tasksByEmployee,
      tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating task report'
    });
  }
};

const getPerformanceReport = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee', status: 'active' });
    
    const performanceData = await Promise.all(employees.map(async (employee) => {
      const assignedTasks = await Task.countDocuments({ assignedTo: employee._id });
      const completedTasks = await Task.countDocuments({ assignedTo: employee._id, status: 'completed' });
      const overdueTasks = await Task.countDocuments({ assignedTo: employee._id, status: 'overdue' });
      
      const completionRate = assignedTasks > 0 
        ? Math.round((completedTasks / assignedTasks) * 100) 
        : 0;
      
      return {
        employeeId: employee._id,
        employeeName: employee.fullName,
        department: employee.department,
        assignedTasks,
        completedTasks,
        overdueTasks,
        completionRate
      };
    }));
    
    // Sort by completion rate (highest first)
    performanceData.sort((a, b) => b.completionRate - a.completionRate);
    
    res.status(200).json({
      success: true,
      performanceData,
      totalEmployees: employees.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating performance report'
    });
  }
};

module.exports = {
  getTaskReport,
  getPerformanceReport
};