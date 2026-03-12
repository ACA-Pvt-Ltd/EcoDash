const mongoose = require('mongoose');

const wasteTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collector',
    required: true
  },
  wasteType: {
    type: String,
    enum: ['E-waste', 'Plastic', 'Polythene', 'Glass', 'Paper', 'Metal', 'Organic'],
    required: [true, 'Please specify waste type']
  },
  quantity: {
    value: {
      type: Number,
      required: [true, 'Please specify quantity']
    },
    unit: {
      type: String,
      enum: ['kg', 'items', 'bags'],
      default: 'kg'
    }
  },
  pointsEarned: {
    type: Number,
    required: true,
    default: 0
  },
  rewardType: {
    type: String,
    enum: ['points', 'cash'],
    default: 'points'
  },
  cashAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationImage: {
    type: String,
    default: null
  },
  qrCodeScanned: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  verifiedAt: {
    type: Date
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    }
  }
}, {
  timestamps: true
});

// Index for queries
wasteTransactionSchema.index({ user: 1, createdAt: -1 });
wasteTransactionSchema.index({ collector: 1, createdAt: -1 });
wasteTransactionSchema.index({ status: 1 });

module.exports = mongoose.model('WasteTransaction', wasteTransactionSchema);
