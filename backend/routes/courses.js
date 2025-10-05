const express = require('express');
const { authenticateToken, requireCreator, requireLearner } = require('../middleware/auth');
const { checkIdempotency } = require('../middleware/idempotency');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// Get all published courses (for learners)
router.get('/', (req, res) => {
  const { limit = 10, offset = 0 } = req.query;
  
  const limitNum = parseInt(limit);
  const offsetNum = parseInt(offset);

  // Only show courses that are published and approved by admin
  db.all(
    `SELECT c.*, u.name as creator_name, 
     COUNT(l.id) as lesson_count,
     (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrollment_count
     FROM courses c 
     JOIN users u ON c.creator_id = u.id 
     LEFT JOIN lessons l ON c.id = l.course_id
     WHERE c.status = 'published'
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`,
    [limitNum, offsetNum],
    (err, courses) => {
      if (err) {
        return res.status(500).json({
          error: {
            code: "DATABASE_ERROR",
            message: "Database error occurred"
          }
        });
      }

      // Get total count for pagination
      db.get(
        'SELECT COUNT(*) as total FROM courses WHERE status = "published"',
        (err, countResult) => {
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
            total: countResult.total,
            next_offset: offsetNum + limitNum < countResult.total ? offsetNum + limitNum : null
          });
        }
      );
    }
  );
});

// Get course by ID
router.get('/:id', (req, res) => {
  const courseId = req.params.id;

  db.get(
    `SELECT c.*, u.name as creator_name,
     COUNT(l.id) as lesson_count
     FROM courses c 
     JOIN users u ON c.creator_id = u.id 
     LEFT JOIN lessons l ON c.id = l.course_id
     WHERE c.id = ? AND c.status = 'published'
     GROUP BY c.id`,
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

      res.json({ course });
    }
  );
});

// Create course (creators only)
router.post('/',
  authenticateToken,
  requireCreator,
  checkIdempotency,
  [
    body('title').trim().isLength({ min: 3 }),
    body('description').trim().isLength({ min: 10 })
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

    const { title, description, thumbnail_url } = req.body;

    db.run(
      'INSERT INTO courses (title, description, creator_id, thumbnail_url, status) VALUES (?, ?, ?, ?, ?)',
      [title, description, req.user.id, thumbnail_url, 'draft'],
      function(err) {
        if (err) {
          return res.status(500).json({
            error: {
              code: "DATABASE_ERROR",
              message: "Failed to create course"
            }
          });
        }

        res.status(201).json({
          message: "Course created successfully",
          course: {
            id: this.lastID,
            title,
            description,
            creator_id: req.user.id,
            thumbnail_url,
            status: 'draft'
          }
        });
      }
    );
  }
);

// Update course (creators only)
router.put('/:id',
  authenticateToken,
  requireCreator,
  checkIdempotency,
  (req, res) => {
    const courseId = req.params.id;
    const { title, description, thumbnail_url, status } = req.body;

    // Check if course exists and belongs to user
    db.get(
      'SELECT * FROM courses WHERE id = ? AND creator_id = ?',
      [courseId, req.user.id],
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

        // Update course
        db.run(
          'UPDATE courses SET title = ?, description = ?, thumbnail_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [title, description, thumbnail_url, status, courseId],
          function(err) {
            if (err) {
              return res.status(500).json({
                error: {
                  code: "DATABASE_ERROR",
                  message: "Failed to update course"
                }
              });
            }

            res.json({
              message: "Course updated successfully",
              course: {
                id: courseId,
                title,
                description,
                thumbnail_url,
                status
              }
            });
          }
        );
      }
    );
  }
);

// Delete course (creators only)
router.delete('/:id',
  authenticateToken,
  requireCreator,
  (req, res) => {
    const courseId = req.params.id;

    // Check if course exists and belongs to user
    db.get(
      'SELECT * FROM courses WHERE id = ? AND creator_id = ?',
      [courseId, req.user.id],
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

        // Delete course (cascade will handle related records)
        db.run('DELETE FROM courses WHERE id = ?', [courseId], function(err) {
          if (err) {
            return res.status(500).json({
              error: {
                code: "DATABASE_ERROR",
                message: "Failed to delete course"
              }
            });
          }

          res.json({
            message: "Course deleted successfully"
          });
        });
      }
    );
  }
);

// Get creator's courses
router.get('/creator/my-courses',
  authenticateToken,
  requireCreator,
  (req, res) => {
    const { limit = 10, offset = 0 } = req.query;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    db.all(
      `SELECT c.*, COUNT(l.id) as lesson_count,
       (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as enrollment_count
       FROM courses c 
       LEFT JOIN lessons l ON c.id = l.course_id
       WHERE c.creator_id = ?
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limitNum, offsetNum],
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

module.exports = router;
