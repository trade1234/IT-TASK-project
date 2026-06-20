const { body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  };
};

const userValidation = {
  create: [
    body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2 }),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'employee']),
    body('department').optional().trim()
  ],
  update: [
    body('fullName').optional().trim().isLength({ min: 2 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('department').optional().trim(),
    body('status').optional().isIn(['active', 'inactive'])
  ]
};

const taskValidation = {
  create: [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 3 }),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('assignedTo').notEmpty().withMessage('Assigned user is required').isMongoId(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required').toDate(),
    body('dueDate').isISO8601().withMessage('Valid due date is required').toDate()
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.startDate)) {
          throw new Error('Due date must be after start date');
        }
        return true;
      })
  ],
  update: [
    body('title').optional().trim().isLength({ min: 3 }),
    body('description').optional().trim(),
    body('assignedTo').optional().isMongoId(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('category').optional().trim(),
    body('status').optional().isIn(['new', 'assigned', 'in-progress', 'completed', 'overdue']),
    body('progress').optional().isInt({ min: 0, max: 100 })
  ]
};

module.exports = { validate, userValidation, taskValidation };