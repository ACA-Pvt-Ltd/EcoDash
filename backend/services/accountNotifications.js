const AppConfig = require('../models/AppConfig');
const { sendAccountStatusEmail } = require('../utils/email');
const { DEFAULT_SUPPORT_CONTACT } = require('../config/contentDefaults');

const MAX_STATUS_REASON_LENGTH = 500;

// Support contact as edited on the admin Content page, falling back to the defaults
const getSupportContact = async () => {
  const doc = await AppConfig.findOne({ key: 'support_contact' });
  return { ...DEFAULT_SUPPORT_CONTACT, ...(doc?.value || {}) };
};

// Emails the account holder when an admin flips isActive. Never throws: a mail
// failure must not undo the status change. Returns whether an email went out.
const notifyStatusChange = async (account, role, wasActive, reason) => {
  if (!account || account.isActive === wasActive) return false;
  try {
    return await sendAccountStatusEmail({
      to: account.email,
      name: account.name,
      role,
      isActive: account.isActive,
      reason: account.isActive ? '' : String(reason || '').trim().slice(0, MAX_STATUS_REASON_LENGTH),
      supportContact: await getSupportContact(),
    });
  } catch (error) {
    console.error(`Account status email to ${account.email} failed:`, error.message);
    return false;
  }
};

module.exports = { getSupportContact, notifyStatusChange };
