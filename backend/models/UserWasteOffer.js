const mongoose = require('mongoose');

const userWasteOfferSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
      enum: ['kg', 'pieces', 'items', 'bags'],
      default: 'kg'
    }
  },
  description: {
    type: String,
    trim: true
  },
  images: [{
    type: String
  }],
  expectedPrice: {
    type: Number,
    default: 0
  },
  location: {
    address: String,
    city: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  status: {
    type: String,
    enum: ['available', 'pending', 'sold', 'cancelled'],
    default: 'available'
  },
  availableFrom: {
    type: Date,
    default: Date.now
  },
  availableUntil: {
    type: Date
  },
  pickupPreference: {
    type: String,
    enum: ['anytime', 'morning', 'afternoon', 'evening', 'weekend'],
    default: 'anytime'
  }
}, {
  timestamps: true
});

// Indexes
userWasteOfferSchema.index({ user: 1, status: 1 });
userWasteOfferSchema.index({ wasteType: 1, status: 1 });
userWasteOfferSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('UserWasteOffer', userWasteOfferSchema);
