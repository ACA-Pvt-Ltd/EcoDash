const express = require('express');
const router = express.Router();
const {
  register,
  registerUser,
  login,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register); // Unified registration for all roles
router.post('/register/user', registerUser); // Legacy endpoint for backward compatibility
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
