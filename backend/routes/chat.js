const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');

// GET /api/chat/history/:roomId  — fetch last 100 messages for a room
router.get('/history/:roomId', protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ roomId: req.params.roomId })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
