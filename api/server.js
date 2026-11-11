const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const pool = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust the first proxy hop so rate limiting keys on the real client IP
// when running behind a reverse proxy / load balancer.
app.set('trust proxy', 1);

// Global rate limiter: cap requests per IP across all endpoints to mitigate
// abuse and brute-force/DoS attempts.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', message: 'Please try again later.' }
});

// Stricter limiter for authentication endpoints to slow credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', message: 'Too many authentication attempts, please try again later.' }
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);

    // In development, allow localhost origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];

    // In production, use environment variable
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Company'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
// Keep the raw body so webhook signatures (Stripe) can be verified.
app.use(express.json({ limit: '2mb', verify: (req, res, buf) => { req.rawBody = buf.toString('utf8'); } }));
app.use(express.urlencoded({ extended: true }));

// Apply the global rate limiter to every request except the mobile API, which has its own
// (higher) budget because clocked-in devices upload location batches every minute.
const mobileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.MOBILE_RATE_LIMIT || 1500),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'rate_limited', message: 'Too many requests, please try again later.' } }
});
app.use((req, res, next) => (req.path.startsWith('/api/v1') ? mobileLimiter : globalLimiter)(req, res, next));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      message: 'Database connection successful',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const mobileApi = require('./v1');
const { UPLOAD_DIR, uploadHeaders } = require('./v1/services');

// API routes (auth endpoints get the stricter limiter on top of the global one)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/customer', customerRoutes);

// Mobile platform (iOS + Android apps) — see mobile/API_CONTRACT.md
app.use('/api/v1', mobileApi.router);
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', fallthrough: false, setHeaders: uploadHeaders }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server (only when run directly, so tests can import the app)
if (require.main === module) {
  mobileApi.init()
    .then(() => {
      const server = app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
      });
      registerShutdown(server);
    })
    .catch((err) => {
      console.error('Failed to initialise mobile API:', err);
      process.exit(1);
    });
}

function registerShutdown(server) {
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      pool.end(() => {
        console.log('Database pool closed');
        process.exit(0);
      });
    });
  });
}

module.exports = app;
