const User = require('../models/User');
const bcrypt = require('bcryptjs');

// ✅ GET ALL users (including admins) - KEEP THIS ONE
const getEmployees = async (req, res) => {
  try {
    console.log('📋 Fetching all users for admin:', req.user._id);
    
    // ✅ Show ALL users - no role filter
    const employees = await User.find()
      .select('fullName email role department status')
      .sort({ fullName: 1 });
    
    console.log(`✅ Found ${employees.length} users`);
    
    res.status(200).json({
      success: true,
      employees
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

// ✅ CREATE new employee
const createEmployee = async (req, res) => {
  try {
    console.log('📝 Creating new employee:', req.body);
    
    const { fullName, email, password, role, department } = req.body;
    
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email and password are required'
      });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const employee = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role: role || 'employee',
      department: department || '',
      status: 'active'
    });
    
    const employeeResponse = employee.toObject();
    delete employeeResponse.password;
    
    console.log('✅ Employee created:', employeeResponse.fullName);
    
    res.status(201).json({
      success: true,
      employee: employeeResponse
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating employee'
    });
  }
};

// ✅ GET employee by ID
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
    console.error('Error fetching employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee'
    });
  }
};

// ✅ UPDATE employee (with password support)
const updateEmployee = async (req, res) => {
  try {
    const { fullName, email, department, role, status, password } = req.body;
    
    if (req.user.role === 'employee' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this employee'
      });
    }
    
    const updateData = { 
      fullName, 
      email, 
      department, 
      role, 
      status 
    };
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
      console.log('🔑 Password updated for user:', email);
    }
    
    const employee = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    console.log('✅ Employee updated:', employee.fullName);
    
    res.status(200).json({
      success: true,
      employee
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating employee'
    });
  }
};

// ✅ DELETE employee
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
    console.error('Error deleting employee:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting employee'
    });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};