const mongoose = require('mongoose');

const adminRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a role name'],
    unique: true,
    trim: true,
    maxlength: 50
  },
  // Stable identifier for built-in roles ('executive', 'manager', 'admin'); slug for custom ones
  key: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 300,
    default: ''
  },
  permissions: [{
    type: String
  }],
  // Built-in roles can't be renamed or deleted
  isSystem: {
    type: Boolean,
    default: false
  },
  // Executive always has every permission, including ones added later
  isExecutive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminRole', adminRoleSchema);
