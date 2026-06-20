const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getEmployeeDashboard
} = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/admin', getAdminDashboard);
router.get('/employee', getEmployeeDashboard);

module.exports = router;