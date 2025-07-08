const express = require('express');
const router = express.Router();
const historyController = require('../api/controllers/historyController');
const { requireAdminAuth } = require('../api/middleware/auth');
const { noCacheMiddleware } = require('../api/middleware/cache');

// All history routes require admin authentication and no caching
router.use(requireAdminAuth);
router.use(noCacheMiddleware);

// Get history with pagination and search
router.get('/', historyController.getHistory);

// Delete specific result
router.delete('/results/:resultId', historyController.deleteResult);

// Get lesson results
router.get('/lessons/:lessonId/results', historyController.getLessonResults);

module.exports = router;
