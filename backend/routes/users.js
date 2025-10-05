const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Apply to become a creator
router.post('/apply-creator', authenticateToken, (req, res) => {
  const { motivation, experience } = req.body;

  if (!motivation || !experience) {
    return res.status(400).json({
      error: {
        code: "FIELD_REQUIRED",
        field: "motivation, experience",
        message: "Motivation and experience are required"
      }
    });
  }

  // Check if user already has a pending application
  db.get(
    'SELECT id FROM creator_applications WHERE user_id = ? AND status = "pending"',
    [req.user.id],
    (err, existingApp) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: "DATABASE_ERROR",
            message: "Database error occurred"
          }
        });
      }

      if (existingApp) {
        return res.status(409).json({
          error: {
            code: "APPLICATION_EXISTS",
            message: "You already have a pending creator application"
          }
        });
      }

      // Create application
      db.run(
        'INSERT INTO creator_applications (user_id, motivation, experience) VALUES (?, ?, ?)',
        [req.user.id, motivation, experience],
        function(err) {
          if (err) {
            return res.status(500).json({
              error: {
                code: "DATABASE_ERROR",
                message: "Failed to submit application"
              }
            });
          }

          res.status(201).json({
            message: "Creator application submitted successfully",
            application_id: this.lastID
          });
        }
      );
    }
  );
});

// Get user's creator application status
router.get('/creator-status', authenticateToken, (req, res) => {
  db.get(
    'SELECT * FROM creator_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
    [req.user.id],
    (err, application) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: "DATABASE_ERROR",
            message: "Database error occurred"
          }
        });
      }

      if (!application) {
        return res.json({
          status: 'not_applied',
          message: 'No creator application found'
        });
      }

      res.json({
        status: application.status,
        application: {
          id: application.id,
          motivation: application.motivation,
          experience: application.experience,
          created_at: application.created_at,
          reviewed_at: application.reviewed_at
        }
      });
    }
  );
});

module.exports = router;
