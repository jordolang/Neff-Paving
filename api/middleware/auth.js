const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and attaches user data to the request object
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Verify JWT_SECRET is configured
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // Verify token
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          error: 'Invalid token',
          message: 'Token verification failed'
        });
      }

      // Attach user data to request
      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Authentication error',
      message: error.message
    });
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user data if token is present, but doesn't require authentication
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      req.user = null;
      return next();
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
      req.user = err ? null : decoded;
      next();
    });
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
