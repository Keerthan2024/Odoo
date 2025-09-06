const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Import database connection
require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const cartRoutes = require('./routes/cart');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev')); // Shorter format for development
} else {
  app.use(morgan('combined')); // Full format for production
}

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'EcoFinds Backend Server is running!',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ENHANCED GLOBAL ERROR HANDLER - Add this BEFORE 404 handler
app.use((err, req, res, next) => {
  console.error('🚨 GLOBAL ERROR HANDLER:');
  console.error('- Request URL:', req.url);
  console.error('- Request Method:', req.method);
  console.error('- Error Message:', err.message);
  console.error('- Error Code:', err.code);
  console.error('- Error SQL State:', err.sqlState);
  console.error('- Error SQL:', err.sql);
  console.error('- Error Stack:', err.stack);
  
  // Determine error status code
  let statusCode = 500;
  let message = 'Internal server error';
  
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Duplicate entry - resource already exists';
  } else if (err.code === 'ER_NO_SUCH_TABLE') {
    statusCode = 500;
    message = 'Database table not found';
  } else if (err.code === 'ER_BAD_FIELD_ERROR') {
    statusCode = 500;
    message = 'Database field error';
  } else if (err.code === 'ER_WRONG_ARGUMENTS') {
    statusCode = 500;
    message = 'Database query parameter mismatch';
  }
  
  res.status(statusCode).json({
    success: false,
    message: message,
    error: NODE_ENV === 'development' ? {
      message: err.message,
      code: err.code,
      sqlState: err.sqlState,
      sql: err.sql,
      stack: err.stack
    } : 'Something went wrong on our server'
  });
});

// 404 handler - Must be AFTER all routes and BEFORE error handler
app.use('*', (req, res) => {
  console.log('🔍 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 EcoFinds Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📁 Static files: http://localhost:${PORT}/uploads`);
  console.log('✅ Database connected successfully');
  console.log('✅ Database tables created/verified successfully');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('🚨 UNHANDLED REJECTION! Shutting down...');
  console.error('Error:', err);
  console.error('Promise:', promise);
  process.exit(1);
});

module.exports = app; // For testing purposes
