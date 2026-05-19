const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getNearbyCollectors,
  getMyTransactions,
  getAvailableRewards,
  redeemReward,
  getMyRedemptions,
  getActiveChallenges,
  joinChallenge,
  getLeaderboard,
  getMyBadges,
  createWasteOffer,
  getMyOffers,
  getPurchaseRequests,
  respondToPurchaseRequest,
  deleteWasteOffer,
  rateCollector
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { offerMediaUpload } = require('../middleware/upload');

// All routes are protected and only for users
router.use(protect);
router.use(authorize('user'));

router.get('/dashboard', getDashboard);
router.get('/collection-points', getNearbyCollectors);
router.get('/transactions', getMyTransactions);
router.get('/rewards', getAvailableRewards);
router.post('/rewards/:rewardId/redeem', redeemReward);
router.get('/redemptions', getMyRedemptions);
router.get('/challenges', getActiveChallenges);
router.post('/challenges/:challengeId/join', joinChallenge);
router.get('/leaderboard', getLeaderboard);
router.get('/badges', getMyBadges);

// User-to-Collector waste marketplace routes
router.post('/offers', offerMediaUpload, createWasteOffer);
router.get('/offers', getMyOffers);
router.delete('/offers/:id', deleteWasteOffer);
router.get('/purchase-requests', getPurchaseRequests);
router.put('/purchase-requests/:id', respondToPurchaseRequest);
router.post('/rate-collector', rateCollector);

module.exports = router;
