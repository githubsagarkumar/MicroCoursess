const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkIdempotency } = require('../middleware/idempotency');

const router = express.Router();

// Register endpoint
router.post('/register', 
  checkIdempotency,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().isLength({ min: 2 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: errors.array()
          }
        });
      }

      const { email, password, name } = req.body;

      // Check if user already exists
      db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          return res.status(500).json({
            error: {
              code: "DATABASE_ERROR",
              message: "Database error occurred"
            }
          });
        }

        if (user) {
          return res.status(409).json({
            error: {
              code: "USER_EXISTS",
              message: "User with this email already exists"
            }
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Determine role based on email domain
        let userRole = 'learner';
        if (email.endsWith('@admin.microcourses.com')) {
          userRole = 'admin';
        } else if (email.endsWith('@creator.microcourses.com')) {
          userRole = 'creator';
        }

        // Create user
        db.run(
          'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
          [email, hashedPassword, name, userRole],
          function(err) {
            if (err) {
              return res.status(500).json({
                error: {
                  code: "DATABASE_ERROR",
                  message: "Failed to create user"
                }
              });
            }

        const jwtSecret = process.env.JWT_SECRET || 'dev-insecure-jwt-secret-change-me';
        const token = jwt.sign(
          { id: this.lastID, email, role: userRole },
          jwtSecret,
          { expiresIn: '24h' }
        );

            res.status(201).json({
              message: "User created successfully",
              token,
              user: {
                id: this.lastID,
                email,
                name,
                role: userRole
              }
            });
          }
        );
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Registration failed"
        }
      });
    }
  }
);

// Login endpoint
router.post('/login',
  checkIdempotency,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: errors.array()
          }
        });
      }

      const { email, password } = req.body;

      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          return res.status(500).json({
            error: {
              code: "DATABASE_ERROR",
              message: "Database error occurred"
            }
          });
        }

        if (!user) {
          return res.status(401).json({
            error: {
              code: "INVALID_CREDENTIALS",
              message: "Invalid email or password"
            }
          });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({
            error: {
              code: "INVALID_CREDENTIALS",
              message: "Invalid email or password"
            }
          });
        }

        const jwtSecretLogin = process.env.JWT_SECRET || 'dev-insecure-jwt-secret-change-me';
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          jwtSecretLogin,
          { expiresIn: '24h' }
        );

        res.json({
          message: "Login successful",
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            creator_status: user.creator_status
          }
        });
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Login failed"
        }
      });
    }
  }
);

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  db.get('SELECT id, email, name, role, creator_status FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({
        error: {
          code: "DATABASE_ERROR",
          message: "Database error occurred"
        }
      });
    }

    if (!user) {
      return res.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      });
    }

    res.json({ user });
  });
});

module.exports = router;
