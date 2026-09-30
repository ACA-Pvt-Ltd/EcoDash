const Admin = require('../models/Admin');
const AdminRole = require('../models/AdminRole');
const { PERMISSION_KEYS, DEFAULT_ROLES } = require('../config/adminPermissions');

let defaultsReady = null;

// Creates the built-in roles if they don't exist yet. Never overwrites edits an
// Executive has made to Manager/Admin. Runs once per process (incl. serverless cold starts).
function ensureDefaultRoles() {
  if (!defaultsReady) {
    defaultsReady = Promise.all(
      DEFAULT_ROLES.map((role) =>
        AdminRole.updateOne({ key: role.key }, { $setOnInsert: role }, { upsert: true })
      )
    ).catch((error) => {
      defaultsReady = null; // retry on the next request
      throw error;
    });
  }
  return defaultsReady;
}

// The Executive role, recreating the defaults if they were removed after this
// process last checked (e.g. the roles collection was dropped)
async function getExecutiveRole() {
  await ensureDefaultRoles();
  let executive = await AdminRole.findOne({ key: 'executive' });
  if (!executive) {
    defaultsReady = null;
    await ensureDefaultRoles();
    executive = await AdminRole.findOne({ key: 'executive' });
  }
  return executive;
}

// Effective permission keys for a role; Executive always gets the full catalog
function permissionsForRole(role) {
  if (!role) return [];
  if (role.isExecutive) return [...PERMISSION_KEYS];
  return (role.permissions || []).filter((key) => PERMISSION_KEYS.includes(key));
}

// Bulk version of the migration in resolveAdminAccess, for listing all admins
async function assignExecutiveToUnassigned() {
  const executive = await getExecutiveRole();
  await Admin.updateMany({ adminRole: null }, { $set: { adminRole: executive._id } });
}

// Resolves an Admin document's role and permissions. Admins created before roles
// existed (or by create-admin.js) have no adminRole and are made Executive, so
// nobody loses the full access they had.
async function resolveAdminAccess(admin) {
  if (!admin.adminRole) {
    const executive = await getExecutiveRole();
    await Admin.updateOne({ _id: admin._id, adminRole: null }, { $set: { adminRole: executive._id } });
    admin.adminRole = executive._id;
  }

  const role = await AdminRole.findById(admin.adminRole);
  return { role, permissions: permissionsForRole(role) };
}

// Loads (once per request) and returns the calling admin's access
async function getRequestAccess(req) {
  if (!req.adminAccess) req.adminAccess = await resolveAdminAccess(req.user);
  return req.adminAccess;
}

async function can(req, key) {
  const { permissions } = await getRequestAccess(req);
  return permissions.includes(key);
}

module.exports = {
  ensureDefaultRoles,
  assignExecutiveToUnassigned,
  permissionsForRole,
  resolveAdminAccess,
  getRequestAccess,
  can,
};
