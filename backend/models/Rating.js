const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    rater: { type: mongoose.Schema.Types.ObjectId, required: true },
    raterRole: { type: String, enum: ['user', 'collector'], required: true },
    ratee: { type: mongoose.Schema.Types.ObjectId, required: true },
    rateeRole: { type: String, enum: ['collector', 'vendor'], required: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 300 },
    relatedId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

// One rating per rater per transaction
ratingSchema.index({ rater: 1, relatedId: 1 }, { unique: true });

// Every average-rating recompute filters on this pair
ratingSchema.index({ ratee: 1, rateeRole: 1 });

module.exports = mongoose.model('Rating', ratingSchema);
