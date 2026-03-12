const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Collector = require('../models/Collector');
const Vendor = require('../models/Vendor');
const Admin = require('../models/Admin');

// Protect routes - general authentication
exports.protect = async (req, res, next) => {
  let token;

  console.log('🔐 Auth middleware - Headers:', req.headers.authorization);

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  console.log('🔐 Token extracted:', token ? 'Yes' : 'No');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 Token decoded:', decoded);
    
    // Find user based on role
    let user;
    switch (decoded.role) {
      case 'user':
        user = await User.findById(decoded.id).select('-password');
        console.log('🔐 User found:', user ? 'Yes' : 'No');
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
    console.log('🔐 Authorize middleware - Required roles:', roles);
    console.log('🔐 Authorize middleware - User role:', req.userRole);
    
    if (!roles.includes(req.userRole)) {
      console.log('❌ Authorization failed!');
      return res.status(403).json({
        success: false,
        message: `User role '${req.userRole}' is not authorized to access this route`
      });
    }
    console.log('✅ Authorization passed! Moving to next middleware/controller');
    next();
  };
};
