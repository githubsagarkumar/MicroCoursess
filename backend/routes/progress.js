const express = require('express');
const { authenticateToken, requireLearner } = require('../middleware/auth');
const { checkIdempotency } = require('../middleware/idempotency');
const db = require('../config/database');

const router = express.Router();

// Mark lesson as completed
router.post('/complete',
  authenticateToken,
  requireLearner,
  checkIdempotency,
  (req, res) => {
    const { lesson_id } = req.body;

    if (!lesson_id) {
      return res.status(400).json({
        error: {
          code: "FIELD_REQUIRED",
          field: "lesson_id",
          message: "Lesson ID is required"
        }
      });
    }

    // Check if lesson exists and user is enrolled in the course
    db.get(
      `SELECT l.*, c.id as course_id FROM lessons l 
       JOIN courses c ON l.course_id = c.id
       JOIN enrollments e ON c.id = e.course_id
       WHERE l.id = ? AND e.user_id = ?`,
      [lesson_id, req.user.id],
      (err, lesson) => {
        if (err) {
          return res.status(500).json({
            error: {
              code: "DATABASE_ERROR",
              message: "Database error occurred"
            }
          });
        }

        if (!lesson) {
          return res.status(404).json({
            error: {
              code: "LESSON_NOT_FOUND",
              message: "Lesson not found or you are not enrolled in this course"
            }
          });
        }

        // Check if already completed
        db.get(
          'SELECT id FROM progress WHERE user_id = ? AND lesson_id = ?',
          [req.user.id, lesson_id],
          (err, existingProgress) => {
            if (err) {
              return res.status(500).json({
                error: {
                  code: "DATABASE_ERROR",
                  message: "Database error occurred"
                }
              });
            }

            if (existingProgress) {
              return res.status(409).json({
                error: {
                  code: "ALREADY_COMPLETED",
                  message: "Lesson already marked as completed"
                }
              });
            }

            // Mark as completed
            db.run(
              'INSERT INTO progress (user_id, lesson_id) VALUES (?, ?)',
              [req.user.id, lesson_id],
              function(err) {
                if (err) {
                  return res.status(500).json({
                    error: {
                      code: "DATABASE_ERROR",
                      message: "Failed to mark lesson as completed"
                    }
                  });
                }

                res.status(201).json({
                  message: "Lesson marked as completed",
                  progress: {
                    id: this.lastID,
                    user_id: req.user.id,
                    lesson_id,
                    completed_at: new Date().toISOString()
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

// Get user's progress for a course
router.get('/course/:courseId',
  authenticateToken,
  requireLearner,
  (req, res) => {
    const courseId = req.params.courseId;

    // Check if user is enrolled in the course
    db.get(
      'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
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

        if (!enrollment) {
          return res.status(404).json({
            error: {
              code: "NOT_ENROLLED",
              message: "You are not enrolled in this course"
            }
          });
        }

        // Get course lessons and progress
        db.all(
          `SELECT l.*, 
           CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END as completed,
           p.completed_at
           FROM lessons l
           LEFT JOIN progress p ON l.id = p.lesson_id AND p.user_id = ?
           WHERE l.course_id = ?
           ORDER BY l.order_index ASC`,
          [req.user.id, courseId],
          (err, lessons) => {
            if (err) {
              return res.status(500).json({
                error: {
                  code: "DATABASE_ERROR",
                  message: "Database error occurred"
                }
              });
            }

            const totalLessons = lessons.length;
            const completedLessons = lessons.filter(lesson => lesson.completed).length;
            const progressPercentage = totalLessons > 0 
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0;

            res.json({
              course_id: courseId,
              total_lessons: totalLessons,
              completed_lessons: completedLessons,
              progress_percentage: progressPercentage,
              lessons: lessons.map(lesson => ({
                id: lesson.id,
                title: lesson.title,
                order_index: lesson.order_index,
                completed: !!lesson.completed,
                completed_at: lesson.completed_at
              }))
            });
          }
        );
      }
    );
  }
);

// Get user's overall progress
router.get('/overview',
  authenticateToken,
  requireLearner,
  (req, res) => {
    const { limit = 10, offset = 0 } = req.query;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    db.all(
      `SELECT c.id, c.title, c.thumbnail_url,
       COUNT(l.id) as total_lessons,
       COUNT(p.id) as completed_lessons,
       ROUND((COUNT(p.id) * 100.0 / COUNT(l.id)), 2) as progress_percentage
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN lessons l ON c.id = l.course_id
       LEFT JOIN progress p ON l.id = p.lesson_id AND p.user_id = e.user_id
       WHERE e.user_id = ?
       GROUP BY c.id, c.title, c.thumbnail_url
       ORDER BY progress_percentage DESC, c.title ASC
       LIMIT ? OFFSET ?`,
      [req.user.id, limitNum, offsetNum],
      (err, progress) => {
        if (err) {
          return res.status(500).json({
            error: {
              code: "DATABASE_ERROR",
              message: "Database error occurred"
            }
          });
        }

        res.json({
          items: progress,
          next_offset: offsetNum + limitNum
        });
      }
    );
  }
);

module.exports = router;
