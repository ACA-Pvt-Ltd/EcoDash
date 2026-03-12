const express = require('express');
const router = express.Router();
const {
  getDashboard,
  verifyDropoff,
  getTransactions,
  getReports,
  updateProfile,
  getInventory,
  getVendors,
  getUserByQR,
  createOffer,
  getOffers,
  updateOffer,
  deleteOffer,
  getPurchaseRequests,
  acceptPurchaseRequest,
  rejectPurchaseRequest,
  counterOffer,
  completePurchase,
  browseUserOffers,
  createUserPurchaseRequest,
  getMyUserPurchaseRequests,
  completeUserWastePickup,
  cancelUserPurchaseRequest
} = require('../controllers/collectorController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and only for collectors
router.use(protect);
router.use(authorize('collector'));

router.get('/dashboard', getDashboard);
router.post('/verify-qr', getUserByQR); // Look up user by QR code
router.post('/verify-dropoff', verifyDropoff);
router.post('/record-collection', verifyDropoff); // Alias for frontend compatibility
router.get('/transactions', getTransactions);
router.get('/reports', getReports);
router.get('/inventory', getInventory);
router.get('/vendors', getVendors);
router.put('/profile', updateProfile);

// Waste Offers (Collector to Vendor)
router.post('/offers', createOffer);
router.get('/offers', getOffers);
router.put('/offers/:id', updateOffer);
router.delete('/offers/:id', deleteOffer);

// Purchase Requests (Vendor to Collector)
router.get('/purchase-requests', getPurchaseRequests);
router.put('/purchase-requests/:id/accept', acceptPurchaseRequest);
router.put('/purchase-requests/:id/reject', rejectPurchaseRequest);
router.put('/purchase-requests/:id/counter', counterOffer);
router.put('/purchase-requests/:id/complete', completePurchase);

// User-to-Collector marketplace (Collector browses and buys from users)
router.get('/user-offers', browseUserOffers);
router.post('/user-offers/:offerId/request', createUserPurchaseRequest);
router.get('/user-purchase-requests', getMyUserPurchaseRequests);
router.put('/user-purchase-requests/:requestId/complete', completeUserWastePickup);
router.delete('/user-purchase-requests/:requestId', cancelUserPurchaseRequest);

module.exports = router;
