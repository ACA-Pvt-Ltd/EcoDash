const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getUsers,
  updateUserStatus,
  updateUser,
  createCollector,
  getCollectors,
  updateCollector,
  deleteCollector,
  createVendor,
  getVendors,
  updateVendor,
  deleteVendor,
  createChallenge,
  getChallenges,
  updateChallenge,
  createBadge,
  getBadges,
  getAnalytics,
  getAppConfig,
  updateAppConfig,
  getTransactions
} = require('../controllers/adminController');
const {
  getMyAccess,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getAdmins,
  createAdmin,
  updateAdmin
} = require('../controllers/adminAccessController');
const { protect, authorize, requirePermission: can } = require('../middleware/auth');

// All routes are protected and only for admins; each route then checks the
// admin's role permissions (see config/adminPermissions.js)
router.use(protect);
router.use(authorize('admin', 'superadmin'));

// The signed-in admin's role and permissions
router.get('/me', getMyAccess);

// Dashboard
router.get('/dashboard', can('dashboard.view'), getDashboard);

// User Management
router.get('/users', can('users.view'), getUsers);
router.put('/users/:id/status', can('users.deactivate'), updateUserStatus);
router.put('/users/:id', can('users.edit'), updateUser); // isActive changes also need users.deactivate

// Collector Management
router.post('/collectors', can('collectors.create'), createCollector);
router.get('/collectors', can('collectors.view'), getCollectors);
router.put('/collectors/:id', can('collectors.edit'), updateCollector); // isActive changes also need collectors.deactivate
router.delete('/collectors/:id', can('collectors.deactivate'), deleteCollector);

// Vendor Management
router.post('/vendors', can('vendors.create'), createVendor);
router.get('/vendors', can('vendors.view'), getVendors);
router.put('/vendors/:id', can('vendors.edit'), updateVendor); // isActive changes also need vendors.deactivate
router.delete('/vendors/:id', can('vendors.deactivate'), deleteVendor);

// Challenge Management
router.post('/challenges', can('rewards.manage'), createChallenge);
router.get('/challenges', can('rewards.manage'), getChallenges);
router.put('/challenges/:id', can('rewards.manage'), updateChallenge);

// Badge Management
router.post('/badges', can('rewards.manage'), createBadge);
router.get('/badges', can('rewards.manage'), getBadges);

// Analytics
router.get('/analytics', can('analytics.view'), getAnalytics);

// App Configuration (Configuration and Help Content pages; PUT is checked per key)
router.get('/config', can('config.view', 'content.view'), getAppConfig);
router.put('/config', can('config.edit', 'content.edit'), updateAppConfig);

// Transactions
router.get('/transactions', can('transactions.view'), getTransactions);

// Roles & permissions
router.get('/roles', can('roles.manage', 'admins.manage'), getRoles); // Admin Accounts needs the list to assign roles
router.post('/roles', can('roles.manage'), createRole);
router.put('/roles/:id', can('roles.manage'), updateRole);
router.delete('/roles/:id', can('roles.manage'), deleteRole);

// Admin accounts
router.get('/admins', can('admins.manage'), getAdmins);
router.post('/admins', can('admins.manage'), createAdmin);
router.put('/admins/:id', can('admins.manage'), updateAdmin);

module.exports = router;
