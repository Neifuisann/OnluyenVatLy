const express = require('express');
const router = express.Router();

// Import controllers
const lessonController = require('../controllers/lessonController');

// Import middleware
const { 
  validateIdParam,
  validatePagination,
  validateSearch,
  validateLesson 
} = require('../middleware/validation');
const { 
  requireAdminAuth,
  requireStudentAuth,
  optionalAuth 
} = require('../middleware/auth');
const {
  lessonCacheMiddleware,
  statisticsCacheMiddleware,
  noCacheMiddleware,
  shortCacheMiddleware
} = require('../middleware/cache');

// Public lesson routes (with optional authentication)
router.get('/',
  optionalAuth,
  validatePagination,
  validateSearch,
  lessonCacheMiddleware,
  lessonController.getAllLessons
);

router.get('/search',
  optionalAuth,
  validatePagination,
  validateSearch,
  lessonCacheMiddleware,
  lessonController.searchLessons
);

router.get('/featured',
  optionalAuth,
  validatePagination,
  lessonCacheMiddleware,
  lessonController.getFeaturedLessons
);

router.get('/recent',
  optionalAuth,
  validatePagination,
  lessonCacheMiddleware,
  lessonController.getRecentLessons
);

router.get('/subject/:subject',
  optionalAuth,
  validatePagination,
  lessonCacheMiddleware,
  lessonController.getLessonsBySubject
);

router.get('/grade/:grade',
  optionalAuth,
  validatePagination,
  lessonCacheMiddleware,
  lessonController.getLessonsByGrade
);

// Get lessons filtered by tags
router.get('/tags/:tags',
  optionalAuth,
  validatePagination,
  lessonCacheMiddleware,
  lessonController.getLessonsByTags
);

// Get last incomplete lesson for the authenticated student
router.get('/last-incomplete',
  requireStudentAuth,
  noCacheMiddleware,
  lessonController.getLastIncompleteLesson
);

// Platform statistics for lessons page (must be before /:id route)
router.get('/platform-stats',
  optionalAuth,
  shortCacheMiddleware(600), // 10 minutes cache
  lessonController.getPlatformStats
);

router.get('/:id',
  optionalAuth,
  validateIdParam('id'),
  lessonCacheMiddleware,
  lessonController.getLessonById
);

// Admin-only lesson management routes
router.post('/',
  requireAdminAuth,
  validateLesson,
  noCacheMiddleware,
  lessonController.createLesson
);

router.put('/:id',
  requireAdminAuth,
  validateIdParam('id'),
  validateLesson,
  noCacheMiddleware,
  lessonController.updateLesson
);

router.delete('/:id',
  requireAdminAuth,
  validateIdParam('id'),
  noCacheMiddleware,
  lessonController.deleteLesson
);

router.post('/reorder',
  requireAdminAuth,
  noCacheMiddleware,
  lessonController.updateLessonOrder
);

router.post('/:id/duplicate',
  requireAdminAuth,
  validateIdParam('id'),
  noCacheMiddleware,
  lessonController.duplicateLesson
);

// Lesson statistics and results (admin only)
router.get('/:id/statistics',
  requireAdminAuth,
  validateIdParam('id'),
  statisticsCacheMiddleware,
  lessonController.getLessonStatistics
);

router.get('/:id/results',
  requireAdminAuth,
  validateIdParam('id'),
  validatePagination,
  shortCacheMiddleware(300), // 5 minutes cache
  lessonController.getLessonResults
);

// Student-accessible ranking data
router.get('/:id/rankings',
  optionalAuth,
  validateIdParam('id'),
  shortCacheMiddleware(300), // 5 minutes cache
  lessonController.getStudentRankings
);

module.exports = router;
