const crypto = require('crypto');

const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const hashResetCode = (code) =>
  crypto.createHash('sha256').update(String(code)).digest('hex');

// Adds self-service password reset fields and helpers to a role schema
// (User, Collector, Vendor, Admin each live in their own collection).
function passwordReset(schema) {
  schema.add({
    resetPasswordCode: { type: String, select: false },
    resetPasswordExpire: Date,
    resetPasswordAttempts: { type: Number, default: 0 },
    passwordChangedAt: Date,
  });

  // Generates a 6-digit code, stores only its hash, and returns the plain code
  schema.methods.createPasswordResetCode = function () {
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    this.resetPasswordCode = hashResetCode(code);
    this.resetPasswordExpire = new Date(Date.now() + RESET_CODE_TTL_MS);
    this.resetPasswordAttempts = 0;
    return code;
  };

  schema.methods.clearPasswordReset = function () {
    this.resetPasswordCode = undefined;
    this.resetPasswordExpire = undefined;
    this.resetPasswordAttempts = 0;
  };
}

module.exports = passwordReset;
module.exports.hashResetCode = hashResetCode;
module.exports.RESET_CODE_TTL_MS = RESET_CODE_TTL_MS;
