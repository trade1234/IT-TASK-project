const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ IMPROVED: Better error handling and logging
const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      console.log('❌ No token provided - auth.js:14');
      return res.status(401).json({
        success: false,
        message: 'Not authorized - No token provided'
      });
    }
    
    console.log('🔑 Verifying token... - auth.js:21');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified for user ID: - auth.js:23', decoded.id);
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('❌ User not found for ID: - auth.js:28', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    req.user = user;
    console.log('✅ User authenticated: - auth.js:36', user.email);
    next();
  } catch (error) {
    console.error('❌ Auth error: - auth.js:39', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized - Invalid token'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} not authorized for this action`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };