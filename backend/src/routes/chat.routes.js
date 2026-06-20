const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  getOnlineUsers,
  getUnreadCount,
  getChatUsers
} = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.get('/conversations', getConversations);
router.get('/messages/:userId', getMessages);
router.post('/send', sendMessage);
router.get('/online-users', getOnlineUsers);
router.get('/unread-count', getUnreadCount);
router.get('/users', getChatUsers);

module.exports = router;