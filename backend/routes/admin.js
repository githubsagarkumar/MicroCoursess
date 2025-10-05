const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { checkIdempotency } = require('../middleware/idempotency');
const db = require('../config/database');

const router = express.Router();

// Get all creator applications
router.get('/applications',
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const { limit = 10, offset = 0, status = 'all' } = req.query;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    let statusFilter = '';
    let params = [limitNum, offsetNum];

    if (status !== 'all') {
      statusFilter = 'WHERE ca.status = ?';
      params = [status, limitNum, offsetNum];
    }

    db.all(
      `SELECT ca.*, u.name as user_name, u.email as user_email
       FROM creator_applications ca
       JOIN users u ON ca.user_id = u.id
       ${statusFilter}
       ORDER BY ca.created_at DESC
       LIMIT ? OFFSET ?`,
      params,
      (err, applications) => {
        if (err) {
          return res.status(500).json({
            error: {
              code: "DATABASE_ERROR",
              message: "Database error occurred"
            }
          });
        }

        res.json({
          items: applications,
          next_offset: offsetNum + limitNum
        });
      }
    );
  }
);

// Review creator application
router.put('/applications/:applicationId/review',
  authenticateToken,
  requireAdmin,
  checkIdempotency,
  (req, res) => {
    const applicationId = req.params.applicationId;
    const { status, feedback } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATUS",
          message: "Status must be 'approved' or 'rejected'"
        }
      });
    }

    // Get application details
    db.get(
      'SELECT * FROM creator_applications WHERE id = ?',
      [applicationId],
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
          return res.status(404).json({
            error: {
              code: "APPLICATION_NOT_FOUND",
              message: "Application not found"
            }
          });
        }

        if (application.status !== 'pending') {
          return res.status(409).json({
            error: {
              code: "ALREADY_REVIEWED",
              message: "Application has already been reviewed"
            }
          });
        }

        // Update application status
        db.run(
          'UPDATE creator_applications SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
          [status, req.user.id, applicationId],
          function(err) {
            if (err) {
              return res.status(500).json({
                error: {
                  code: "DATABASE_ERROR",
                  message: "Failed to update application"
                }
              });
            }

            // If approved, update user role
            if (status === 'approved') {
              db.run(
                'UPDATE users SET role = "creator", creator_status = "approved" WHERE id = ?',
                [application.user_id],
                (err) => {
                  if (err) {
                    console.error('Failed to update user role:', err);
                  }
                }
              );
            } else {
              db.run(
                'UPDATE users SET creator_status = "rejected" WHERE id = ?',
                [application.user_id],
                (err) => {
                  if (err) {
                    console.error('Failed to update user status:', err);
                  }
                }
              );
            }

            res.json({
              message: `Application ${status} successfully`,
              application: {
                id: applicationId,
                status,
                reviewed_by: req.user.id,
                reviewed_at: new Date().toISOString()
              }
            });
          }
        );
      }
    );
  }
);

// Get all courses for review
router.get('/courses',
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const { limit = 10, offset = 0, status = 'all' } = req.query;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    let statusFilter = '';
    let params = [limitNum, offsetNum];

    if (status !== 'all') {
      statusFilter = 'WHERE c.status = ?';
      params = [status, limitNum, offsetNum];
    }

    db.all(
      `SELECT c.*, u.name as creator_name, u.email as creator_email,
       COUNT(l.id) as lesson_count
       FROM courses c
       JOIN users u ON c.creator_id = u.id
       LEFT JOIN lessons l ON c.id = l.course_id
       ${statusFilter}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      params,
      (err, courses) => {
        if (err) {
          return res.status(500).json({
            error: {
              code: "DATABASE_ERROR",
              message: "Database error occurred"
            }
          });
        }

        res.json({
          items: courses,
          next_offset: offsetNum + limitNum
        });
      }
    );
  }
);

// Review course
router.put('/courses/:courseId/review',
  authenticateToken,
  requireAdmin,
  checkIdempotency,
  (req, res) => {
    const courseId = req.params.courseId;
    const { status, feedback } = req.body;

    if (!status || !['published', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATUS",
          message: "Status must be 'published' or 'rejected'"
        }
      });
    }

    // Get course details
    db.get(
      'SELECT * FROM courses WHERE id = ?',
      [courseId],
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
              message: "Course not found"
            }
          });
        }

        // Update course status
        db.run(
          'UPDATE courses SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [status, courseId],
          function(err) {
            if (err) {
              return res.status(500).json({
                error: {
                  code: "DATABASE_ERROR",
                  message: "Failed to update course status"
                }
              });
            }

            // Log the admin action
            console.log(`Admin ${req.user.email} ${status} course ${courseId}${feedback ? ` with feedback: ${feedback}` : ''}`);

            res.json({
              message: `Course ${status} successfully`,
              course: {
                id: courseId,
                status,
                updated_at: new Date().toISOString(),
                feedback: feedback || null
              }
            });
          }
        );
      }
    );
  }
);

// Get dashboard stats
router.get('/stats',
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const stats = {};

    // Get total users
    db.get('SELECT COUNT(*) as total FROM users', (err, userCount) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: "DATABASE_ERROR",
            message: "Database error occurred"
          }
        });
      }

      stats.total_users = userCount.total;

      // Get total courses
      db.get('SELECT COUNT(*) as total FROM courses', (err, courseCount) => {
        if (err) {
          return res.status(500).json({
            error: {
              code: "DATABASE_ERROR",
              message: "Database error occurred"
            }
          });
        }

        stats.total_courses = courseCount.total;

        // Get total enrollments
        db.get('SELECT COUNT(*) as total FROM enrollments', (err, enrollmentCount) => {
          if (err) {
            return res.status(500).json({
              error: {
                code: "DATABASE_ERROR",
                message: "Database error occurred"
              }
            });
          }

          stats.total_enrollments = enrollmentCount.total;

          // Get pending applications
          db.get('SELECT COUNT(*) as total FROM creator_applications WHERE status = "pending"', (err, pendingCount) => {
            if (err) {
              return res.status(500).json({
                error: {
                  code: "DATABASE_ERROR",
                  message: "Database error occurred"
                }
              });
            }

            stats.pending_applications = pendingCount.total;

            res.json({ stats });
          });
        });
      });
    });
  }
);

module.exports = router;
