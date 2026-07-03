require('dotenv').config();
require('express-async-errors'); // Catches unhandled errors in async routes automatically
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const hpp = require('hpp');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const documentsRoutes = require('./routes/documents.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const logger = require('./utils/logger');

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// CIA: Confidentiality - Strict Security Headers (CSP & HSTS)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://gateway.pinata.cloud"],
      connectSrc: ["'self'", "https://unique-analysis-production-17f7.up.railway.app"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// Body parsing
app.use(express.json({ limit: '10kb' })); // CIA: Availability - Prevent large payloads

// CIA: Integrity - Prevent XSS and HTTP Parameter Pollution
app.use(xss());
app.use(hpp());

// CIA: Availability - Strict Rate Limiting on Auth to prevent brute force
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 login/register requests per windowMs
  message: 'Too many authentication attempts from this IP, please try again after 5 minutes.'
});

// Set up morgan to use our winston logger
const morganFormat = process.env.NODE_ENV !== 'production' ? 'dev' : 'combined';
app.use(morgan(morganFormat, { stream: { write: message => logger.info(message.trim()) } }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/superadmin', adminRoutes);
app.use('/api/documents', documentsRoutes);

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
