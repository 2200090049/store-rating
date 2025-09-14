require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const storeRoutes = require('./src/routes/storeRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Store Rating API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/reviews', reviewRoutes);

// API documentation route
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'Store Rating API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      stores: '/api/stores',
      reviews: '/api/reviews'
    },
    documentation: 'https://github.com/2200090049/store-rating#api-endpoints'
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API endpoint not found'
  });
});

// Serve static files for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Error handling middleware (should be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Store Rating Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('🔥 Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('🔥 Uncaught Exception:', err.message);
  console.log('💥 Shutting down...');
  process.exit(1);
});

module.exports = app;
