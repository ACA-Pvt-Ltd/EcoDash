const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Collector = require('../models/Collector');
const Vendor = require('../models/Vendor');
const UserWasteOffer = require('../models/UserWasteOffer');
const CollectorPurchaseRequest = require('../models/CollectorPurchaseRequest');
const WasteOffer = require('../models/WasteOffer');
const WastePurchase = require('../models/WastePurchase');
const Reward = require('../models/Reward');
const { sendAccountDeletedEmail } = require('../utils/email');
const { getSupportContact } = require('./accountNotifications');

const MAX_REASON_LENGTH = 500;
const OPEN_DEAL = { $in: ['pending', 'accepted'] };

const MODELS = { user: User, collector: Collector, vendor: Vendor };

// Personal fields removed on deletion, per role. Everything else (points, totals,
// ratings, collector location for the geo index) stays so history keeps adding up.
const PERSONAL_FIELDS = {
  user: ['address', 'profileImage', 'qrCode'],
  collector: ['address', 'profileImage', 'description', 'operatingHours'],
  vendor: ['address', 'logo', 'description', 'website'],
};

// Closes anything the account left open so nobody else acts on it
async function cancelOpenItems(role, id) {
  if (role === 'user') {
    await Promise.all([
      UserWasteOffer.updateMany({ user: id, status: { $in: ['available', 'pending'] } }, { $set: { status: 'cancelled' } }),
      CollectorPurchaseRequest.updateMany({ user: id, status: OPEN_DEAL }, { $set: { status: 'cancelled' } }),
    ]);
  } else if (role === 'collector') {
    await Promise.all([
      WasteOffer.updateMany({ collector: id, status: { $in: ['available', 'reserved'] } }, { $set: { status: 'cancelled' } }),
      CollectorPurchaseRequest.updateMany({ collector: id, status: OPEN_DEAL }, { $set: { status: 'cancelled' } }),
      WastePurchase.updateMany({ collector: id, status: OPEN_DEAL }, { $set: { status: 'cancelled' } }),
    ]);
  } else if (role === 'vendor') {
    await Promise.all([
      WastePurchase.updateMany({ vendor: id, status: OPEN_DEAL }, { $set: { status: 'cancelled' } }),
      Reward.updateMany({ vendor: id }, { $set: { isActive: false } }),
    ]);
  }
}

/**
 * Permanently closes a user, collector or vendor account: cancels their open
 * offers/requests, removes their personal data, ends every session, and emails
 * the address the account had. The record itself stays (as "Deleted user" etc.)
 * so transactions and history that reference it keep working. Can't be undone.
 *
 * Returns { status: 404 } when there's no such (undeleted) account, otherwise
 * { status: 200, name, email, emailSent }.
 */
async function deleteAccount({ role, id, reason }) {
  const Model = MODELS[role];
  const account = await Model.findOne({ _id: id, deletedAt: null }).select('name email');
  if (!account) return { status: 404 };

  const { name, email } = account;

  await cancelOpenItems(role, account._id);

  const now = new Date();
  const unset = Object.fromEntries(
    [...PERSONAL_FIELDS[role], 'resetPasswordCode', 'resetPasswordExpire'].map((field) => [field, ''])
  );
  // updateOne skips schema validation, which would otherwise demand the address/phone we're removing
  await Model.updateOne({ _id: account._id }, {
    $set: {
      name: `Deleted ${role}`,
      email: `deleted-${account._id}@deleted.invalid`, // unique, and frees the real address for a new sign-up
      phone: '',
      password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
      isActive: false,
      deletedAt: now,
      passwordChangedAt: now, // rejects every token issued before now
      resetPasswordAttempts: 0,
    },
    $unset: unset,
  });

  let emailSent = false;
  try {
    emailSent = await sendAccountDeletedEmail({
      to: email,
      name,
      role,
      reason: String(reason || '').trim().slice(0, MAX_REASON_LENGTH),
      supportContact: await getSupportContact(),
    });
  } catch (error) {
    console.error(`Account deleted email to ${email} failed:`, error.message);
  }

  return { status: 200, name, email, emailSent };
}

module.exports = { deleteAccount };
