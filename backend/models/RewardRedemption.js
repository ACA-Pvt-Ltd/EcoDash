const mongoose = require('mongoose');

const rewardRedemptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reward: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  pointsUsed: {
    type: Number,
    required: true
  },
  redemptionCode: {
    type: String,
    required: true
  },
  qrCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active'
  },
  usedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Index for user redemptions
rewardRedemptionSchema.index({ user: 1, createdAt: -1 });
rewardRedemptionSchema.index({ redemptionCode: 1 }, { unique: true });
rewardRedemptionSchema.index({ status: 1 });

module.exports = mongoose.model('RewardRedemption', rewardRedemptionSchema);
