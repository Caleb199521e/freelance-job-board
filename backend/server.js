import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

// Import database and routes
import database from './config/database.js';
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import proposalRoutes from './routes/proposals.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
// Configure CORS to accept local development origins and honor CLIENT_URL.
// Browsers may use different loopback addresses and ports (e.g. http://localhost:3000,
// http://127.0.0.1:5501, http://[::1]:3000). Allow any localhost/127.0.0.1/::1
// origin with any port during development. In production set CLIENT_URL to
// the exact frontend origin.
const clientUrl = process.env.CLIENT_URL;
const localOriginRegex = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, Postman) which have no origin
    if (!origin) return callback(null, true);

    // If a specific CLIENT_URL is configured, allow it
    if (clientUrl && origin === clientUrl) return callback(null, true);

    // Allow any localhost/127.0.0.1/::1 origin regardless of port (development convenience)
    if (localOriginRegex.test(origin)) return callback(null, true);

    // Otherwise reject - browser will block the request
    return callback(new Error('CORS policy: Origin not allowed'), false);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint with database status
// MUST be defined BEFORE the catch-all proposal routes
app.get('/api/health', async (req, res) => {
  const dbStatus = database.getStatus();
  const dbPing = await database.ping();
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: dbStatus.isConnected,
      readyState: dbStatus.readyState,
      ping: dbPing.success,
      dbName: dbStatus.dbName,
      host: dbStatus.host
    },
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// Database info endpoint (protected in production)
app.get('/api/database/info', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Access denied in production' });
  }

  const stats = await database.getStats();
  const status = database.getStatus();
  
  res.json({
    status,
    stats
  });
});

// Routes - order matters! More specific routes first
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
// Proposals router is mounted at /api to handle both:
// - /api/proposals/* (general proposal routes)
// - /api/jobs/:id/proposals (job-specific proposal submission)
// This router must be last among /api routes to avoid catching specific routes above
app.use('/api', proposalRoutes);

// Database info endpoint (protected in production)
app.get('/api/database/info', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Access denied in production' });
  }
  
  try {
    const stats = await database.getStats();
    const status = database.getStatus();
    
    res.json({
      status,
      stats,
      models: mongoose.modelNames()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting database info', error: error.message });
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      '/api/auth/signup',
      '/api/auth/login',
      '/api/jobs',
      '/api/jobs/:id',
      '/api/proposals/my-proposals'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Unhandled error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors 
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ 
      message: `${field} already exists` 
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    message,
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const clientUrl = process.env.CLIENT_URL;
      const localOriginRegex = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;
      
      if (clientUrl && origin === clientUrl) return callback(null, true);
      if (localOriginRegex.test(origin)) return callback(null, true);
      return callback(new Error('CORS policy: Origin not allowed'), false);
    },
    credentials: true
  }
});

// Make io globally available for notifications
global.io = io;

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.userId}`);
  
  // Join user to their own room for targeted notifications
  socket.join(socket.userId);
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.userId}`);
  });
  
  // Handle manual notification mark as read
  socket.on('mark_notification_read', async (notificationId) => {
    // This will be handled by the API endpoint
    socket.emit('notification_marked', { id: notificationId });
  });
});

// Start server function
async function startServer() {
  try {
    // First connect to database
    console.log('🚀 Starting Freelance Job Board Server...');
    console.log('📁 Environment:', process.env.NODE_ENV || 'development');
    
    await database.connect();
    
    // Then start HTTP server (with Socket.IO attached)
    httpServer.listen(PORT, () => {
      console.log(`🎉 Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔗 MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017/freelance-job-board'}`);
      console.log(`⚡ WebSocket server ready`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📚 Available API Routes:');
        console.log('   POST   /api/auth/signup');
        console.log('   POST   /api/auth/login');
        console.log('   GET    /api/jobs');
        console.log('   POST   /api/jobs (client only)');
        console.log('   POST   /api/jobs/:id/proposals (freelancer only)');
        console.log('   GET    /api/proposals/my-proposals');
        console.log('   GET    /api/notifications');
        console.log('   PUT    /api/notifications/mark-all-read');
        console.log('   GET    /api/health');
      }
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      io.close(() => {
        httpServer.close(() => {
          database.gracefulExit();
        });
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      io.close(() => {
        httpServer.close(() => {
          database.gracefulExit();
        });
      });
    });

    return httpServer;
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
// __filename and __dirname are already defined at the top of the file
if (process.argv[1] && __filename === process.argv[1]) {
  startServer();
}

export { app, startServer };