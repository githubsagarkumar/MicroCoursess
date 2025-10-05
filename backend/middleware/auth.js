const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Access token required"
      }
    });
  }

  const jwtSecret = process.env.JWT_SECRET || 'dev-insecure-jwt-secret-change-me';

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired token"
        }
      });
    }
    req.user = user;
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required"
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions"
        }
      });
    }

    next();
  };
};

const requireAdmin = requireRole(['admin']);
const requireCreator = requireRole(['creator', 'admin']);
const requireLearner = requireRole(['learner', 'creator', 'admin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireCreator,
  requireLearner
};
