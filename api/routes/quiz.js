const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { requireStudentAuth, requireAdminAuth } = require('../middleware/auth');
const { shortCacheMiddleware, noCacheMiddleware } = require('../middleware/cache');

// Get quiz data (student route)
router.get('/', 
    requireStudentAuth,
    shortCacheMiddleware(1800), // 30 minutes cache
    quizController.getQuiz
);

// Submit quiz results (student route)
router.post('/submit',
    requireStudentAuth,
    noCacheMiddleware,
    quizController.submitQuiz
);

// Save quiz configuration (admin route)
router.post('/save',
    requireAdminAuth,
    noCacheMiddleware,
    quizController.saveQuiz
);

module.exports = router;
