const express = require('express');
const router = express.Router();
const {
  getDashboard,
  createReward,
  getMyRewards,
  updateReward,
  deleteReward,
  getRedemptions,
  verifyRedemption,
  getAnalytics,
  updateProfile,
  getOffers,
  purchaseWaste,
  getPurchases,
  cancelPurchase,
  getVendorInventory,
  getPricing,
  updatePricing
} = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and only for vendors
router.use(protect);
router.use(authorize('vendor'));

// Dashboard
router.get('/dashboard', getDashboard);

// Rewards (for users)
router.post('/rewards', createReward);
router.get('/rewards', getMyRewards);
router.put('/rewards/:id', updateReward);
router.delete('/rewards/:id', deleteReward);

// Redemptions
router.get('/redemptions', getRedemptions);
router.post('/redemptions/:code/verify', verifyRedemption);

// Analytics
router.get('/analytics', getAnalytics);

// Profile
router.put('/profile', updateProfile);

// Marketplace - Buy waste from collectors
router.get('/offers', getOffers); // Browse available waste offers from collectors
router.post('/purchase', purchaseWaste); // Create purchase request
router.get('/purchases', getPurchases); // View purchase requests and history
router.put('/purchases/:id/cancel', cancelPurchase); // Cancel purchase request
router.get('/inventory', getVendorInventory); // View purchased waste inventory

// Pricing
router.get('/pricing', getPricing);
router.put('/pricing', updatePricing);

module.exports = router;
