const express = require('express');
const router = express.Router();
const AppConfig = require('../models/AppConfig');

const DEFAULT_CONFIG = {
  waste_categories: [
    { label: 'E-waste',   value: 'E-waste',   icon: '📱', color: '#FF6B6B' },
    { label: 'Plastic',   value: 'Plastic',   icon: '♻️', color: '#4ECDC4' },
    { label: 'Polythene', value: 'Polythene', icon: '🛍️', color: '#45B7D1' },
    { label: 'Glass',     value: 'Glass',     icon: '🍾', color: '#96CEB4' },
    { label: 'Paper',     value: 'Paper',     icon: '📄', color: '#FFEAA7' },
    { label: 'Metal',     value: 'Metal',     icon: '🔩', color: '#DFE6E9' },
    { label: 'Organic',   value: 'Organic',   icon: '🌱', color: '#00B894' },
  ],
  points_per_kg:      { 'E-waste': 50, Plastic: 10, Polythene: 10, Glass: 5, Paper: 5, Metal: 20, Organic: 3 },
  cash_per_kg:        { 'E-waste': 25, Plastic: 5,  Polythene: 5,  Glass: 2, Paper: 2, Metal: 10, Organic: 1 },
  max_offer_images:   6,
  max_video_duration: 60,
};

// GET /api/config — public, no auth required
router.get('/', async (req, res) => {
  try {
    const docs = await AppConfig.find();
    const config = { ...DEFAULT_CONFIG };
    docs.forEach(doc => { config[doc.key] = doc.value; });
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
