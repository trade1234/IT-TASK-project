const express = require('express');
const router = express.Router();
const { addComment, getComments } = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

// ✅ Include 'tasks' in the path to match frontend
router.post('/tasks/:taskId/comments', addComment);
router.get('/tasks/:taskId/comments', getComments);

console.log('✅ Comment routes registered: - comment.routes.js:12');
console.log('POST /tasks/:taskId/comments - comment.routes.js:13');
console.log('GET /tasks/:taskId/comments - comment.routes.js:14');

module.exports = router;