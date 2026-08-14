const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');
const CollectorPurchaseRequest = require('../models/CollectorPurchaseRequest');
const WastePurchase = require('../models/WastePurchase');

// GET /api/chat/history/:roomId  — fetch last 100 messages for a room
// Room format: req_<requestId> (user/collector) | pur_<purchaseId> (collector/vendor)
router.get('/history/:roomId', protect, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = String(req.user._id);
    const role = req.userRole;

    // Verify the requesting user is a participant of this room
    let authorized = false;

    if (roomId.startsWith('req_')) {
      // CollectorPurchaseRequest — participants: user + collector
      const request = await CollectorPurchaseRequest.findById(roomId.slice(4)).lean().catch(() => null);
      if (request) {
        authorized = [String(request.user || ''), String(request.collector || '')].includes(userId);
      }
    } else if (roomId.startsWith('pur_')) {
      // WastePurchase — participants: vendor + collector
      const purchase = await WastePurchase.findById(roomId.slice(4)).lean().catch(() => null);
      if (purchase) {
        authorized = [String(purchase.vendor || ''), String(purchase.collector || '')].includes(userId);
      }
    } else if (role === 'admin' || role === 'superadmin') {
      authorized = true;
    }

    if (!authorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this chat' });
    }

    const messages = await ChatMessage.find({ roomId })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load chat history' });
  }
});

module.exports = router;
