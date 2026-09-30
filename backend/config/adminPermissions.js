/**
 * Admin portal permission catalog — the single source of truth for what an
 * admin role can be allowed to do.
 *
 * Adding a feature later:
 *   1. Add an entry here.
 *   2. Guard its route with requirePermission('<key>') (routes/admin.js).
 *   3. Give its portal nav item / buttons the same key.
 * The Roles & Access page renders this list, so the new switch appears there
 * automatically. Executive gets it immediately; every other role starts off.
 */
const PERMISSIONS = [
  { key: 'dashboard.view',        group: 'Dashboard',     label: 'View dashboard',              description: 'See platform stats and charts' },

  { key: 'users.view',            group: 'Users',         label: 'View users',                  description: 'See the users list' },
  { key: 'users.edit',            group: 'Users',         label: 'Edit users',                  description: 'Change user names and phone numbers' },
  { key: 'users.deactivate',      group: 'Users',         label: 'Deactivate / activate users', description: 'Switch user accounts off and on' },

  { key: 'collectors.view',       group: 'Collectors',    label: 'View collectors',             description: 'See the collectors list' },
  { key: 'collectors.create',     group: 'Collectors',    label: 'Register collectors',         description: 'Create new collector accounts' },
  { key: 'collectors.edit',       group: 'Collectors',    label: 'Edit collectors',             description: 'Change collector details, waste types and hours' },
  { key: 'collectors.deactivate', group: 'Collectors',    label: 'Deactivate / activate collectors', description: 'Switch collector accounts off and on' },

  { key: 'vendors.view',          group: 'Vendors',       label: 'View vendors',                description: 'See the vendors list' },
  { key: 'vendors.create',        group: 'Vendors',       label: 'Register vendors',            description: 'Create new vendor accounts' },
  { key: 'vendors.edit',          group: 'Vendors',       label: 'Edit vendors',                description: 'Change vendor business details' },
  { key: 'vendors.deactivate',    group: 'Vendors',       label: 'Deactivate / activate vendors', description: 'Switch vendor accounts off and on' },

  { key: 'transactions.view',     group: 'Transactions',  label: 'View transactions',           description: 'See the transaction history' },

  { key: 'config.view',           group: 'Configuration', label: 'View configuration',          description: 'See rates, waste categories and limits' },
  { key: 'config.edit',           group: 'Configuration', label: 'Edit configuration',          description: 'Change rates, waste categories and limits' },

  { key: 'content.view',          group: 'Help Content',  label: 'View help content',           description: 'See the FAQ and support contact' },
  { key: 'content.edit',          group: 'Help Content',  label: 'Edit help content',           description: 'Change the FAQ and support contact' },

  { key: 'rewards.manage',        group: 'Rewards & Analytics', label: 'Manage challenges & badges', description: 'Create and edit challenges and badges' },
  { key: 'analytics.view',        group: 'Rewards & Analytics', label: 'View analytics',        description: 'Access analytics reports' },

  { key: 'admins.manage',         group: 'Access Control', label: 'Manage admin accounts',      description: 'Add admins, change their role, deactivate them' },
  { key: 'roles.manage',          group: 'Access Control', label: 'Manage roles & permissions', description: 'Create roles and switch features on or off' },
];

const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

// Help Content page settings; every other /admin/config key is Configuration
const CONTENT_CONFIG_KEYS = ['faq_items', 'support_contact'];

const VIEW_KEYS = PERMISSION_KEYS.filter((k) => k.endsWith('.view'));

// Seeded once; Executives can change Manager and Admin afterwards.
const DEFAULT_ROLES = [
  {
    key: 'executive',
    name: 'Executive',
    description: 'Full access, including roles and admin accounts. Always has every permission.',
    isSystem: true,
    isExecutive: true,
    permissions: [], // implicit: all
  },
  {
    key: 'manager',
    name: 'Manager',
    description: 'Runs day-to-day operations and can deactivate accounts.',
    isSystem: true,
    isExecutive: false,
    permissions: [
      ...VIEW_KEYS,
      'users.edit', 'users.deactivate',
      'collectors.create', 'collectors.edit', 'collectors.deactivate',
      'vendors.create', 'vendors.edit', 'vendors.deactivate',
      'config.edit', 'content.edit',
      'rewards.manage',
    ],
  },
  {
    key: 'admin',
    name: 'Admin',
    description: 'Views everything and handles account details and registrations.',
    isSystem: true,
    isExecutive: false,
    permissions: [
      ...VIEW_KEYS,
      'users.edit',
      'collectors.create', 'collectors.edit',
      'vendors.create', 'vendors.edit',
    ],
  },
];

module.exports = { PERMISSIONS, PERMISSION_KEYS, CONTENT_CONFIG_KEYS, DEFAULT_ROLES };
