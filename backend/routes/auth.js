const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, AuthController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, AuthController.login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticateToken, AuthController.getProfile);

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working' });
});

module.exports = router;
