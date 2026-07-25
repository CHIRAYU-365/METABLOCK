require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');


const sanitizeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const sanitize = (obj) => {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj);
  }
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        obj[key] = sanitize(obj[key]);
      }
    }
  }
  return obj;
};

const xss = () => (req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
};

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const documentsRoutes = require('./routes/documents.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const logger = require('./utils/logger');

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().replace(/^["']|["']$/g, '')) 
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    
    const isAllowed = allowedOrigins.indexOf(origin) !== -1 || 
                      origin.endsWith('.vercel.app') ||
                      origin.includes('localhost');

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));


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


app.use(express.json({ limit: '10kb' })); 


app.use(xss());
app.use(hpp());


const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 500, 
  message: 'Too many authentication attempts from this IP, please try again later.'
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 1000, 
  message: 'Too many requests from this IP, please try again later.'
});


const morganFormat = process.env.NODE_ENV !== 'production' ? 'dev' : 'combined';
app.use(morgan(morganFormat, { stream: { write: message => logger.info(message.trim()) } }));

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});


app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/superadmin', apiLimiter, adminRoutes);
app.use('/api/documents', apiLimiter, documentsRoutes);


app.use(errorMiddleware);

module.exports = app;
