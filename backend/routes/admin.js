const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getUsers,
  updateUserStatus,
  createCollector,
  getCollectors,
  updateCollector,
  deleteCollector,
  createVendor,
  getVendors,
  updateVendor,
  deleteVendor,
  createChallenge,
  getChallenges,
  updateChallenge,
  createBadge,
  getBadges,
  getAnalytics
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and only for admins
router.use(protect);
router.use(authorize('admin', 'superadmin'));

// Dashboard
router.get('/dashboard', getDashboard);

// User Management
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);

// Collector Management
router.post('/collectors', createCollector);
router.get('/collectors', getCollectors);
router.put('/collectors/:id', updateCollector);
router.delete('/collectors/:id', deleteCollector);

// Vendor Management
router.post('/vendors', createVendor);
router.get('/vendors', getVendors);
router.put('/vendors/:id', updateVendor);
router.delete('/vendors/:id', deleteVendor);

// Challenge Management
router.post('/challenges', createChallenge);
router.get('/challenges', getChallenges);
router.put('/challenges/:id', updateChallenge);

// Badge Management
router.post('/badges', createBadge);
router.get('/badges', getBadges);

// Analytics
router.get('/analytics', getAnalytics);

module.exports = router;
