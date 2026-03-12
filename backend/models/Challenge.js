const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a challenge title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true
  },
  icon: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Special'],
    required: true
  },
  goal: {
    wasteType: {
      type: String,
      enum: ['E-waste', 'Plastic', 'Polythene', 'Glass', 'Paper', 'Metal', 'Organic', 'Any'],
      default: 'Any'
    },
    targetQuantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['kg', 'items', 'transactions'],
      default: 'kg'
    }
  },
  reward: {
    points: {
      type: Number,
      required: true
    },
    badge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge'
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    progress: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for active challenges
challengeSchema.index({ isActive: 1, endDate: 1 });
challengeSchema.index({ type: 1 });

module.exports = mongoose.model('Challenge', challengeSchema);
