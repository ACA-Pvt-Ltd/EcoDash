const crypto = require('crypto');
const Admin = require('../models/Admin');
const AdminRole = require('../models/AdminRole');
const { PERMISSIONS, PERMISSION_KEYS } = require('../config/adminPermissions');
const { getRequestAccess, permissionsForRole, assignExecutiveToUnassigned, ensureDefaultRoles } = require('../services/adminAccess');
const { notifyStatusChange } = require('../services/accountNotifications');
const { sendWelcomeEmail } = require('../utils/email');

const SYSTEM_ROLE_ORDER = ['executive', 'manager', 'admin'];

// No look-alike characters (0/O, 1/l/I), since it may be read out or typed by hand
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const generateTemporaryPassword = () =>
  Array.from({ length: 12 }, () => PASSWORD_ALPHABET[crypto.randomInt(PASSWORD_ALPHABET.length)]).join('');

const cleanPermissions = (permissions) =>
  Array.isArray(permissions) ? [...new Set(permissions.filter((key) => PERMISSION_KEYS.includes(key)))] : [];

const slugify = (name) =>
  String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'role';

const roleSummary = (role) =>
  role ? { _id: role._id, name: role.name, key: role.key, isExecutive: role.isExecutive } : null;

// Number of active admins holding the Executive role, optionally ignoring one admin
const activeExecutiveCount = async (excludeAdminId) => {
  const executiveIds = (await AdminRole.find({ isExecutive: true }).select('_id')).map((r) => r._id);
  return Admin.countDocuments({
    adminRole: { $in: executiveIds },
    isActive: true,
    ...(excludeAdminId ? { _id: { $ne: excludeAdminId } } : {}),
  });
};

const LAST_EXECUTIVE_MESSAGE = 'There must always be at least one active Executive. Make someone else Executive first.';

// ===== MY ACCESS =====

// @desc    The signed-in admin's role and permissions (drives the portal's nav and buttons)
// @route   GET /api/admin/me
// @access  Private (any admin)
exports.getMyAccess = async (req, res) => {
  try {
    const { role, permissions } = await getRequestAccess(req);
    res.status(200).json({
      success: true,
      data: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: roleSummary(role),
        permissions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== ROLES =====

// @desc    All roles with member counts, plus the permission catalog
// @route   GET /api/admin/roles
// @access  Private (roles.manage)
exports.getRoles = async (req, res) => {
  try {
    await assignExecutiveToUnassigned();
    const [roles, counts] = await Promise.all([
      AdminRole.find().lean(),
      Admin.aggregate([{ $group: { _id: '$adminRole', count: { $sum: 1 } } }]),
    ]);
    const countByRole = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

    const rank = (r) => (r.isSystem ? SYSTEM_ROLE_ORDER.indexOf(r.key) : SYSTEM_ROLE_ORDER.length);
    const data = roles
      .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
      .map((role) => ({
        ...role,
        permissions: permissionsForRole(role),
        memberCount: countByRole[String(role._id)] || 0,
      }));

    res.status(200).json({ success: true, data, permissions: PERMISSIONS });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a custom role
// @route   POST /api/admin/roles
// @access  Private (roles.manage)
exports.createRole = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'Please add a role name' });
    }
    if (await AdminRole.exists({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })) {
      return res.status(400).json({ success: false, message: `A role called "${name}" already exists` });
    }

    let key = slugify(name);
    for (let n = 2; await AdminRole.exists({ key }); n++) key = `${slugify(name)}-${n}`;

    const role = await AdminRole.create({
      name,
      key,
      description: String(req.body.description || '').trim(),
      permissions: cleanPermissions(req.body.permissions),
      isSystem: false,
      isExecutive: false,
    });

    res.status(201).json({ success: true, data: { ...role.toObject(), memberCount: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a role's name, description or permissions
// @route   PUT /api/admin/roles/:id
// @access  Private (roles.manage)
exports.updateRole = async (req, res) => {
  try {
    const role = await AdminRole.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    if (role.isExecutive) {
      return res.status(400).json({
        success: false,
        message: "The Executive role always has every permission and can't be changed",
      });
    }

    const { name, description, permissions } = req.body;

    if (name !== undefined && String(name).trim() !== role.name) {
      if (role.isSystem) {
        return res.status(400).json({ success: false, message: "Built-in roles can't be renamed" });
      }
      const newName = String(name).trim();
      if (!newName) {
        return res.status(400).json({ success: false, message: 'Please add a role name' });
      }
      const clash = await AdminRole.findOne({
        _id: { $ne: role._id },
        name: new RegExp(`^${newName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      });
      if (clash) {
        return res.status(400).json({ success: false, message: `A role called "${newName}" already exists` });
      }
      role.name = newName;
    }
    if (description !== undefined) role.description = String(description).trim();
    if (permissions !== undefined) role.permissions = cleanPermissions(permissions);

    await role.save();
    const memberCount = await Admin.countDocuments({ adminRole: role._id });
    res.status(200).json({ success: true, data: { ...role.toObject(), memberCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a custom role that nobody holds
// @route   DELETE /api/admin/roles/:id
// @access  Private (roles.manage)
exports.deleteRole = async (req, res) => {
  try {
    const role = await AdminRole.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }
    if (role.isSystem) {
      return res.status(400).json({ success: false, message: "Built-in roles can't be deleted" });
    }
    const memberCount = await Admin.countDocuments({ adminRole: role._id });
    if (memberCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Move the ${memberCount} admin${memberCount === 1 ? '' : 's'} with this role to another role first`,
      });
    }

    await role.deleteOne();
    res.status(200).json({ success: true, message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===== ADMIN ACCOUNTS =====

// @desc    All admin accounts with their roles
// @route   GET /api/admin/admins
// @access  Private (admins.manage)
exports.getAdmins = async (req, res) => {
  try {
    await assignExecutiveToUnassigned();
    const admins = await Admin.find()
      .select('name email isActive adminRole createdAt')
      .populate('adminRole', 'name key isExecutive')
      .sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add an admin account; a temporary password is emailed and returned once
// @route   POST /api/admin/admins
// @access  Private (admins.manage)
exports.createAdmin = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').toLowerCase().trim();
    const { adminRoleId } = req.body;

    if (!name || !email || !adminRoleId) {
      return res.status(400).json({ success: false, message: 'Name, email and role are required' });
    }
    await ensureDefaultRoles();
    const role = await AdminRole.findById(adminRoleId);
    if (!role) {
      return res.status(400).json({ success: false, message: 'Please choose a valid role' });
    }
    if (await Admin.exists({ email })) {
      return res.status(400).json({ success: false, message: 'An admin with this email already exists' });
    }

    const temporaryPassword = generateTemporaryPassword();
    const admin = await Admin.create({ name, email, password: temporaryPassword, adminRole: role._id });

    let emailSent = false;
    try {
      emailSent = await sendWelcomeEmail({ to: email, name, role: role.name, password: temporaryPassword });
    } catch (emailError) {
      console.error(`Welcome email to ${email} failed:`, emailError.message);
    }

    res.status(201).json({
      success: true,
      data: { _id: admin._id, name, email, isActive: true, adminRole: roleSummary(role), createdAt: admin.createdAt },
      temporaryPassword,
      emailSent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change an admin's name, role or active status
// @route   PUT /api/admin/admins/:id
// @access  Private (admins.manage)
exports.updateAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).populate('adminRole', 'name key isExecutive');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const { name, adminRoleId, isActive, reason } = req.body;
    const isSelf = String(admin._id) === String(req.user._id);
    const wasActive = admin.isActive;
    const wasExecutive = Boolean(admin.adminRole?.isExecutive);

    let newRole = admin.adminRole;
    if (adminRoleId !== undefined && String(adminRoleId) !== String(admin.adminRole?._id)) {
      if (isSelf) {
        return res.status(400).json({ success: false, message: "You can't change your own role" });
      }
      newRole = await AdminRole.findById(adminRoleId);
      if (!newRole) {
        return res.status(400).json({ success: false, message: 'Please choose a valid role' });
      }
    }

    const deactivating = isActive !== undefined && !isActive && wasActive;
    if (deactivating && isSelf) {
      return res.status(400).json({ success: false, message: "You can't deactivate your own account" });
    }

    // Losing an active Executive (demoted or deactivated) must leave at least one behind
    const losesExecutive = wasExecutive && wasActive && (!newRole?.isExecutive || deactivating);
    if (losesExecutive && (await activeExecutiveCount(admin._id)) === 0) {
      return res.status(400).json({ success: false, message: LAST_EXECUTIVE_MESSAGE });
    }

    if (name !== undefined && String(name).trim()) admin.name = String(name).trim();
    if (newRole) admin.adminRole = newRole._id;
    if (isActive !== undefined) admin.isActive = Boolean(isActive);
    await admin.save({ validateBeforeSave: false });

    const emailSent = await notifyStatusChange(admin, newRole?.name || 'admin', wasActive, reason);

    res.status(200).json({
      success: true,
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive,
        adminRole: roleSummary(newRole),
        createdAt: admin.createdAt,
      },
      emailSent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
