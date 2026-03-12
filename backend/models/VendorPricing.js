const mongoose = require('mongoose');

const vendorPricingSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      unique: true
    },
    pricing: [
      {
        wasteType: {
          type: String,
          enum: ['E-waste', 'Plastic', 'Polythene', 'Glass', 'Paper', 'Metal', 'Organic'],
          required: true
        },
        pricePerKg: {
          type: Number,
          required: true,
          min: 0
        },
        minQuantity: {
          type: Number,
          default: 0
        },
        maxQuantity: {
          type: Number
        },
        isActive: {
          type: Boolean,
          default: true
        }
      }
    ],
    currency: {
      type: String,
      default: 'USD'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Update lastUpdated on save
vendorPricingSchema.pre('save', function (next) {
  this.lastUpdated = Date.now();
  next();
});

module.exports = mongoose.model('VendorPricing', vendorPricingSchema);
