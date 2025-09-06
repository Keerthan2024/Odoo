const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticateToken);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', UserController.getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', UserController.updateProfile);

// @route   PUT /api/users/password
// @desc    Change password
// @access  Private
router.put('/password', UserController.changePassword);

// @route   GET /api/users/dashboard
// @desc    Get user dashboard stats
// @access  Private
router.get('/dashboard', UserController.getDashboardStats);

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', UserController.deleteAccount);

module.exports = router;
