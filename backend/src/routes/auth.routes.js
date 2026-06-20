const express = require('express');
const router = express.Router();
const { 
  login, 
  logout, 
  getProfile, 
  updateProfile, 
  updatePassword 
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// ✅ PUBLIC ROUTES
router.post('/login', login);

// ✅ TEST ROUTE - For debugging
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working!' });
});

// ✅ PROTECTED ROUTES
router.post('/logout', protect, logout);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);

module.exports = router;