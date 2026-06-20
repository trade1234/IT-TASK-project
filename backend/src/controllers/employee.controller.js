const User = require('../models/User');

// ✅ Get employees (admin sees all, employee sees only admin)
const getEmployees = async (req, res) => {
  try {
    console.log('📋 Fetching employees for user: - employee.controller.js:6', req.user._id, 'Role:', req.user.role);
    
    let query = {};
    
    if (req.user.role === 'employee') {
      // Employee sees ONLY admin
      query = { role: 'admin' };
    } else if (req.user.role === 'admin') {
      // Admin sees ALL employees
      query = { role: 'employee' };
    } else {
      // For other roles, show all users except self
      query = { _id: { $ne: req.user._id } };
    }
    
    const employees = await User.find(query)
      .select('fullName email role department status')
      .sort({ fullName: 1 });
    
    console.log(`✅ Found ${employees.length} employees - employee.controller.js:25`);
    
    res.status(200).json({
      success: true,
      employees
    });
  } catch (error) {
    console.error('Error fetching employees: - employee.controller.js:32', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees'
    });
  }
};

// ✅ Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .select('-password');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('Error fetching employee: - employee.controller.js:58', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee'
    });
  }
};

// ✅ Update employee
const updateEmployee = async (req, res) => {
  try {
    const { fullName, email, department, role, status } = req.body;
    
    // Admin can update any employee, employee can only update themselves
    if (req.user.role === 'employee' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this employee'
      });
    }
    
    const employee = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, email, department, role, status },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('Error updating employee: - employee.controller.js:97', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employee'
    });
  }
};

// ✅ Delete employee (admin only)
const deleteEmployee = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete employees'
      });
    }
    
    const employee = await User.findByIdAndDelete(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting employee: - employee.controller.js:129', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting employee'
    });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};