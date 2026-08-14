require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

// Security headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// Allowed origins (defined before Socket.IO so we can reuse)
const ALLOWED_ORIGINS = [
  'https://eco-dash-rekj.vercel.app',   // deployed admin portal
  'http://localhost:3000',               // local backend / legacy
  'http://localhost:3001',               // local admin portal dev (Next.js)
  'http://localhost:8081',               // Expo mobile dev
];

// Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});
require('./socket/chatHandler')(io);

// Connect to MongoDB
connectDB();

// Keep MongoDB cluster alive (Free Tier workaround)
setInterval(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
    }
  } catch (error) {
    console.error('❌ DB ping failed:', error.message);
  }
}, 30000);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (React Native, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Static folder for uploads
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'EcoDash API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      collectors: '/api/collectors',
      vendors: '/api/vendors',
      admin: '/api/admin',
      chat: '/api/chat',
    },
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/collectors', require('./routes/collectors'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/config', require('./routes/config'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: isProd ? 'Server Error' : (err.message || 'Server Error'),
  });
});

const PORT = process.env.PORT || 3000;

// Only start server if not in serverless environment (Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 Socket.IO ready`);
  });
}

// Export for Vercel serverless (HTTP only — Socket.IO won't work on Vercel)
module.exports = app;
