const jwt = require('jsonwebtoken');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Collector = require('../models/Collector');
const Vendor = require('../models/Vendor');

async function resolveUser(id, role) {
  switch (role) {
    case 'user':      return User.findById(id).select('name');
    case 'collector': return Collector.findById(id).select('name');
    case 'vendor':    return Vendor.findById(id).select('name');
    default:          return null;
  }
}

module.exports = (io) => {
  // Authenticate every socket connection via JWT in handshake
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('AUTH_REQUIRED'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      const dbUser = await resolveUser(decoded.id, decoded.role);
      if (!dbUser) return next(new Error('USER_NOT_FOUND'));

      socket.userId = String(decoded.id);
      socket.userRole = decoded.role;
      socket.userName = dbUser.name;
      next();
    } catch {
      next(new Error('INVALID_TOKEN'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.userName} (${socket.userRole})`);

    // Join a chat room
    socket.on('join_room', ({ roomId }) => {
      if (!roomId) return;
      socket.join(roomId);
      console.log(`💬 ${socket.userName} joined room ${roomId}`);
    });

    // Leave a chat room
    socket.on('leave_room', ({ roomId }) => {
      if (!roomId) return;
      socket.leave(roomId);
    });

    // Send a message
    socket.on('send_message', async ({ roomId, text }) => {
      if (!roomId || !text?.trim()) return;

      try {
        const msg = await ChatMessage.create({
          roomId,
          senderId: socket.userId,
          senderName: socket.userName,
          senderRole: socket.userRole,
          text: text.trim(),
        });

        io.to(roomId).emit('new_message', {
          _id: msg._id,
          roomId: msg.roomId,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderRole: msg.senderRole,
          text: msg.text,
          createdAt: msg.createdAt,
        });
      } catch (err) {
        console.error('❌ Chat message save failed:', err.message);
        socket.emit('message_error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.userName}`);
    });
  });
};
