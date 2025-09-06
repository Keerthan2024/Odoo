const { body, validationResult, query } = require('express-validator');

// Validation middleware to check for errors - MUST BE DEFINED FIRST
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Product validation
const validateProduct = [
  body('title')
    .isLength({ min: 3, max: 200 })
    .withMessage('Product title must be between 3 and 200 characters')
    .trim(),
  
  body('description')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Product description must be between 10 and 2000 characters')
    .trim(),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Vehicles', 'Other'])
    .withMessage('Invalid category selected'),
  
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number greater than 0'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('condition_status')
    .notEmpty()
    .withMessage('Condition status is required')
    .isIn(['New', 'Like New', 'Good', 'Fair', 'Poor'])
    .withMessage('Invalid condition status'),
  
  body('year_of_manufacture')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage('Invalid year of manufacture'),
  
  body('brand')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Brand name cannot exceed 100 characters')
    .trim(),
  
  body('model')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Model name cannot exceed 100 characters')
    .trim(),
  
  body('original_packaging')
    .optional()
    .isBoolean()
    .withMessage('Original packaging must be true or false'),
  
  body('manual_included')
    .optional()
    .isBoolean()
    .withMessage('Manual included must be true or false'),
  
  handleValidationErrors
];

// Product update validation (all fields optional)
const validateProductUpdate = [
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('Product title must be between 3 and 200 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Product description must be between 10 and 2000 characters')
    .trim(),
  
  body('category')
    .optional()
    .isIn(['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Vehicles', 'Other'])
    .withMessage('Invalid category selected'),
  
  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number greater than 0'),
  
  body('condition_status')
    .optional()
    .isIn(['New', 'Like New', 'Good', 'Fair', 'Poor'])
    .withMessage('Invalid condition status'),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .trim(),
  
  query('category')
    .optional()
    .isIn(['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Vehicles', 'Other'])
    .withMessage('Invalid category'),
  
  query('condition_status')
    .optional()
    .isIn(['New', 'Like New', 'Good', 'Fair', 'Poor'])
    .withMessage('Invalid condition status'),
  
  query('min_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),
  
  query('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateProduct,
  validateProductUpdate,
  validateProfileUpdate,
  validateSearch,
  handleValidationErrors
};
