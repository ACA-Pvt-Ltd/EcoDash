const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a badge name'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true
  },
  icon: {
    type: String,
    required: [true, 'Please add a badge icon/image']
  },
  level: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
    required: true
  },
  criteria: {
    type: {
      type: String,
      enum: ['waste_quantity', 'transactions_count', 'consecutive_days', 'challenge_completion', 'special'],
      required: true
    },
    threshold: {
      type: Number,
      required: true
    },
    wasteType: {
      type: String,
      enum: ['E-waste', 'Plastic', 'Polythene', 'Glass', 'Paper', 'Metal', 'Organic', 'Any'],
      default: 'Any'
    }
  },
  points: {
    type: Number,
    default: 0
  },
  rarity: {
    type: String,
    enum: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'],
    default: 'Common'
  },
  earnedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Badge', badgeSchema);
