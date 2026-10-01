const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  register,
  registerUser,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  setProfilePhoto,
  removeProfilePhoto
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { profilePhotoUpload } = require('../middleware/upload');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/register', authLimiter, register);
router.post('/register/user', authLimiter, registerUser);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/profile-photo', protect, profilePhotoUpload, setProfilePhoto);
router.delete('/profile-photo', protect, removeProfilePhoto);

module.exports = router;
