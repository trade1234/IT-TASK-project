const express = require('express');
const router = express.Router();
const { 
  getEmployees, 
  getEmployeeById, 
  updateEmployee, 
  deleteEmployee 
} = require('../controllers/employee.controller');
const { protect } = require('../middleware/auth');

// All routes protected - allow both admin and employee
router.get('/', protect, getEmployees);
router.get('/:id', protect, getEmployeeById);
router.put('/:id', protect, updateEmployee);
router.delete('/:id', protect, deleteEmployee);

module.exports = router;