const express = require('express');
const { authenticateToken, requireLearner } = require('../middleware/auth');
const { checkIdempotency } = require('../middleware/idempotency');
const db = require('../config/database');

const router = express.Router();

// Enroll in a course
router.post('/',
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

    // Check if course exists and is published
    db.get(
      'SELECT * FROM courses WHERE id = ? AND status = "published"',
      [course_id],
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
              message: "Course not found or not published"
            }
          });
        }

        // Check if already enrolled
        db.get(
          'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
          [req.user.id, course_id],
          (err, enrollment) => {
            if (err) {
              return res.status(500).json({
                error: {
                  code: "DATABASE_ERROR",
                  message: "Database error occurred"
                }
              });
            }

            if (enrollment) {
              return res.status(409).json({
                error: {
                  code: "ALREADY_ENROLLED",
                  message: "You are already enrolled in this course"
                }
              });
            }

            // Create enrollment
            db.run(
              'INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)',
              [req.user.id, course_id],
              function(err) {
                if (err) {
                  return res.status(500).json({
                    error: {
                      code: "DATABASE_ERROR",
                      message: "Failed to enroll in course"
                    }
                  });
                }

                res.status(201).json({
                  message: "Successfully enrolled in course",
                  enrollment: {
                    id: this.lastID,
                    user_id: req.user.id,
                    course_id,
                    enrolled_at: new Date().toISOString()
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

// Get user's enrollments
router.get('/my-enrollments',
  authenticateToken,
  requireLearner,
  (req, res) => {
    const { limit = 10, offset = 0 } = req.query;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    db.all(
      `SELECT e.*, c.title, c.description, c.thumbnail_url, c.creator_id, u.name as creator_name,
       COUNT(l.id) as total_lessons,
       (SELECT COUNT(*) FROM progress p 
        JOIN lessons l2 ON p.lesson_id = l2.id 
        WHERE l2.course_id = c.id AND p.user_id = e.user_id) as completed_lessons
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON c.creator_id = u.id
       LEFT JOIN lessons l ON c.id = l.course_id
       WHERE e.user_id = ?
       GROUP BY e.id
       ORDER BY e.enrolled_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limitNum, offsetNum],
      (err, enrollments) => {
        if (err) {
          return res.status(500).json({
            error: {
              code: "DATABASE_ERROR",
              message: "Database error occurred"
            }
          });
        }

        // Calculate progress percentage
        const enrollmentsWithProgress = enrollments.map(enrollment => ({
          ...enrollment,
          progress_percentage: enrollment.total_lessons > 0 
            ? Math.round((enrollment.completed_lessons / enrollment.total_lessons) * 100)
            : 0
        }));

        res.json({
          items: enrollmentsWithProgress,
          next_offset: offsetNum + limitNum
        });
      }
    );
  }
);

// Check if user is enrolled in a course
router.get('/check/:courseId',
  authenticateToken,
  requireLearner,
  (req, res) => {
    const courseId = req.params.courseId;

    db.get(
      'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
      [req.user.id, courseId],
      (err, enrollment) => {
        if (err) {
          return res.status(500).json({
            error: {
              code: "DATABASE_ERROR",
              message: "Database error occurred"
            }
          });
        }

        res.json({
          enrolled: !!enrollment,
          enrollment: enrollment || null
        });
      }
    );
  }
);

// Unenroll from a course
router.delete('/:courseId',
  authenticateToken,
  requireLearner,
  (req, res) => {
    const courseId = req.params.courseId;

    db.run(
      'DELETE FROM enrollments WHERE user_id = ? AND course_id = ?',
      [req.user.id, courseId],
      function(err) {
        if (err) {
          return res.status(500).json({
            error: {
              code: "DATABASE_ERROR",
              message: "Database error occurred"
            }
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            error: {
              code: "ENROLLMENT_NOT_FOUND",
              message: "Enrollment not found"
            }
          });
        }

        res.json({
          message: "Successfully unenrolled from course"
        });
      }
    );
  }
);

module.exports = router;
