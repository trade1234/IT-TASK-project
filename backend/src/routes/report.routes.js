const express = require('express');
const router = express.Router();
const {
  getTaskReport,
  getPerformanceReport
} = require('../controllers/report.controller');
const { protect, authorize } = require('../middleware/auth');

// All report routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/tasks', getTaskReport);
router.get('/performance', getPerformanceReport);

module.exports = router;