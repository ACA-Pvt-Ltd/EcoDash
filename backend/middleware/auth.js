const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Collector = require('../models/Collector');
const Vendor = require('../models/Vendor');
const Admin = require('../models/Admin');
const { getRequestAccess } = require('../services/adminAccess');
const { PERMISSIONS } = require('../config/adminPermissions');

// Protect routes - general authentication
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    // Find user based on role
    let user;
    switch (decoded.role) {
      case 'user':
        user = await User.findById(decoded.id).select('-password');
        break;
      case 'collector':
        user = await Collector.findById(decoded.id).select('-password');
        break;
      case 'vendor':
        user = await Vendor.findById(decoded.id).select('-password');
        break;
      case 'admin':
      case 'superadmin':
        user = await Admin.findById(decoded.id).select('-password');
        break;
      default:
        return res.status(401).json({
          success: false,
          message: 'Invalid role'
        });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Tokens issued before a password reset are no longer valid
    if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
      return res.status(401).json({
        success: false,
        message: 'Password changed, please log in again'
      });
    }

    req.user = user;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.userRole}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Admin portal: allow the request if the admin's role has ANY of the given permission keys
exports.requirePermission = (...keys) => {
  return async (req, res, next) => {
    try {
      const { permissions } = await getRequestAccess(req);
      if (keys.some((key) => permissions.includes(key))) return next();

      const label = PERMISSIONS.find((p) => p.key === keys[0])?.label.toLowerCase() || keys[0];
      return res.status(403).json({
        success: false,
        message: `You don't have permission to ${label}`
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
};
