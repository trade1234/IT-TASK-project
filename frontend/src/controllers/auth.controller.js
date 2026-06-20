// backend/src/controllers/auth.controller.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ===== GENERATE TOKEN =====
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// ===== LOGIN =====
const login = async (req, res) => {
  try {
    console.log('🔐 Login attempt: - auth.controller.js:15', req.body.email);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found: - auth.controller.js:29', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Your account is deactivated'
      });
    }
    
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      console.log('❌ Password mismatch for: - auth.controller.js:46', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const token = generateToken(user._id);
    
    console.log('✅ Login successful: - auth.controller.js:55', email);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error: - auth.controller.js:71', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// ===== LOGOUT =====
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// ===== GET PROFILE =====
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
};

// ===== UPDATE PROFILE =====
const updateProfile = async (req, res) => {
  try {
    const { fullName, email, department } = req.body;
    
    if (email) {
      const existingUser = await User.findOne({ 
        email: email, 
        _id: { $ne: req.user._id } 
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }
    
    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email;
    if (department !== undefined) updates.department = department;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Update profile error: - auth.controller.js:138', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// ===== UPDATE PASSWORD =====
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }
    
    const user = await User.findById(req.user._id).select('+password');
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error: - auth.controller.js:183', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password'
    });
  }
};

// ===== EXPORT ALL FUNCTIONS =====
module.exports = {
  login,
  logout,
  getProfile,
  updateProfile,
  updatePassword
};