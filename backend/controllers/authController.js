const User = require('../models/User');
const Collector = require('../models/Collector');
const Vendor = require('../models/Vendor');
const Admin = require('../models/Admin');
const { generateToken } = require('../config/jwt');
const { generateUserQRCode } = require('../utils/helpers');
const crypto = require('crypto');
const { hashResetCode } = require('../models/plugins/passwordReset');
const { sendPasswordResetEmail } = require('../utils/email');
const { resolveAdminAccess } = require('../services/adminAccess');

const MAX_RESET_ATTEMPTS = 5;

const getModelForRole = (role) => {
  switch (role) {
    case 'user':
      return User;
    case 'collector':
      return Collector;
    case 'vendor':
      return Vendor;
    case 'admin':
      return Admin;
    default:
      return null;
  }
};

// @desc    Register a new user/collector/vendor
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address, role, ...roleSpecificData } = req.body;

    if (!role || !['user', 'collector', 'vendor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid role (user, collector, or vendor)'
      });
    }

    // Check if email already exists in any collection
    const [existingUser, existingCollector, existingVendor] = await Promise.all([
      User.findOne({ email }),
      Collector.findOne({ email }),
      Vendor.findOne({ email })
    ]);

    if (existingUser || existingCollector || existingVendor) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    let account;
    let responseData;

    // Create account based on role
    if (role === 'user') {
      account = await User.create({
        name,
        email,
        password,
        phone,
        address
      });

      // Generate QR code for user
      const qrCode = await generateUserQRCode(account._id);
      account.qrCode = qrCode;
      await account.save();

      responseData = {
        _id: account._id,
        name: account.name,
        email: account.email,
        phone: account.phone,
        points: account.points,
        qrCode: account.qrCode,
        role: 'user'
      };
    } else if (role === 'collector') {
      const { acceptedWasteTypes, operatingHours, description, location } = roleSpecificData;
      
      account = await Collector.create({
        name,
        email,
        password,
        phone,
        address,
        acceptedWasteTypes: acceptedWasteTypes || ['Plastic', 'Paper', 'Glass', 'Metal'],
        operatingHours,
        description,
        location
      });

      responseData = {
        _id: account._id,
        name: account.name,
        email: account.email,
        phone: account.phone,
        totalWasteCollected: account.totalWasteCollected,
        acceptedWasteTypes: account.acceptedWasteTypes,
        isVerified: account.isVerified,
        role: 'collector'
      };
    } else if (role === 'vendor') {
      const { businessType, description, website, logo } = roleSpecificData;
      
      account = await Vendor.create({
        name,
        email,
        password,
        phone,
        address,
        businessType,
        description,
        website,
        logo
      });

      responseData = {
        _id: account._id,
        name: account.name,
        email: account.email,
        phone: account.phone,
        businessType: account.businessType,
        totalRewards: account.totalRewards,
        totalRedemptions: account.totalRedemptions,
        isVerified: account.isVerified,
        role: 'vendor'
      };
    }

    // Generate token
    const token = generateToken(account._id, role);

    res.status(201).json({
      success: true,
      data: responseData,
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Register a new user (legacy endpoint - for backward compatibility)
// @route   POST /api/auth/register/user
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address
    });

    // Generate QR code for user
    const qrCode = await generateUserQRCode(user._id);
    user.qrCode = qrCode;
    await user.save();

    // Generate token
    const token = generateToken(user._id, 'user');

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        points: user.points,
        qrCode: user.qrCode,
        role: 'user'
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user/collector/vendor/admin
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and role'
      });
    }

    // Find user based on role
    let user;
    let Model;
    
    switch (role) {
      case 'user':
        Model = User;
        break;
      case 'collector':
        Model = Collector;
        break;
      case 'vendor':
        Model = Vendor;
        break;
      case 'admin':
        Model = Admin;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
    }

    user = await Model.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator'
      });
    }

    // Generate token
    const token = generateToken(user._id, role);

    // Prepare response data
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: role
    };

    // Add role-specific data
    if (role === 'user') {
      userData.points = user.points;
      userData.qrCode = user.qrCode;
      userData.totalWasteDisposed = user.totalWasteDisposed;
    } else if (role === 'collector') {
      userData.totalWasteCollected = user.totalWasteCollected;
      userData.acceptedWasteTypes = user.acceptedWasteTypes;
      userData.isVerified = user.isVerified;
    } else if (role === 'vendor') {
      userData.totalRewards = user.totalRewards;
      userData.totalRedemptions = user.totalRedemptions;
      userData.isVerified = user.isVerified;
    } else if (role === 'admin') {
      const access = await resolveAdminAccess(user);
      userData.adminRole = access.role ? { _id: access.role._id, name: access.role.name, isExecutive: access.role.isExecutive } : null;
      userData.permissions = access.permissions;
    }

    res.status(200).json({
      success: true,
      data: userData,
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    let Model;
    switch (req.userRole) {
      case 'user':
        Model = User;
        break;
      case 'collector':
        Model = Collector;
        break;
      case 'vendor':
        Model = Vendor;
        break;
      case 'admin':
        Model = Admin;
        break;
    }

    const user = await Model.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true }
    );

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

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    let Model;
    switch (req.userRole) {
      case 'user':
        Model = User;
        break;
      case 'collector':
        Model = Collector;
        break;
      case 'vendor':
        Model = Vendor;
        break;
      case 'admin':
        Model = Admin;
        break;
    }

    const user = await Model.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Request a password reset code by email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and role'
      });
    }

    const Model = getModelForRole(role);
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const account = await Model.findOne({ email: String(email).toLowerCase().trim() });

    if (account && account.isActive) {
      const code = account.createPasswordResetCode();
      await account.save({ validateBeforeSave: false });

      try {
        await sendPasswordResetEmail({ to: account.email, name: account.name, code });
      } catch (emailError) {
        console.error('Password reset email failed:', emailError.message);
        account.clearPasswordReset();
        await account.save({ validateBeforeSave: false });
      }
    }

    // Same response whether or not the account exists, so emails can't be enumerated
    res.status(200).json({
      success: true,
      message: 'If an account exists for that email, a reset code has been sent.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reset password with the emailed code
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, role, code, newPassword } = req.body;

    if (!email || !role || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, role, code, and new password'
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const Model = getModelForRole(role);
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // 400 rather than 401: the mobile client clears stored auth on any 401
    const invalid = () => res.status(400).json({
      success: false,
      message: 'Invalid or expired code'
    });

    const account = await Model.findOne({ email: String(email).toLowerCase().trim() })
      .select('+resetPasswordCode');

    if (
      !account ||
      !account.resetPasswordCode ||
      !account.resetPasswordExpire ||
      account.resetPasswordExpire.getTime() < Date.now() ||
      account.resetPasswordAttempts >= MAX_RESET_ATTEMPTS
    ) {
      return invalid();
    }

    const expected = Buffer.from(account.resetPasswordCode, 'hex');
    const received = Buffer.from(hashResetCode(String(code).trim()), 'hex');

    if (!crypto.timingSafeEqual(expected, received)) {
      account.resetPasswordAttempts += 1;
      await account.save({ validateBeforeSave: false });
      return invalid();
    }

    account.password = newPassword;
    // Back-dated 1s because JWT iat is whole seconds: a login right after the
    // reset would otherwise have iat < passwordChangedAt and be rejected by protect
    account.passwordChangedAt = new Date(Date.now() - 1000);
    account.clearPasswordReset();
    // Skip full-document validation so accounts with incomplete legacy profiles
    // can still reset; the only changed field (password) is checked above
    await account.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
