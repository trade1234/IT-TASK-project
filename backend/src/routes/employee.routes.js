const express = require('express');
const router = express.Router();
const { 
  getEmployees, 
  getEmployeeById, 
  createEmployee,     // ✅ ADD THIS
  updateEmployee, 
  deleteEmployee 
} = require('../controllers/employee.controller');
const { protect } = require('../middleware/auth');

// All routes protected
router.get('/', protect, getEmployees);
router.post('/', protect, createEmployee);    // ✅ ADD THIS
router.get('/:id', protect, getEmployeeById);
router.put('/:id', protect, updateEmployee);
router.delete('/:id', protect, deleteEmployee);

module.exports = router;