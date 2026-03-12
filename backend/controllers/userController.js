const User = require('../models/User');
const Collector = require('../models/Collector');
const WasteTransaction = require('../models/WasteTransaction');
const Reward = require('../models/Reward');
const RewardRedemption = require('../models/RewardRedemption');
const Challenge = require('../models/Challenge');
const Badge = require('../models/Badge');
const UserWasteOffer = require('../models/UserWasteOffer');
const CollectorPurchaseRequest = require('../models/CollectorPurchaseRequest');
const { calculatePoints, generateRedemptionCode, generateRedemptionQRCode } = require('../utils/helpers');

// @desc    Get user dashboard stats
// @route   GET /api/users/dashboard
// @access  Private (User)
exports.getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('badges');
    
    // Get transaction stats
    const transactions = await WasteTransaction.find({ 
      user: req.user._id,
      status: 'verified'
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyTransactions = transactions.filter(t => t.createdAt >= thisMonth);
    const monthlyWaste = monthlyTransactions.reduce((sum, t) => sum + t.quantity.value, 0);

    // Waste breakdown by type
    const wasteBreakdown = {};
    transactions.forEach(t => {
      wasteBreakdown[t.wasteType] = (wasteBreakdown[t.wasteType] || 0) + t.quantity.value;
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          name: user.name,
          email: user.email,
          points: user.points,
          totalWasteDisposed: user.totalWasteDisposed,
          badges: user.badges
        },
        stats: {
          totalTransactions: transactions.length,
          monthlyWaste,
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

// @desc    Get nearby collection points
// @route   GET /api/users/collection-points
// @access  Private (User)
exports.getNearbyCollectors = async (req, res) => {
  try {
    console.log('🗺️ getNearbyCollectors controller called');
    console.log('🗺️ Query params:', req.query);

    const { wasteType } = req.query;

    // Return all active & verified collectors — no location filter
    const query = {
      isActive: true,
      isVerified: true,
    };

    // Filter by waste type if provided
    if (wasteType) {
      query.acceptedWasteTypes = wasteType;
    }

    console.log('🗺️ Fetching all collectors from database...');

    const collectors = await Collector.find(query).select('-password').sort('name');

    console.log('🗺️ Collectors found:', collectors.length);
    console.log('🗺️ Sending response...');

    res.status(200).json({
      success: true,
      count: collectors.length,
      data: collectors
    });
  } catch (error) {
    console.error('❌ Error in getNearbyCollectors:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's waste transactions
// @route   GET /api/users/transactions
// @access  Private (User)
exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await WasteTransaction.find({ user: req.user._id })
      .populate('collector', 'name address phone')
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

// @desc    Get available rewards
// @route   GET /api/users/rewards
// @access  Private (User)
exports.getAvailableRewards = async (req, res) => {
  try {
    const now = new Date();
    
    const rewards = await Reward.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { stockAvailable: null },
        { stockAvailable: { $gt: 0 } }
      ]
    }).populate('vendor', 'name logo');

    // Filter rewards user can afford
    const affordable = rewards.filter(r => r.pointsRequired <= req.user.points);
    const expensive = rewards.filter(r => r.pointsRequired > req.user.points);

    res.status(200).json({
      success: true,
      data: {
        affordable,
        comingSoon: expensive,
        userPoints: req.user.points
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Redeem a reward
// @route   POST /api/users/rewards/:rewardId/redeem
// @access  Private (User)
exports.redeemReward = async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.rewardId).populate('vendor');

    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // Check if reward is active and valid
    const now = new Date();
    if (!reward.isActive || reward.validUntil < now) {
      return res.status(400).json({
        success: false,
        message: 'Reward is not available'
      });
    }

    // Check stock
    if (reward.stockAvailable !== null && reward.stockAvailable <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Reward is out of stock'
      });
    }

    // Check if user has enough points
    if (req.user.points < reward.pointsRequired) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points'
      });
    }

    // Generate redemption code and QR
    const redemptionCode = generateRedemptionCode();
    const expiresAt = new Date(reward.validUntil);
    
    const redemptionData = {
      code: redemptionCode,
      userId: req.user._id,
      rewardId: reward._id,
      vendorId: reward.vendor._id
    };

    const qrCode = await generateRedemptionQRCode(redemptionData);

    // Create redemption record
    const redemption = await RewardRedemption.create({
      user: req.user._id,
      reward: reward._id,
      vendor: reward.vendor._id,
      pointsUsed: reward.pointsRequired,
      redemptionCode,
      qrCode,
      expiresAt
    });

    // Deduct points from user
    req.user.points -= reward.pointsRequired;
    await req.user.save();

    // Update reward stats
    reward.redeemed += 1;
    if (reward.stockAvailable !== null) {
      reward.stockAvailable -= 1;
    }
    await reward.save();

    // Update vendor stats
    reward.vendor.totalRedemptions += 1;
    await reward.vendor.save();

    res.status(201).json({
      success: true,
      data: {
        redemption,
        remainingPoints: req.user.points
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's redemptions
// @route   GET /api/users/redemptions
// @access  Private (User)
exports.getMyRedemptions = async (req, res) => {
  try {
    const redemptions = await RewardRedemption.find({ user: req.user._id })
      .populate('reward', 'title description image')
      .populate('vendor', 'name logo')
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

// @desc    Get active challenges
// @route   GET /api/users/challenges
// @access  Private (User)
exports.getActiveChallenges = async (req, res) => {
  try {
    const now = new Date();
    
    const challenges = await Challenge.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('reward.badge');

    // Add user's progress to each challenge
    const challengesWithProgress = challenges.map(challenge => {
      const participant = challenge.participants.find(
        p => p.user.toString() === req.user._id.toString()
      );

      return {
        ...challenge.toObject(),
        userProgress: participant ? participant.progress : 0,
        userCompleted: participant ? participant.completed : false,
        isParticipating: !!participant
      };
    });

    res.status(200).json({
      success: true,
      count: challengesWithProgress.length,
      data: challengesWithProgress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Join a challenge
// @route   POST /api/users/challenges/:challengeId/join
// @access  Private (User)
exports.joinChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Check if already participating
    const alreadyParticipating = challenge.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );

    if (alreadyParticipating) {
      return res.status(400).json({
        success: false,
        message: 'Already participating in this challenge'
      });
    }

    // Add user to participants
    challenge.participants.push({
      user: req.user._id,
      progress: 0,
      completed: false
    });

    await challenge.save();

    res.status(200).json({
      success: true,
      message: 'Successfully joined challenge',
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Private (User)
exports.getLeaderboard = async (req, res) => {
  try {
    const { period = 'all', limit = 50 } = req.query;

    let dateFilter = {};
    if (period === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: startOfMonth } };
    } else if (period === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      dateFilter = { createdAt: { $gte: startOfWeek } };
    }

    let leaderboard;

    if (period === 'all') {
      // All-time leaderboard based on total points
      leaderboard = await User.find({ isActive: true })
        .select('name profileImage points totalWasteDisposed badges')
        .sort('-points')
        .limit(parseInt(limit))
        .populate('badges', 'name icon level')
        .lean(); // Convert to plain JavaScript objects
    } else {
      // Period-based leaderboard
      const transactions = await WasteTransaction.aggregate([
        { 
          $match: { 
            status: 'verified',
            ...dateFilter
          } 
        },
        {
          $group: {
            _id: '$user',
            totalPoints: { $sum: '$pointsEarned' },
            totalWaste: { $sum: '$quantity.value' }
          }
        },
        { $sort: { totalPoints: -1 } },
        { $limit: parseInt(limit) }
      ]);

      const userIds = transactions.map(t => t._id);
      const users = await User.find({ _id: { $in: userIds } })
        .select('name profileImage badges')
        .populate('badges', 'name icon level');

      leaderboard = transactions.map(t => {
        const user = users.find(u => u._id.toString() === t._id.toString());
        return {
          ...user.toObject(),
          periodPoints: t.totalPoints,
          periodWaste: t.totalWaste
        };
      });
    }

    // Add rank
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      ...user
    }));

    res.status(200).json({
      success: true,
      count: rankedLeaderboard.length,
      data: rankedLeaderboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's badges
// @route   GET /api/users/badges
// @access  Private (User)
exports.getMyBadges = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('badges');
    const allBadges = await Badge.find({ isActive: true });

    const earned = user.badges;
    const available = allBadges.filter(
      badge => !user.badges.some(b => b._id.toString() === badge._id.toString())
    );

    res.status(200).json({
      success: true,
      data: {
        earned,
        available
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== USER WASTE OFFERS ====================

// @desc    Create waste offer (user sells waste)
// @route   POST /api/users/offers
// @access  Private (User)
exports.createWasteOffer = async (req, res) => {
  try {
    const { wasteType, quantity, description, expectedPrice, location, pickupPreference, availableFrom, availableUntil } = req.body;

    // Validate inputs
    if (!wasteType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide waste type'
      });
    }

    if (!quantity || !quantity.value || isNaN(quantity.value) || quantity.value <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid quantity with value greater than 0'
      });
    }

    if (!location || !location.address || !location.city) {
      return res.status(400).json({
        success: false,
        message: 'Please provide complete location (address and city)'
      });
    }

    const offer = await UserWasteOffer.create({
      user: req.user._id,
      wasteType,
      quantity: {
        value: quantity.value,
        unit: quantity.unit || 'kg'
      },
      description: description || '',
      expectedPrice: expectedPrice || 0,
      location,
      pickupPreference: pickupPreference || '',
      availableFrom: availableFrom || new Date(),
      availableUntil: availableUntil || null,
      status: 'available'
    });

    await offer.populate('user', 'name phone address');

    res.status(201).json({
      success: true,
      data: offer,
      message: 'Waste offer created successfully!'
    });
  } catch (error) {
    console.error('Error creating waste offer:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's waste offers
// @route   GET /api/users/offers
// @access  Private (User)
exports.getMyOffers = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { user: req.user._id };
    if (status) {
      query.status = status;
    }

    const offers = await UserWasteOffer.find(query)
      .populate('user', 'name phone address')
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

// @desc    Get purchase requests for user's offers
// @route   GET /api/users/purchase-requests
// @access  Private (User)
exports.getPurchaseRequests = async (req, res) => {
  try {
    const requests = await CollectorPurchaseRequest.find({
      user: req.user._id,
      status: { $in: ['pending', 'accepted'] }
    })
      .populate('userOffer', 'wasteType quantity description')
      .populate('collector', 'name phone businessName address')
      .sort('-createdAt');

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

// @desc    Accept/Reject purchase request
// @route   PUT /api/users/purchase-requests/:id
// @access  Private (User)
exports.respondToPurchaseRequest = async (req, res) => {
  try {
    const { status, response } = req.body; // status: 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use "accepted" or "rejected"'
      });
    }

    const purchaseRequest = await CollectorPurchaseRequest.findById(req.params.id)
      .populate('userOffer')
      .populate('collector', 'name phone');

    if (!purchaseRequest) {
      return res.status(404).json({
        success: false,
        message: 'Purchase request not found'
      });
    }

    // Verify this request belongs to the user
    if (purchaseRequest.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this request'
      });
    }

    if (purchaseRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${purchaseRequest.status}`
      });
    }

    purchaseRequest.status = status;
    purchaseRequest.userResponse = response || '';
    purchaseRequest.respondedAt = new Date();
    await purchaseRequest.save();

    // If accepted, update offer status to pending
    if (status === 'accepted') {
      const offer = await UserWasteOffer.findById(purchaseRequest.userOffer._id);
      offer.status = 'pending';
      await offer.save();
    }

    await purchaseRequest.populate('collector', 'name phone businessName');

    res.status(200).json({
      success: true,
      data: purchaseRequest,
      message: status === 'accepted' 
        ? 'Purchase request accepted! Collector will contact you for pickup.' 
        : 'Purchase request rejected.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete/Cancel waste offer
// @route   DELETE /api/users/offers/:id
// @access  Private (User)
exports.deleteWasteOffer = async (req, res) => {
  try {
    const offer = await UserWasteOffer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    if (offer.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this offer'
      });
    }

    offer.status = 'cancelled';
    await offer.save();

    res.status(200).json({
      success: true,
      message: 'Offer cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
