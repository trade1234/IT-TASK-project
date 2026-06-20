const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notification.controller');

// ✅ All routes are protected
router.use(protect);

// ✅ Routes
router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);  // ✅ Changed from PUT to PATCH
router.delete('/:id', deleteNotification);

// ✅ Test route for debugging
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Notification routes are working!',
    user: req.user ? req.user.email : 'No user'
  });
});

module.exports = router;