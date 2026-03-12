const Collector = require('../models/Collector');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const WasteTransaction = require('../models/WasteTransaction');
const WasteOffer = require('../models/WasteOffer');
const WastePurchase = require('../models/WastePurchase');
const UserWasteOffer = require('../models/UserWasteOffer');
const CollectorPurchaseRequest = require('../models/CollectorPurchaseRequest');
const Badge = require('../models/Badge');
const { calculatePoints, checkBadgeEligibility } = require('../utils/helpers');

// @desc    Get collector dashboard
// @route   GET /api/collectors/dashboard
// @access  Private (Collector)
exports.getDashboard = async (req, res) => {
  try {
    const collector = await Collector.findById(req.user._id);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTransactions = await WasteTransaction.find({
      collector: req.user._id,
      createdAt: { $gte: today },
      status: 'verified'
    });

    const todayWaste = todayTransactions.reduce((sum, t) => sum + t.quantity.value, 0);

    // Get this month's stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthTransactions = await WasteTransaction.find({
      collector: req.user._id,
      createdAt: { $gte: startOfMonth },
      status: 'verified'
    });

    const monthWaste = monthTransactions.reduce((sum, t) => sum + t.quantity.value, 0);

    // Waste breakdown
    const wasteBreakdown = {};
    monthTransactions.forEach(t => {
      wasteBreakdown[t.wasteType] = (wasteBreakdown[t.wasteType] || 0) + t.quantity.value;
    });

    res.status(200).json({
      success: true,
      data: {
        collector: {
          name: collector.name,
          totalWasteCollected: collector.totalWasteCollected,
          totalTransactions: collector.totalTransactions,
          acceptedWasteTypes: collector.acceptedWasteTypes
        },
        today: {
          transactions: todayTransactions.length,
          wasteCollected: todayWaste
        },
        thisMonth: {
          transactions: monthTransactions.length,
          wasteCollected: monthWaste,
          wasteBreakdown
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify waste drop-off (QR scan)
// @route   POST /api/collectors/verify-dropoff
// @access  Private (Collector)
exports.verifyDropoff = async (req, res) => {
  try {
    const { userId, wasteType, quantity, unit, qrCodeScanned, notes, rewardType, cashAmount } = req.body;

    // Validate inputs
    if (!userId || !wasteType || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId, wasteType, and quantity'
      });
    }

    // Validate reward type
    const selectedRewardType = rewardType || 'points';
    if (!['points', 'cash'].includes(selectedRewardType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward type. Must be either "points" or "cash"'
      });
    }

    // Check if collector accepts this waste type
    if (!req.user.acceptedWasteTypes.includes(wasteType)) {
      return res.status(400).json({
        success: false,
        message: `This collection point does not accept ${wasteType}`
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate points (even for cash, we calculate for display)
    const pointsEarned = calculatePoints(wasteType, quantity);
    const finalCashAmount = selectedRewardType === 'cash' ? (cashAmount || 0) : 0;

    // Create waste transaction
    const transaction = await WasteTransaction.create({
      user: userId,
      collector: req.user._id,
      wasteType,
      quantity: {
        value: quantity,
        unit: unit || 'kg'
      },
      pointsEarned: selectedRewardType === 'points' ? pointsEarned : 0,
      rewardType: selectedRewardType,
      cashAmount: finalCashAmount,
      status: 'verified',
      qrCodeScanned: qrCodeScanned || false,
      notes,
      verifiedAt: new Date(),
      location: {
        type: 'Point',
        coordinates: req.user.location.coordinates
      }
    });

    // Update user stats based on reward type
    if (selectedRewardType === 'points') {
      user.points += pointsEarned;
      
      // Check for badge eligibility only for points
      const allBadges = await Badge.find({ isActive: true });
      const newBadges = await checkBadgeEligibility(user, allBadges);
      
      if (newBadges.length > 0) {
        user.badges.push(...newBadges);
        // Award bonus points for badges
        newBadges.forEach(badgeId => {
          const badge = allBadges.find(b => b._id.toString() === badgeId.toString());
          if (badge && badge.points) {
            user.points += badge.points;
          }
        });
      }
      
      user.totalWasteDisposed += quantity;
      await user.save();

      // Update collector stats
      req.user.totalWasteCollected += quantity;
      req.user.totalTransactions += 1;
      await req.user.save();

      // Populate the transaction for response
      await transaction.populate('user', 'name email');

      res.status(201).json({
        success: true,
        data: {
          transaction,
          newBadges: newBadges.length > 0 ? newBadges : null
        },
        message: `Successfully verified drop-off. User earned ${pointsEarned} points!`
      });
    } else {
      // Cash reward - no points or badges
      user.cashEarned = (user.cashEarned || 0) + finalCashAmount;
      user.totalWasteDisposed += quantity;
      await user.save();

      // Update collector stats
      req.user.totalWasteCollected += quantity;
      req.user.totalTransactions += 1;
      await req.user.save();

      // Populate the transaction for response
      await transaction.populate('user', 'name email');

      res.status(201).json({
        success: true,
        data: {
          transaction,
          newBadges: null
        },
        message: `Successfully verified drop-off. User earned LKR ${finalCashAmount.toFixed(2)} cash!`
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get collector's transactions
// @route   GET /api/collectors/transactions
// @access  Private (Collector)
exports.getTransactions = async (req, res) => {
  try {
    const { status, startDate, endDate, wasteType } = req.query;

    const query = { collector: req.user._id };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    if (wasteType) {
      query.wasteType = wasteType;
    }

    const transactions = await WasteTransaction.find(query)
      .populate('user', 'name email phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get collection reports
// @route   GET /api/collectors/reports
// @access  Private (Collector)
exports.getReports = async (req, res) => {
  try {
    const { period = 'month', year, month } = req.query;

    let startDate, endDate;

    if (period === 'day') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      endDate = new Date();
    } else if (period === 'month') {
      if (year && month) {
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0, 23, 59, 59, 999);
      } else {
        startDate = new Date();
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
      }
    } else if (period === 'year') {
      const currentYear = year || new Date().getFullYear();
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    }

    const transactions = await WasteTransaction.find({
      collector: req.user._id,
      status: 'verified',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Calculate statistics
    const totalTransactions = transactions.length;
    const totalWaste = transactions.reduce((sum, t) => sum + t.quantity.value, 0);
    const totalPoints = transactions.reduce((sum, t) => sum + t.pointsEarned, 0);

    // Waste breakdown by type
    const wasteByType = {};
    transactions.forEach(t => {
      if (!wasteByType[t.wasteType]) {
        wasteByType[t.wasteType] = {
          quantity: 0,
          transactions: 0,
          points: 0
        };
      }
      wasteByType[t.wasteType].quantity += t.quantity.value;
      wasteByType[t.wasteType].transactions += 1;
      wasteByType[t.wasteType].points += t.pointsEarned;
    });

    // Daily breakdown (for charts)
    const dailyStats = {};
    transactions.forEach(t => {
      const date = t.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          quantity: 0,
          transactions: 0,
          points: 0
        };
      }
      dailyStats[date].quantity += t.quantity.value;
      dailyStats[date].transactions += 1;
      dailyStats[date].points += t.pointsEarned;
    });

    res.status(200).json({
      success: true,
      data: {
        period,
        startDate,
        endDate,
        summary: {
          totalTransactions,
          totalWaste,
          totalPoints,
          uniqueUsers: new Set(transactions.map(t => t.user.toString())).size
        },
        wasteByType,
        dailyStats: Object.values(dailyStats).sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        )
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update collector profile
// @route   PUT /api/collectors/profile
// @access  Private (Collector)
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, operatingHours, description } = req.body;

    const collector = await Collector.findByIdAndUpdate(
      req.user._id,
      { name, phone, address, operatingHours, description },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: collector
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get collector's inventory breakdown by waste type
// @route   GET /api/collectors/inventory
// @access  Private (Collector)
exports.getInventory = async (req, res) => {
  try {
    // Get all verified transactions for this collector
    const transactions = await WasteTransaction.find({
      collector: req.user._id,
      status: 'verified'
    });

    // Get active offers for this collector
    const activeOffers = await WasteOffer.find({
      collector: req.user._id,
      status: { $in: ['available', 'reserved'] }
    });

    // Get pending and accepted purchase requests
    const purchases = await WastePurchase.find({
      collector: req.user._id,
      status: { $in: ['pending', 'accepted'] }
    });

    // Get completed purchases (sold history)
    const soldPurchases = await WastePurchase.find({
      collector: req.user._id,
      status: 'completed'
    });

    // Calculate quantities in offers and purchases by waste type
    const offeredQuantities = {};
    activeOffers.forEach(offer => {
      offeredQuantities[offer.wasteType] = (offeredQuantities[offer.wasteType] || 0) + offer.quantity.value;
    });

    const pendingQuantities = {};
    purchases.forEach(purchase => {
      pendingQuantities[purchase.wasteType] = (pendingQuantities[purchase.wasteType] || 0) + purchase.quantity.value;
    });

    const soldQuantities = {};
    soldPurchases.forEach(purchase => {
      soldQuantities[purchase.wasteType] = (soldQuantities[purchase.wasteType] || 0) + purchase.quantity.value;
    });

    // Calculate inventory by waste type
    const inventory = {};
    
    transactions.forEach(t => {
      if (!inventory[t.wasteType]) {
        inventory[t.wasteType] = {
          wasteType: t.wasteType,
          totalQuantity: 0,
          unit: t.quantity.unit || 'kg',
          transactions: 0,
          totalPoints: 0,
          status: {
            available: 0,
            inOffers: 0,
            pending: 0,
            sold: 0
          }
        };
      }
      inventory[t.wasteType].totalQuantity += t.quantity.value;
      inventory[t.wasteType].transactions += 1;
      inventory[t.wasteType].totalPoints += t.pointsEarned;
    });

    // Calculate status breakdown for each waste type
    Object.keys(inventory).forEach(wasteType => {
      const inOffers = offeredQuantities[wasteType] || 0;
      const pending = pendingQuantities[wasteType] || 0;
      const sold = soldQuantities[wasteType] || 0;
      const total = inventory[wasteType].totalQuantity;

      inventory[wasteType].status.inOffers = inOffers;
      inventory[wasteType].status.pending = pending;
      inventory[wasteType].status.sold = sold;
      inventory[wasteType].status.available = Math.max(0, total - inOffers - pending - sold);
    });

    res.status(200).json({
      success: true,
      data: Object.values(inventory)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get nearby vendors list
// @route   GET /api/collectors/vendors
// @access  Private (Collector)
exports.getVendors = async (req, res) => {
  try {
    // Show all active vendors (removed location filter and verification requirement)
    const vendors = await Vendor.find({ isActive: true })
      .select('name description logo businessType address website phone location')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user by QR code
// @route   POST /api/collectors/verify-qr
// @access  Private (Collector)
exports.getUserByQR = async (req, res) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide QR code'
      });
    }

    let userId = qrCode;

    // Try to parse QR code if it's JSON
    try {
      const qrData = JSON.parse(qrCode);
      // Support both 'id' and 'userId' fields in QR code
      if (qrData.id) {
        userId = qrData.id;
      } else if (qrData.userId) {
        userId = qrData.userId;
      } else if (qrData._id) {
        userId = qrData._id;
      }
    } catch {
      // QR code is plain user ID or QR string
    }

    // Look up user by _id first (most common case)
    let user = await User.findById(userId).select(
      'name email phone points totalWasteDisposed badges createdAt'
    );

    // If not found by _id, try by qrCode field
    if (!user) {
      user = await User.findOne({ qrCode: qrCode }).select(
        'name email phone points totalWasteDisposed badges createdAt'
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please check the QR code.'
      });
    }

    // Get user's recent transactions
    const recentTransactions = await WasteTransaction.find({
      user: user._id,
      collector: req.user._id
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('wasteType quantity pointsEarned createdAt');

    res.status(200).json({
      success: true,
      data: {
        user,
        recentTransactions,
        lastDropoff: recentTransactions.length > 0 ? recentTransactions[0].createdAt : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create waste offer
// @route   POST /api/collectors/offers
// @access  Private (Collector)
exports.createOffer = async (req, res) => {
  try {
    const { wasteType, quantity, minPricePerKg, description, expiresAt } = req.body;

    if (!wasteType || !quantity || !minPricePerKg) {
      return res.status(400).json({
        success: false,
        message: 'Please provide wasteType, quantity, and minPricePerKg'
      });
    }

    const collector = await Collector.findById(req.user._id);

    const offer = await WasteOffer.create({
      collector: req.user._id,
      wasteType,
      quantity: {
        value: quantity,
        unit: 'kg'
      },
      minPricePerKg,
      description,
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: collector.location
    });

    res.status(201).json({
      success: true,
      data: offer,
      message: 'Offer created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get collector's offers
// @route   GET /api/collectors/offers
// @access  Private (Collector)
exports.getOffers = async (req, res) => {
  try {
    const { status = 'all' } = req.query;

    let query = { collector: req.user._id };
    
    if (status !== 'all') {
      query.status = status;
    }

    const offers = await WasteOffer.find(query)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update/Delete offer
// @route   PUT /api/collectors/offers/:id
// @route   DELETE /api/collectors/offers/:id
// @access  Private (Collector)
exports.updateOffer = async (req, res) => {
  try {
    const offer = await WasteOffer.findOne({
      _id: req.params.id,
      collector: req.user._id
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    const updatedOffer = await WasteOffer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedOffer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    const offer = await WasteOffer.findOne({
      _id: req.params.id,
      collector: req.user._id
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    await offer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get purchase requests for collector
// @route   GET /api/collectors/purchase-requests
// @access  Private (Collector)
exports.getPurchaseRequests = async (req, res) => {
  try {
    const { status = 'all' } = req.query;

    let query = { collector: req.user._id };
    
    if (status !== 'all') {
      query.status = status;
    }

    const purchases = await WastePurchase.find(query)
      .populate('vendor', 'name address phone businessType')
      .populate('offer', 'wasteType quantity')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Accept purchase request
// @route   PUT /api/collectors/purchase-requests/:id/accept
// @access  Private (Collector)
exports.acceptPurchaseRequest = async (req, res) => {
  try {
    const { notes, pickupDate } = req.body || {};

    const purchase = await WastePurchase.findOne({
      _id: req.params.id,
      collector: req.user._id,
      status: 'pending'
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found or already processed'
      });
    }

    purchase.status = 'completed';
    purchase.collectorResponse = {
      status: 'accepted',
      message: notes || 'Accepted',
      respondedAt: new Date()
    };
    if (notes) {
      purchase.collectorNotes = notes;
    }
    if (pickupDate) {
      purchase.pickupDate = pickupDate;
    }

    await purchase.save();
    await purchase.populate('vendor', 'name phone');

    // Update the linked offer status to 'sold' if it exists
    if (purchase.offer) {
      const WasteOffer = require('../models/WasteOffer');
      await WasteOffer.findByIdAndUpdate(purchase.offer, { status: 'sold' });
    }

    // TODO: Send notification to vendor

    res.status(200).json({
      success: true,
      data: purchase,
      message: 'Purchase request accepted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject purchase request
// @route   PUT /api/collectors/purchase-requests/:id/reject
// @access  Private (Collector)
exports.rejectPurchaseRequest = async (req, res) => {
  try {
    const { reason } = req.body || {};

    const purchase = await WastePurchase.findOne({
      _id: req.params.id,
      collector: req.user._id,
      status: 'pending'
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found or already processed'
      });
    }

    purchase.status = 'rejected';
    purchase.collectorResponse = {
      status: 'rejected',
      message: reason || 'Rejected by collector',
      respondedAt: new Date()
    };
    if (reason) {
      purchase.collectorNotes = reason;
    }

    await purchase.save();
    await purchase.populate('vendor', 'name phone');

    // TODO: Send notification to vendor

    res.status(200).json({
      success: true,
      data: purchase,
      message: 'Purchase request rejected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Counter-offer for purchase request
// @route   PUT /api/collectors/purchase-requests/:id/counter
// @access  Private (Collector)
exports.counterOffer = async (req, res) => {
  try {
    const { counterPrice, message } = req.body;

    if (!counterPrice) {
      return res.status(400).json({
        success: false,
        message: 'Please provide counter price'
      });
    }

    const purchase = await WastePurchase.findOne({
      _id: req.params.id,
      collector: req.user._id,
      status: 'pending'
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found or already processed'
      });
    }

    purchase.collectorResponse = {
      status: 'counter-offered',
      counterPrice,
      message: message || `Counter offer: Rs. ${counterPrice}/kg`,
      respondedAt: new Date()
    };

    await purchase.save();
    await purchase.populate('vendor', 'name phone');

    // TODO: Send notification to vendor

    res.status(200).json({
      success: true,
      data: purchase,
      message: 'Counter offer sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Complete purchase (mark as delivered)
// @route   PUT /api/collectors/purchase-requests/:id/complete
// @access  Private (Collector)
exports.completePurchase = async (req, res) => {
  try {
    const purchase = await WastePurchase.findOne({
      _id: req.params.id,
      collector: req.user._id,
      status: 'accepted'
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found or not in accepted status'
      });
    }

    purchase.status = 'completed';
    purchase.actualPickupDate = new Date();

    // Update collector's inventory (reduce quantity)
    const collector = await Collector.findById(req.user._id);
    // You might want to implement inventory tracking here

    await purchase.save();

    res.status(200).json({
      success: true,
      data: purchase,
      message: 'Purchase completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ====== USER-TO-COLLECTOR MARKETPLACE ENDPOINTS ======

// Browse available user waste offers
exports.browseUserOffers = async (req, res) => {
  try {
    const { wasteType, city, minQuantity, maxQuantity, sortBy = 'createdAt' } = req.query;

    // Build query
    let query = { status: 'available' };

    // Filter by waste type if provided
    if (wasteType) {
      query.wasteType = wasteType;
    }

    // Filter by city if provided
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    // Filter by quantity range
    if (minQuantity || maxQuantity) {
      query['quantity.value'] = {};
      if (minQuantity) query['quantity.value'].$gte = parseFloat(minQuantity);
      if (maxQuantity) query['quantity.value'].$lte = parseFloat(maxQuantity);
    }

    // Ensure offers are currently available (within date range)
    const now = new Date();
    query.availableFrom = { $lte: now };
    query.$or = [
      { availableUntil: { $gte: now } },
      { availableUntil: null }
    ];

    const offers = await UserWasteOffer.find(query)
      .populate('user', 'name email phone address')
      .sort({ [sortBy]: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create a purchase request for a user's waste offer
exports.createUserPurchaseRequest = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { offeredPrice, message, proposedPickupTime } = req.body;

    // Validate required fields
    if (!offeredPrice || !proposedPickupTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide offered price and proposed pickup time'
      });
    }

    // Check if offer exists and is available
    const offer = await UserWasteOffer.findById(offerId);
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Waste offer not found'
      });
    }

    if (offer.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'This offer is no longer available'
      });
    }

    // Check if collector already has a pending request for this offer
    const existingRequest = await CollectorPurchaseRequest.findOne({
      userOffer: offerId,
      collector: req.user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this offer'
      });
    }

    // Create purchase request
    const purchaseRequest = await CollectorPurchaseRequest.create({
      userOffer: offerId,
      collector: req.user._id,
      user: offer.user,
      offeredPrice: parseFloat(offeredPrice),
      proposedPrice: parseFloat(offeredPrice), // Same as offeredPrice initially
      message,
      proposedPickupTime: new Date(proposedPickupTime)
    });

    // Update offer status to pending
    offer.status = 'pending';
    await offer.save();

    // Populate the request before sending response
    const populatedRequest = await CollectorPurchaseRequest.findById(purchaseRequest._id)
      .populate('userOffer')
      .populate('collector', 'name email phone')
      .populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      data: populatedRequest,
      message: 'Purchase request sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get collector's purchase requests (sent to users)
exports.getMyUserPurchaseRequests = async (req, res) => {
  try {
    const { status } = req.query;

    let query = { collector: req.user._id };
    if (status) {
      query.status = status;
    }

    const requests = await CollectorPurchaseRequest.find(query)
      .populate('userOffer')
      .populate('user', 'name email phone address')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Complete the user waste pickup (after user accepted)
exports.completeUserWastePickup = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { paymentAmount } = req.body; // Amount collector pays to user

    console.log('Complete pickup request:', { requestId, paymentAmount });

    const purchaseRequest = await CollectorPurchaseRequest.findOne({
      _id: requestId,
      collector: req.user._id,
      status: 'accepted'
    }).populate('userOffer');

    if (!purchaseRequest) {
      console.log('Purchase request not found or not accepted');
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found or not in accepted status'
      });
    }

    const offer = purchaseRequest.userOffer;
    const finalPayment = paymentAmount || purchaseRequest.proposedPrice || purchaseRequest.offeredPrice;

    console.log('Processing completion:', {
      offerId: offer._id,
      finalPayment,
      wasteType: offer.wasteType,
      quantity: offer.quantity
    });

    // Update request status to completed
    purchaseRequest.status = 'completed';
    purchaseRequest.completedAt = new Date();
    purchaseRequest.finalPayment = finalPayment;
    await purchaseRequest.save();

    // Update the user offer status to sold
    offer.status = 'sold';
    await offer.save();
    console.log('Offer status updated to sold');

    // Pay the user (cash earned)
    const User = require('../models/User');
    const user = await User.findById(offer.user);
    if (user) {
      const pointsEarned = Math.floor(offer.quantity.value * 10);
      user.cashEarned = (user.cashEarned || 0) + finalPayment;
      user.totalWasteDisposed = (user.totalWasteDisposed || 0) + offer.quantity.value;
      user.points = (user.points || 0) + pointsEarned;
      
      await user.save();
      console.log('User updated:', {
        userId: user._id,
        cashEarned: user.cashEarned,
        points: user.points,
        pointsEarned
      });
    }

    // Update collector's inventory
    const Collector = require('../models/Collector');
    const collector = await Collector.findById(req.user._id);
    
    if (!collector.inventory) {
      collector.inventory = {};
    }

    // Map waste types to inventory keys (handle case variations)
    const wasteTypeMap = {
      'e-waste': 'ewaste',
      'ewaste': 'ewaste',
      'plastic': 'plastic',
      'polythene': 'polythene',
      'glass': 'glass',
      'paper': 'paper',
      'metal': 'metal',
      'organic': 'organic'
    };

    const wasteType = offer.wasteType.toLowerCase().replace(/[^a-z]/g, '');
    const inventoryKey = wasteTypeMap[wasteType] || wasteType;

    if (collector.inventory[inventoryKey] !== undefined) {
      collector.inventory[inventoryKey] += offer.quantity.value;
    } else {
      collector.inventory[inventoryKey] = offer.quantity.value;
    }
    
    collector.markModified('inventory');
    await collector.save();
    
    console.log('Collector inventory updated:', {
      collectorId: collector._id,
      inventoryKey,
      addedQuantity: offer.quantity.value,
      newTotal: collector.inventory[inventoryKey]
    });

    const populatedRequest = await CollectorPurchaseRequest.findById(purchaseRequest._id)
      .populate('userOffer')
      .populate('user', 'name email phone cashEarned points')
      .lean();

    res.status(200).json({
      success: true,
      data: populatedRequest,
      message: `Waste pickup completed! User received LKR ${finalPayment} and ${Math.floor(offer.quantity.value * 10)} points.`,
      payment: {
        amount: finalPayment,
        pointsEarned: Math.floor(offer.quantity.value * 10)
      }
    });
  } catch (error) {
    console.error('Error completing pickup:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Cancel a purchase request (before user responds)
exports.cancelUserPurchaseRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const purchaseRequest = await CollectorPurchaseRequest.findOne({
      _id: requestId,
      collector: req.user._id,
      status: 'pending'
    });

    if (!purchaseRequest) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found or cannot be cancelled'
      });
    }

    purchaseRequest.status = 'cancelled';
    await purchaseRequest.save();

    // Set offer back to available if no other pending requests
    const otherPendingRequests = await CollectorPurchaseRequest.countDocuments({
      userOffer: purchaseRequest.userOffer,
      status: 'pending'
    });

    if (otherPendingRequests === 0) {
      await UserWasteOffer.findByIdAndUpdate(purchaseRequest.userOffer, {
        status: 'available'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Purchase request cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
