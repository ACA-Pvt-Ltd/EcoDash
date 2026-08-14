/**
 * Safe admin account tool — does NOT touch any other data.
 *
 * Usage:
 *   node create-admin.js                          → creates new admin with defaults below
 *   node create-admin.js reset                    → resets password of existing admin
 *
 * Edit the values in the CONFIG block before running.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

// ─── CONFIG — set these in your .env or pass as env vars ───────────────────
const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Super Admin';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_ROLE     = process.env.ADMIN_ROLE     || 'superadmin';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set as environment variables.');
  process.exit(1);
}
// ───────────────────────────────────────────────────────────────────────────

const PERMISSIONS = [
  'manage_users',
  'manage_collectors',
  'manage_vendors',
  'manage_rewards',
  'view_analytics',
  'manage_admins',
];

async function run() {
  const mode = process.argv[2] || 'create';

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    if (mode === 'reset') {
      // ── Reset password of existing admin ───────────────────────────────
      const admin = await Admin.findOne({ email: ADMIN_EMAIL }).select('+password');
      if (!admin) {
        console.error(`❌ No admin found with email: ${ADMIN_EMAIL}`);
        process.exit(1);
      }
      admin.password = ADMIN_PASSWORD;   // pre-save hook will hash this
      await admin.save();
      console.log(`✅ Password reset for: ${ADMIN_EMAIL}`);

    } else {
      // ── Create new admin ───────────────────────────────────────────────
      const existing = await Admin.findOne({ email: ADMIN_EMAIL });
      if (existing) {
        console.error(`❌ Admin already exists with email: ${ADMIN_EMAIL}`);
        console.log('   Run with "reset" argument to reset their password instead:');
        console.log('   node create-admin.js reset');
        process.exit(1);
      }

      const admin = await Admin.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: ADMIN_ROLE,
        permissions: PERMISSIONS,
      });

      console.log('✅ Admin created successfully!');
      console.log('   Name :', admin.name);
      console.log('   Email:', admin.email);
      console.log('   Role :', admin.role);
    }

    console.log('\n🔐 Login credentials:');
    console.log('   Email   :', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

run();
