const User = require('../models/User');
const Collector = require('../models/Collector');
const Vendor = require('../models/Vendor');
const Admin = require('../models/Admin');
const WasteTransaction = require('../models/WasteTransaction');
const Reward = require('../models/Reward');
const Challenge = require('../models/Challenge');
const Badge = require('../models/Badge');
const { generateToken } = require('../config/jwt');

// @desc    Get admin dashboard overview
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getDashboard = async (req, res) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalCollectors = await Collector.countDocuments({ isActive: true });
    const totalVendors = await Vendor.countDocuments({ isActive: true });
    const totalTransactions = await WasteTransaction.countDocuments({ status: 'verified' });

    // Get this month's stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyTransactions = await WasteTransaction.find({
      status: 'verified',
      createdAt: { $gte: startOfMonth }
    });

    const monthlyWaste = monthlyTransactions.reduce((sum, t) => sum + t.quantity.value, 0);
    const monthlyPoints = monthlyTransactions.reduce((sum, t) => sum + t.pointsEarned, 0);

    // Total waste collected
    const allTransactions = await WasteTransaction.find({ status: 'verified' });
    const totalWaste = allTransactions.reduce((sum, t) => sum + t.quantity.value, 0);

    // Waste by type
    const wasteByType = {};
    allTransactions.forEach(t => {
      wasteByType[t.wasteType] = (wasteByType[t.wasteType] || 0) + t.quantity.value;
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalCollectors,
          totalVendors,
          totalTransactions,
          totalWaste
        },
        thisMonth: {
          transactions: monthlyTransactions.length,
          waste: monthlyWaste,
          points: monthlyPoints,
          newUsers: await User.countDocuments({ createdAt: { $gte: startOfMonth } })
        },
        wasteByType
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===== USER MANAGEMENT =====

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const users = await User.find(query)
      .select('-password')
      .populate('badges', 'name icon level')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===== COLLECTOR MANAGEMENT =====

// @desc    Create a new collector
// @route   POST /api/admin/collectors
// @access  Private (Admin)
exports.createCollector = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      location,
      operatingHours,
      acceptedWasteTypes,
      description
    } = req.body;

    const collectorExists = await Collector.findOne({ email });
    if (collectorExists) {
      return res.status(400).json({
        success: false,
        message: 'Collector already exists with this email'
      });
    }

    const collector = await Collector.create({
      name,
      email,
      password,
      phone,
      address,
      location,
      operatingHours,
      acceptedWasteTypes,
      description,
      isVerified: true,
      verifiedBy: req.user._id
    });

    res.status(201).json({
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

// @desc    Get all collectors
// @route   GET /api/admin/collectors
// @access  Private (Admin)
exports.getCollectors = async (req, res) => {
  try {
    const { search, status, verified } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.isActive = status === 'active';
    }

    if (verified !== undefined) {
      query.isVerified = verified === 'true';
    }

    const collectors = await Collector.find(query)
      .select('-password')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: collectors.length,
      data: collectors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update collector
// @route   PUT /api/admin/collectors/:id
// @access  Private (Admin)
exports.updateCollector = async (req, res) => {
  try {
    const collector = await Collector.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!collector) {
      return res.status(404).json({
        success: false,
        message: 'Collector not found'
      });
    }

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

// @desc    Delete collector
// @route   DELETE /api/admin/collectors/:id
// @access  Private (Admin)
exports.deleteCollector = async (req, res) => {
  try {
    const collector = await Collector.findById(req.params.id);

    if (!collector) {
      return res.status(404).json({
        success: false,
        message: 'Collector not found'
      });
    }

    // Soft delete - deactivate instead
    collector.isActive = false;
    await collector.save();

    res.status(200).json({
      success: true,
      message: 'Collector deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===== VENDOR MANAGEMENT =====

// @desc    Create a new vendor
// @route   POST /api/admin/vendors
// @access  Private (Admin)
exports.createVendor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      description,
      businessType,
      address,
      website,
      location
    } = req.body;

    const vendorExists = await Vendor.findOne({ email });
    if (vendorExists) {
      return res.status(400).json({
        success: false,
        message: 'Vendor already exists with this email'
      });
    }

    const vendor = await Vendor.create({
      name,
      email,
      password,
      phone,
      description,
      businessType,
      address,
      website,
      location,
      isVerified: true,
      verifiedBy: req.user._id
    });

    res.status(201).json({
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

// @desc    Get all vendors
// @route   GET /api/admin/vendors
// @access  Private (Admin)
exports.getVendors = async (req, res) => {
  try {
    const { search, status, verified } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.isActive = status === 'active';
    }

    if (verified !== undefined) {
      query.isVerified = verified === 'true';
    }

    const vendors = await Vendor.find(query)
      .select('-password')
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

// @desc    Update vendor
// @route   PUT /api/admin/vendors/:id
// @access  Private (Admin)
exports.updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

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

// @desc    Delete vendor
// @route   DELETE /api/admin/vendors/:id
// @access  Private (Admin)
exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Soft delete - deactivate instead
    vendor.isActive = false;
    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Vendor deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===== CHALLENGE & BADGE MANAGEMENT =====

// @desc    Create a new challenge
// @route   POST /api/admin/challenges
// @access  Private (Admin)
exports.createChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.create(req.body);

    res.status(201).json({
      success: true,
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all challenges
// @route   GET /api/admin/challenges
// @access  Private (Admin)
exports.getChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find().sort('-createdAt');

    res.status(200).json({
      success: true,
      count: challenges.length,
      data: challenges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update a challenge
// @route   PUT /api/admin/challenges/:id
// @access  Private (Admin)
exports.updateChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    res.status(200).json({
      success: true,
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create a new badge
// @route   POST /api/admin/badges
// @access  Private (Admin)
exports.createBadge = async (req, res) => {
  try {
    const badge = await Badge.create(req.body);

    res.status(201).json({
      success: true,
      data: badge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all badges
// @route   GET /api/admin/badges
// @access  Private (Admin)
exports.getBadges = async (req, res) => {
  try {
    const badges = await Badge.find().sort('level');

    res.status(200).json({
      success: true,
      count: badges.length,
      data: badges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===== ANALYTICS =====

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const query = Object.keys(dateFilter).length > 0 
      ? { createdAt: dateFilter, status: 'verified' } 
      : { status: 'verified' };

    const transactions = await WasteTransaction.find(query);

    // Calculate statistics
    const totalWaste = transactions.reduce((sum, t) => sum + t.quantity.value, 0);
    const totalPoints = transactions.reduce((sum, t) => sum + t.pointsEarned, 0);

    // By waste type
    const byWasteType = {};
    transactions.forEach(t => {
      if (!byWasteType[t.wasteType]) {
        byWasteType[t.wasteType] = { quantity: 0, transactions: 0, points: 0 };
      }
      byWasteType[t.wasteType].quantity += t.quantity.value;
      byWasteType[t.wasteType].transactions += 1;
      byWasteType[t.wasteType].points += t.pointsEarned;
    });

    // Top collectors
    const collectorStats = {};
    transactions.forEach(t => {
      const collectorId = t.collector.toString();
      if (!collectorStats[collectorId]) {
        collectorStats[collectorId] = { collectorId, waste: 0, transactions: 0 };
      }
      collectorStats[collectorId].waste += t.quantity.value;
      collectorStats[collectorId].transactions += 1;
    });

    const topCollectors = await Promise.all(
      Object.values(collectorStats)
        .sort((a, b) => b.waste - a.waste)
        .slice(0, 10)
        .map(async (stat) => {
          const collector = await Collector.findById(stat.collectorId).select('name address');
          return { ...stat, collector };
        })
    );

    // Top users
    const userStats = {};
    transactions.forEach(t => {
      const userId = t.user.toString();
      if (!userStats[userId]) {
        userStats[userId] = { userId, waste: 0, points: 0 };
      }
      userStats[userId].waste += t.quantity.value;
      userStats[userId].points += t.pointsEarned;
    });

    const topUsers = await Promise.all(
      Object.values(userStats)
        .sort((a, b) => b.points - a.points)
        .slice(0, 10)
        .map(async (stat) => {
          const user = await User.findById(stat.userId).select('name email');
          return { ...stat, user };
        })
    );

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalTransactions: transactions.length,
          totalWaste,
          totalPoints,
          uniqueUsers: new Set(transactions.map(t => t.user.toString())).size
        },
        byWasteType,
        topCollectors,
        topUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
