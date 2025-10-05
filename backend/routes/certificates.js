const express = require('express');
const crypto = require('crypto');
const { authenticateToken, requireLearner } = require('../middleware/auth');
const { checkIdempotency } = require('../middleware/idempotency');
const db = require('../config/database');

const router = express.Router();

// Generate certificate for completed course
router.post('/generate',
  authenticateToken,
  requireLearner,
  checkIdempotency,
  (req, res) => {
    const { course_id } = req.body;

    if (!course_id) {
      return res.status(400).json({
        error: {
          code: "FIELD_REQUIRED",
          field: "course_id",
          message: "Course ID is required"
        }
      });
    }

    // Check if user is enrolled and has completed all lessons
    db.get(
      `SELECT c.*, 
       COUNT(l.id) as total_lessons,
       COUNT(p.id) as completed_lessons
       FROM courses c
       JOIN enrollments e ON c.id = e.course_id
       LEFT JOIN lessons l ON c.id = l.course_id
       LEFT JOIN progress p ON l.id = p.lesson_id AND p.user_id = e.user_id
       WHERE c.id = ? AND e.user_id = ?
       GROUP BY c.id`,
      [course_id, req.user.id],
      (err, course) => {
        if (err) {
          return res.status(500).json({
            error: {
              code: "DATABASE_ERROR",
              message: "Database error occurred"
            }
          });
        }

        if (!course) {
          return res.status(404).json({
            error: {
              code: "COURSE_NOT_FOUND",
              message: "Course not found or you are not enrolled"
            }
          });
        }

        if (course.total_lessons === 0) {
          return res.status(400).json({
            error: {
              code: "NO_LESSONS",
              message: "Course has no lessons"
            }
          });
        }

        if (course.completed_lessons < course.total_lessons) {
          return res.status(400).json({
            error: {
              code: "INCOMPLETE_COURSE",
              message: "You must complete all lessons to receive a certificate"
            }
          });
        }

        // Check if certificate already exists
        db.get(
          'SELECT * FROM certificates WHERE user_id = ? AND course_id = ?',
          [req.user.id, course_id],
          (err, existingCert) => {
            if (err) {
              return res.status(500).json({
                error: {
                  code: "DATABASE_ERROR",
                  message: "Database error occurred"
                }
              });
            }

            if (existingCert) {
              return res.status(409).json({
                error: {
                  code: "CERTIFICATE_EXISTS",
                  message: "Certificate already exists for this course"
                }
              });
            }

            // Generate unique serial hash
            const serialHash = crypto
              .createHash('sha256')
              .update(`${req.user.id}-${course_id}-${Date.now()}`)
              .digest('hex')
              .substring(0, 16)
              .toUpperCase();

            // Create certificate
            db.run(
              'INSERT INTO certificates (user_id, course_id, serial_hash) VALUES (?, ?, ?)',
              [req.user.id, course_id, serialHash],
              function(err) {
                if (err) {
                  return res.status(500).json({
                    error: {
                      code: "DATABASE_ERROR",
                      message: "Failed to generate certificate"
                    }
                  });
                }

                res.status(201).json({
                  message: "Certificate generated successfully",
                  certificate: {
                    id: this.lastID,
                    user_id: req.user.id,
                    course_id,
                    serial_hash: serialHash,
                    issued_at: new Date().toISOString()
                  }
                });
              }
            );
          }
        );
      }
    );
  }
);

// Get user's certificates
router.get('/my-certificates',
  authenticateToken,
  requireLearner,
  (req, res) => {
    const { limit = 10, offset = 0 } = req.query;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    db.all(
      `SELECT c.*, co.title as course_title, co.description as course_description
       FROM certificates c
       JOIN courses co ON c.course_id = co.id
       WHERE c.user_id = ?
       ORDER BY c.issued_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limitNum, offsetNum],
      (err, certificates) => {
        if (err) {
          return res.status(500).json({
            error: {
              code: "DATABASE_ERROR",
              message: "Database error occurred"
            }
          });
        }

        res.json({
          items: certificates,
          next_offset: offsetNum + limitNum
        });
      }
    );
  }
);

// Get certificate by serial hash
router.get('/verify/:serialHash', (req, res) => {
  const serialHash = req.params.serialHash;

  db.get(
    `SELECT c.*, u.name as user_name, u.email as user_email,
     co.title as course_title, co.description as course_description
     FROM certificates c
     JOIN users u ON c.user_id = u.id
     JOIN courses co ON c.course_id = co.id
     WHERE c.serial_hash = ?`,
    [serialHash],
    (err, certificate) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: "DATABASE_ERROR",
            message: "Database error occurred"
          }
        });
      }

      if (!certificate) {
        return res.status(404).json({
          error: {
            code: "CERTIFICATE_NOT_FOUND",
            message: "Certificate not found"
          }
        });
      }

      res.json({
        certificate: {
          id: certificate.id,
          serial_hash: certificate.serial_hash,
          user_name: certificate.user_name,
          user_email: certificate.user_email,
          course_title: certificate.course_title,
          course_description: certificate.course_description,
          issued_at: certificate.issued_at
        }
      });
    }
  );
});

// Get certificate details (for enrolled users)
router.get('/:certificateId',
  authenticateToken,
  requireLearner,
  (req, res) => {
    const certificateId = req.params.certificateId;

    db.get(
      `SELECT c.*, co.title as course_title, co.description as course_description
       FROM certificates c
       JOIN courses co ON c.course_id = co.id
       WHERE c.id = ? AND c.user_id = ?`,
      [certificateId, req.user.id],
      (err, certificate) => {
        if (err) {
          return res.status(500).json({
            error: {
              code: "DATABASE_ERROR",
              message: "Database error occurred"
            }
          });
        }

        if (!certificate) {
          return res.status(404).json({
            error: {
              code: "CERTIFICATE_NOT_FOUND",
              message: "Certificate not found"
            }
          });
        }

        res.json({ certificate });
      }
    );
  }
);

module.exports = router;
