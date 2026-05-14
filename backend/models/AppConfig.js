const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    unique: true,
    required: [true, 'Config key is required'],
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Config value is required']
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    default: 'general',
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AppConfig', appConfigSchema);
