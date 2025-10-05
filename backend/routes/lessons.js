const express = require('express');
const { authenticateToken, requireCreator } = require('../middleware/auth');
const { checkIdempotency } = require('../middleware/idempotency');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Get lessons for a course
router.get('/course/:courseId', (req, res) => {
  const courseId = req.params.courseId;

  db.all(
    'SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC',
    [courseId],
    (err, lessons) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: "DATABASE_ERROR",
            message: "Database error occurred"
          }
        });
      }

      res.json({ lessons });
    }
  );
});

// Get lesson by ID
router.get('/:id', (req, res) => {
  const lessonId = req.params.id;

  db.get(
    'SELECT l.*, c.title as course_title, c.creator_id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE l.id = ?',
    [lessonId],
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
            message: "Lesson not found"
          }
        });
      }

      res.json({ lesson });
    }
  );
});

// Create lesson (creators only)
router.post('/',
  authenticateToken,
  requireCreator,
  checkIdempotency,
  [
    body('course_id').isInt(),
    body('title').trim().isLength({ min: 3 }),
    body('content').trim().isLength({ min: 10 }),
    body('order_index').isInt()
  ],
  (req, res) => {
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

    const { course_id, title, content, video_url, transcript, order_index, duration } = req.body;

    // Check if course belongs to user
    db.get(
      'SELECT * FROM courses WHERE id = ? AND creator_id = ?',
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
              message: "Course not found or access denied"
            }
          });
        }

        // Check if order_index is unique for this course
        db.get(
          'SELECT id FROM lessons WHERE course_id = ? AND order_index = ?',
          [course_id, order_index],
          (err, existingLesson) => {
            if (err) {
              return res.status(500).json({
                error: {
                  code: "DATABASE_ERROR",
                  message: "Database error occurred"
                }
              });
            }

            if (existingLesson) {
              return res.status(409).json({
                error: {
                  code: "ORDER_CONFLICT",
                  message: "A lesson with this order index already exists for this course"
                }
              });
            }

            // Create lesson
            db.run(
              'INSERT INTO lessons (course_id, title, content, video_url, transcript, order_index, duration) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [course_id, title, content, video_url, transcript, order_index, duration || 0],
              function(err) {
                if (err) {
                  return res.status(500).json({
                    error: {
                      code: "DATABASE_ERROR",
                      message: "Failed to create lesson"
                    }
                  });
                }

                res.status(201).json({
                  message: "Lesson created successfully",
                  lesson: {
                    id: this.lastID,
                    course_id,
                    title,
                    content,
                    video_url,
                    transcript,
                    order_index,
                    duration: duration || 0
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

// Update lesson (creators only)
router.put('/:id',
  authenticateToken,
  requireCreator,
  checkIdempotency,
  (req, res) => {
    const lessonId = req.params.id;
    const { title, content, video_url, transcript, order_index, duration } = req.body;

    // Check if lesson exists and belongs to user's course
    db.get(
      `SELECT l.*, c.creator_id FROM lessons l 
       JOIN courses c ON l.course_id = c.id 
       WHERE l.id = ? AND c.creator_id = ?`,
      [lessonId, req.user.id],
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
              message: "Lesson not found or access denied"
            }
          });
        }

        // If order_index is being changed, check for conflicts
        if (order_index && order_index !== lesson.order_index) {
          db.get(
            'SELECT id FROM lessons WHERE course_id = ? AND order_index = ? AND id != ?',
            [lesson.course_id, order_index, lessonId],
            (err, conflictLesson) => {
              if (err) {
                return res.status(500).json({
                  error: {
                    code: "DATABASE_ERROR",
                    message: "Database error occurred"
                  }
                });
              }

              if (conflictLesson) {
                return res.status(409).json({
                  error: {
                    code: "ORDER_CONFLICT",
                    message: "A lesson with this order index already exists for this course"
                  }
                });
              }

              // Update lesson
              updateLesson();
            }
          );
        } else {
          updateLesson();
        }

        function updateLesson() {
          db.run(
            'UPDATE lessons SET title = ?, content = ?, video_url = ?, transcript = ?, order_index = ?, duration = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [title, content, video_url, transcript, order_index, duration, lessonId],
            function(err) {
              if (err) {
                return res.status(500).json({
                  error: {
                    code: "DATABASE_ERROR",
                    message: "Failed to update lesson"
                  }
                });
              }

              res.json({
                message: "Lesson updated successfully",
                lesson: {
                  id: lessonId,
                  title,
                  content,
                  video_url,
                  transcript,
                  order_index,
                  duration
                }
              });
            }
          );
        }
      }
    );
  }
);

// Delete lesson (creators only)
router.delete('/:id',
  authenticateToken,
  requireCreator,
  (req, res) => {
    const lessonId = req.params.id;

    // Check if lesson exists and belongs to user's course
    db.get(
      `SELECT l.*, c.creator_id FROM lessons l 
       JOIN courses c ON l.course_id = c.id 
       WHERE l.id = ? AND c.creator_id = ?`,
      [lessonId, req.user.id],
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
              message: "Lesson not found or access denied"
            }
          });
        }

        // Delete lesson
        db.run('DELETE FROM lessons WHERE id = ?', [lessonId], function(err) {
          if (err) {
            return res.status(500).json({
              error: {
                code: "DATABASE_ERROR",
                message: "Failed to delete lesson"
              }
            });
          }

          res.json({
            message: "Lesson deleted successfully"
          });
        });
      }
    );
  }
);

module.exports = router;
