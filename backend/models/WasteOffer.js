const mongoose = require('mongoose');

const wasteOfferSchema = new mongoose.Schema(
  {
    collector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collector',
      required: true
    },
    wasteType: {
      type: String,
      enum: ['E-waste', 'Plastic', 'Polythene', 'Glass', 'Paper', 'Metal', 'Organic'],
      required: true
    },
    quantity: {
      value: {
        type: Number,
        required: true,
        min: 0
      },
      unit: {
        type: String,
        default: 'kg'
      }
    },
    minPricePerKg: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'sold', 'cancelled'],
      default: 'available'
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number]
      }
    },
    images: [{
      type: String
    }]
  },
  {
    timestamps: true
  }
);

// Index for location-based queries
wasteOfferSchema.index({ location: '2dsphere' });
wasteOfferSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('WasteOffer', wasteOfferSchema);
