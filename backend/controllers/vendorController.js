const Vendor = require('../models/Vendor');
const Reward = require('../models/Reward');
const RewardRedemption = require('../models/RewardRedemption');
const WastePurchase = require('../models/WastePurchase');
const WasteOffer = require('../models/WasteOffer');
const VendorPricing = require('../models/VendorPricing');
const Collector = require('../models/Collector');
const WasteTransaction = require('../models/WasteTransaction');

// @desc    Get vendor dashboard
// @route   GET /api/vendors/dashboard
// @access  Private (Vendor)
exports.getDashboard = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user._id);

    const now = new Date();

    // ── Date boundaries ──────────────────────────────────────────────────────
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // ── Purchase stats ───────────────────────────────────────────────────────
    const allPurchases = await WastePurchase.find({ vendor: req.user._id });

    const completedPurchases = allPurchases.filter(p => p.status === 'completed');
    const pendingPurchases   = allPurchases.filter(p => p.status === 'pending');

    const todayPurchases = completedPurchases.filter(
      p => new Date(p.createdAt) >= startOfToday
    );
    const weeklyPurchases = completedPurchases.filter(
      p => new Date(p.createdAt) >= startOfWeek
    );
    const monthlyPurchases = completedPurchases.filter(
      p => new Date(p.createdAt) >= startOfMonth
    );

    const sumWeight = arr => arr.reduce((s, p) => s + (p.quantity?.value || 0), 0);
    const sumAmount = arr => arr.reduce((s, p) => s + (p.totalAmount || 0), 0);

    const todayWeight   = sumWeight(todayPurchases);
    const weeklyWeight  = sumWeight(weeklyPurchases);
    const monthlyWeight = sumWeight(monthlyPurchases);
    const totalSpent    = sumAmount(completedPurchases);

    // Current inventory = all completed purchase weight
    const currentInventory = sumWeight(completedPurchases);

    // ── Active rewards ───────────────────────────────────────────────────────
    const activeRewards = await Reward.countDocuments({
      vendor: req.user._id,
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now }
    });

    // ── Monthly redemptions ──────────────────────────────────────────────────
    const monthRedemptions = await RewardRedemption.find({
      vendor: req.user._id,
      createdAt: { $gte: startOfMonth }
    });

    const monthlyRedemptionsCount    = monthRedemptions.length;
    const monthlyPointsDistributed   = monthRedemptions.reduce((s, r) => s + r.pointsUsed, 0);
    const uniqueUsersThisMonth       = new Set(monthRedemptions.map(r => r.user.toString())).size;

    res.status(200).json({
      success: true,
      data: {
        vendor: {
          name: vendor.name,
          logo: vendor.logo,
          totalRewards: vendor.totalRewards,
          totalRedemptions: vendor.totalRedemptions,
          uniqueUsers: vendor.uniqueUsers
        },
        // Purchase / waste stats (used by dashboard screen)
        todayPurchases:   todayPurchases.length,
        todayWeight:      parseFloat(todayWeight.toFixed(2)),
        weeklyWeight:     parseFloat(weeklyWeight.toFixed(2)),
        monthlyWeight:    parseFloat(monthlyWeight.toFixed(2)),
        totalSpent:       parseFloat(totalSpent.toFixed(2)),
        currentInventory: parseFloat(currentInventory.toFixed(2)),
        pendingPurchases: pendingPurchases.length,
        totalPurchases:   completedPurchases.length,
        // Rewards stats
        activeRewards,
        thisMonth: {
          redemptions:       monthlyRedemptionsCount,
          pointsDistributed: monthlyPointsDistributed,
          uniqueUsers:       uniqueUsersThisMonth
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

// @desc    Create a new reward
// @route   POST /api/vendors/rewards
// @access  Private (Vendor)
exports.createReward = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      pointsRequired,
      discountPercentage,
      discountAmount,
      stockAvailable,
      validFrom,
      validUntil,
      termsAndConditions,
      category
    } = req.body;

    const reward = await Reward.create({
      vendor: req.user._id,
      title,
      description,
      type,
      pointsRequired,
      discountPercentage,
      discountAmount,
      stockAvailable,
      validFrom: validFrom || Date.now(),
      validUntil,
      termsAndConditions,
      category
    });

    // Update vendor's total rewards count
    req.user.totalRewards += 1;
    await req.user.save();

    res.status(201).json({
      success: true,
      data: reward
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all vendor's rewards
// @route   GET /api/vendors/rewards
// @access  Private (Vendor)
exports.getMyRewards = async (req, res) => {
  try {
    const { status = 'all' } = req.query;

    const query = { vendor: req.user._id };

    if (status === 'active') {
      const now = new Date();
      query.isActive = true;
      query.validFrom = { $lte: now };
      query.validUntil = { $gte: now };
    } else if (status === 'expired') {
      query.validUntil = { $lt: new Date() };
    } else if (status === 'upcoming') {
      query.validFrom = { $gt: new Date() };
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const rewards = await Reward.find(query).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: rewards.length,
      data: rewards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update a reward
// @route   PUT /api/vendors/rewards/:id
// @access  Private (Vendor)
exports.updateReward = async (req, res) => {
  try {
    let reward = await Reward.findById(req.params.id);

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // Make sure vendor owns the reward
    if (reward.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this reward'
      });
    }

    reward = await Reward.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: reward
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a reward
// @route   DELETE /api/vendors/rewards/:id
// @access  Private (Vendor)
exports.deleteReward = async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // Make sure vendor owns the reward
    if (reward.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this reward'
      });
    }

    // Soft delete - just deactivate
    reward.isActive = false;
    await reward.save();

    res.status(200).json({
      success: true,
      message: 'Reward deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get redemptions for vendor's rewards
// @route   GET /api/vendors/redemptions
// @access  Private (Vendor)
exports.getRedemptions = async (req, res) => {
  try {
    const { status, startDate, endDate, rewardId } = req.query;

    const query = { vendor: req.user._id };

    if (status) {
      query.status = status;
    }

    if (rewardId) {
      query.reward = rewardId;
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

    const redemptions = await RewardRedemption.find(query)
      .populate('user', 'name email phone')
      .populate('reward', 'title type pointsRequired')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: redemptions.length,
      data: redemptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Verify and use a redemption code
// @route   POST /api/vendors/redemptions/:code/verify
// @access  Private (Vendor)
exports.verifyRedemption = async (req, res) => {
  try {
    const redemption = await RewardRedemption.findOne({
      redemptionCode: req.params.code,
      vendor: req.user._id
    })
      .populate('user', 'name email phone')
      .populate('reward', 'title description type');

    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: 'Redemption code not found'
      });
    }

    if (redemption.status === 'used') {
      return res.status(400).json({
        success: false,
        message: 'This code has already been used',
        usedAt: redemption.usedAt
      });
    }

    if (redemption.status === 'expired') {
      return res.status(400).json({
        success: false,
        message: 'This code has expired'
      });
    }

    if (new Date() > redemption.expiresAt) {
      redemption.status = 'expired';
      await redemption.save();
      
      return res.status(400).json({
        success: false,
        message: 'This code has expired'
      });
    }

    // Mark as used
    redemption.status = 'used';
    redemption.usedAt = new Date();
    await redemption.save();

    res.status(200).json({
      success: true,
      message: 'Redemption verified successfully',
      data: redemption
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get vendor analytics/reports
// @route   GET /api/vendors/analytics
// @access  Private (Vendor)
exports.getAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let startDate;
    if (period === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const redemptions = await RewardRedemption.find({
      vendor: req.user._id,
      createdAt: { $gte: startDate }
    }).populate('reward', 'title type pointsRequired');

    // Analytics calculations
    const totalRedemptions = redemptions.length;
    const totalPointsDistributed = redemptions.reduce(
      (sum, r) => sum + r.pointsUsed,
      0
    );
    const uniqueUsers = new Set(redemptions.map(r => r.user.toString())).size;

    // Redemptions by reward
    const byReward = {};
    redemptions.forEach(r => {
      const rewardId = r.reward._id.toString();
      if (!byReward[rewardId]) {
        byReward[rewardId] = {
          reward: r.reward,
          count: 0,
          pointsUsed: 0
        };
      }
      byReward[rewardId].count += 1;
      byReward[rewardId].pointsUsed += r.pointsUsed;
    });

    // Daily breakdown
    const dailyStats = {};
    redemptions.forEach(r => {
      const date = r.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          redemptions: 0,
          points: 0,
          users: new Set()
        };
      }
      dailyStats[date].redemptions += 1;
      dailyStats[date].points += r.pointsUsed;
      dailyStats[date].users.add(r.user.toString());
    });

    // Convert sets to counts
    const dailyStatsArray = Object.values(dailyStats).map(day => ({
      date: day.date,
      redemptions: day.redemptions,
      points: day.points,
      uniqueUsers: day.users.size
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      data: {
        period,
        summary: {
          totalRedemptions,
          totalPointsDistributed,
          uniqueUsers,
          averagePointsPerRedemption: totalRedemptions > 0 
            ? Math.round(totalPointsDistributed / totalRedemptions) 
            : 0
        },
        byReward: Object.values(byReward),
        dailyStats: dailyStatsArray
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update vendor profile
// @route   PUT /api/vendors/profile
// @access  Private (Vendor)
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, description, businessType, address, website } = req.body;

    const vendor = await Vendor.findByIdAndUpdate(
      req.user._id,
      { name, phone, description, businessType, address, website },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get available waste offers from collectors (marketplace)
// @route   GET /api/vendors/offers
// @access  Private (Vendor)
// @desc    Get available waste offers from collectors
// @route   GET /api/vendors/offers
// @access  Private (Vendor)
exports.getOffers = async (req, res) => {
  try {
    const { wasteType, minQuantity, maxPrice } = req.query;

    let offerQuery = { 
      status: 'available'
    };

    // Filter by waste type
    if (wasteType) {
      offerQuery.wasteType = wasteType;
    }

    // Filter by minimum quantity
    if (minQuantity) {
      offerQuery['quantity.value'] = { $gte: parseFloat(minQuantity) };
    }

    // Filter by maximum price
    if (maxPrice) {
      offerQuery.minPricePerKg = { $lte: parseFloat(maxPrice) };
    }

    // No location filter — show all available offers from all collectors

    const offers = await WasteOffer.find(offerQuery)
      .populate('collector', 'name address phone location totalWasteCollected')
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

// @desc    Purchase waste from collector
// @route   POST /api/vendors/purchase
// @access  Private (Vendor)
// @desc    Purchase waste from collector (Create purchase request)
// @route   POST /api/vendors/purchase
// @access  Private (Vendor)
exports.purchaseWaste = async (req, res) => {
  try {
    const { offerId, collectorId, wasteType, quantity, pricePerUnit, notes, pickupDate } = req.body;

    // Validate required fields
    if (!collectorId || !wasteType || !quantity || !pricePerUnit) {
      return res.status(400).json({
        success: false,
        message: 'Please provide collectorId, wasteType, quantity, and pricePerUnit'
      });
    }

    // Verify collector exists
    const collector = await Collector.findById(collectorId);
    if (!collector) {
      return res.status(404).json({
        success: false,
        message: 'Collector not found'
      });
    }

    // If offerId provided, verify and reserve the offer
    let offer = null;
    if (offerId) {
      offer = await WasteOffer.findById(offerId);
      
      if (!offer || offer.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: 'Offer not available'
        });
      }

      // Mark the offer as sold (remove from available listings)
      offer.status = 'sold';
      await offer.save();
    }

    // Calculate total amount
    const totalAmount = quantity * pricePerUnit;

    // Create purchase record as completed immediately
    const purchase = await WastePurchase.create({
      vendor: req.user._id,
      collector: collectorId,
      offer: offerId || null,
      wasteType,
      quantity: {
        value: quantity,
        unit: 'kg'
      },
      pricePerUnit,
      totalAmount,
      status: 'completed',
      pickupDate: pickupDate || new Date(),
      vendorNotes: notes,
      location: collector.location,
      collectorResponse: {
        status: 'accepted'
      }
    });

    await purchase.populate('collector', 'name address phone');

    // TODO: Send notification to collector

    res.status(201).json({
      success: true,
      data: purchase,
      message: 'Purchase completed successfully.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get vendor's purchase requests and history
// @route   GET /api/vendors/purchases
// @access  Private (Vendor)
exports.getPurchases = async (req, res) => {
  try {
    const { status = 'all' } = req.query;

    let query = { vendor: req.user._id };
    
    if (status !== 'all') {
      query.status = status;
    }

    const purchases = await WastePurchase.find(query)
      .populate('collector', 'name address phone')
      .populate('offer', 'wasteType quantity minPricePerKg')
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

// @desc    Cancel purchase request
// @route   PUT /api/vendors/purchases/:id/cancel
// @access  Private (Vendor)
exports.cancelPurchase = async (req, res) => {
  try {
    const purchase = await WastePurchase.findOne({
      _id: req.params.id,
      vendor: req.user._id,
      status: { $in: ['pending', 'accepted'] }
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found or cannot be cancelled'
      });
    }

    purchase.status = 'cancelled';
    
    // Release the offer if it was reserved
    if (purchase.offer) {
      await WasteOffer.findByIdAndUpdate(purchase.offer, {
        status: 'available'
      });
    }

    await purchase.save();

    res.status(200).json({
      success: true,
      data: purchase,
      message: 'Purchase request cancelled'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get vendor's purchased waste inventory
// @route   GET /api/vendors/inventory
// @access  Private (Vendor)
exports.getVendorInventory = async (req, res) => {
  try {
    const { status = 'all' } = req.query;

    let query = { vendor: req.user._id };

    if (status !== 'all') {
      query.status = status;
    }

    const purchases = await WastePurchase.find(query)
      .populate('collector', 'name address phone')
      .sort('-createdAt');

    // Calculate inventory summary
    const inventory = {};
    purchases
      .filter(p => p.status === 'completed')
      .forEach(p => {
        if (!inventory[p.wasteType]) {
          inventory[p.wasteType] = {
            wasteType: p.wasteType,
            totalQuantity: 0,
            totalAmount: 0,
            purchases: 0
          };
        }
        inventory[p.wasteType].totalQuantity += p.quantity.value;
        inventory[p.wasteType].totalAmount += p.totalAmount;
        inventory[p.wasteType].purchases += 1;
      });

    res.status(200).json({
      success: true,
      data: {
        purchases,
        summary: Object.values(inventory)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get vendor pricing
// @route   GET /api/vendors/pricing
// @access  Private (Vendor)
exports.getPricing = async (req, res) => {
  try {
    let pricing = await VendorPricing.findOne({ vendor: req.user._id });

    if (!pricing) {
      // Create default pricing if not exists
      pricing = await VendorPricing.create({
        vendor: req.user._id,
        pricing: [
          { wasteType: 'E-waste', pricePerKg: 5.0, isActive: true },
          { wasteType: 'Plastic', pricePerKg: 0.5, isActive: true },
          { wasteType: 'Polythene', pricePerKg: 0.3, isActive: true },
          { wasteType: 'Glass', pricePerKg: 0.2, isActive: true },
          { wasteType: 'Paper', pricePerKg: 0.1, isActive: true },
          { wasteType: 'Metal', pricePerKg: 2.0, isActive: true },
          { wasteType: 'Organic', pricePerKg: 0.05, isActive: true }
        ]
      });
    }

    res.status(200).json({
      success: true,
      data: pricing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update vendor pricing
// @route   PUT /api/vendors/pricing
// @access  Private (Vendor)
exports.updatePricing = async (req, res) => {
  try {
    const { pricing } = req.body;

    if (!pricing || !Array.isArray(pricing)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide pricing array'
      });
    }

    let vendorPricing = await VendorPricing.findOne({ vendor: req.user._id });

    if (!vendorPricing) {
      vendorPricing = await VendorPricing.create({
        vendor: req.user._id,
        pricing
      });
    } else {
      vendorPricing.pricing = pricing;
      await vendorPricing.save();
    }

    res.status(200).json({
      success: true,
      data: vendorPricing,
      message: 'Pricing updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
