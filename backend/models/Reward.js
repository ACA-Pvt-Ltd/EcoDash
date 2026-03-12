const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a reward title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true
  },
  image: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['Discount', 'Free Item', 'Coupon', 'Voucher', 'Eco-Product'],
    required: true
  },
  pointsRequired: {
    type: Number,
    required: [true, 'Please specify points required'],
    min: 0
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  discountAmount: {
    type: Number,
    min: 0
  },
  stockAvailable: {
    type: Number,
    default: null // null means unlimited
  },
  redeemed: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: [true, 'Please specify validity period']
  },
  termsAndConditions: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  category: {
    type: String,
    enum: ['Food & Beverage', 'Shopping', 'Services', 'Eco-Products', 'Other'],
    default: 'Other'
  }
}, {
  timestamps: true
});

// Index for active rewards
rewardSchema.index({ isActive: 1, validUntil: 1 });
rewardSchema.index({ vendor: 1 });

module.exports = mongoose.model('Reward', rewardSchema);
