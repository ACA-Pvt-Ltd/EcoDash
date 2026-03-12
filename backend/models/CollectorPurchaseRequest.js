const mongoose = require('mongoose');

const collectorPurchaseRequestSchema = new mongoose.Schema({
  userOffer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserWasteOffer',
    required: true
  },
  collector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collector',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offeredPrice: {
    type: Number,
    required: true
  },
  proposedPrice: {
    type: Number,
    required: false  // Optional, defaults to offeredPrice if not provided
  },
  finalPayment: {
    type: Number
  },
  message: {
    type: String,
    trim: true
  },
  proposedPickupTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  respondedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  userResponse: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
collectorPurchaseRequestSchema.index({ userOffer: 1, status: 1 });
collectorPurchaseRequestSchema.index({ collector: 1, status: 1 });
collectorPurchaseRequestSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('CollectorPurchaseRequest', collectorPurchaseRequestSchema);
