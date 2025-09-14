const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  getUserReviews,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  protect,
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please include a valid email'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL')
], updateUserProfile);

// @route   GET /api/users/reviews
// @desc    Get user's reviews
// @access  Private
router.get('/reviews', protect, getUserReviews);

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', protect, getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private/Admin
router.get('/:id', protect, getUserById);

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private/Admin
router.put('/:id', [
  protect,
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please include a valid email'),
  body('role').optional().isIn(['customer', 'store_owner', 'admin']).withMessage('Invalid role'),
  body('isEmailVerified').optional().isBoolean().withMessage('isEmailVerified must be boolean')
], updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, deleteUser);

module.exports = router;
