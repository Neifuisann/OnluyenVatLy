// File: /api/routes/gallery.js
const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { optionalAuth } = require('../middleware/auth');
const { shortCacheMiddleware } = require('../middleware/cache');

router.get('/', 
    optionalAuth,
    shortCacheMiddleware(600), // 10 minutes cache
    galleryController.getGalleryImages
);

module.exports = router;

// =====================================
// File: /api/routes/quiz.js
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

// =====================================
// File: /api/routes/tags.js
const express = require('express');
const router = express.Router();
const tagsController = require('../controllers/tagsController');
const { optionalAuth } = require('../middleware/auth');
const { shortCacheMiddleware } = require('../middleware/cache');

router.get('/',
    optionalAuth,
    shortCacheMiddleware(900), // 15 minutes cache
    tagsController.getAllTags
);

module.exports = router;

// =====================================
// File: /api/routes/explain.js
const express = require('express');
const router = express.Router();
const explainController = require('../controllers/explainController');
const { requireStudentAuth } = require('../middleware/auth');
const { noCacheMiddleware } = require('../middleware/cache');

router.post('/', 
    requireStudentAuth,
    noCacheMiddleware,
    explainController.generateExplanation
);

module.exports = router;

// =====================================
// File: /api/controllers/galleryController.js
const fs = require('fs').promises;
const path = require('path');
const { asyncHandler } = require('../middleware/errorHandler');

class GalleryController {
    getGalleryImages = asyncHandler(async (req, res) => {
        const imagesDir = path.join(process.cwd(), 'public', 'lesson_images');
        
        try {
            // Ensure directory exists
            try {
                await fs.access(imagesDir);
            } catch (dirError) {
                if (dirError.code === 'ENOENT') {
                    await fs.mkdir(imagesDir, { recursive: true });
                } else {
                    throw dirError;
                }
            }
            
            // Read directory
            const dirents = await fs.readdir(imagesDir, { withFileTypes: true });
            const files = dirents
                .filter(dirent => dirent.isFile() && /\.(jpg|jpeg|png|gif)$/i.test(dirent.name))
                .map(dirent => `/lesson_images/${dirent.name}`)
                .sort();
            
            res.json(files);
        } catch (error) {
            console.error('Error reading gallery images:', error);
            res.status(500).json({ error: 'Failed to load gallery images' });
        }
    });
}

module.exports = new GalleryController();

// =====================================
// File: /api/controllers/quizController.js
const databaseService = require('../services/databaseService');
const { asyncHandler } = require('../middleware/errorHandler');

class QuizController {
    // Get quiz data
    getQuiz = asyncHandler(async (req, res) => {
        const quizData = await databaseService.getQuizData();
        res.json(quizData);
    });
    
    // Submit quiz results
    submitQuiz = asyncHandler(async (req, res) => {
        const resultId = Date.now().toString();
        const studentId = req.session.studentId;
        
        if (!studentId) {
            return res.status(401).json({ error: 'Unauthorized: No student session found.' });
        }
        
        const newResult = {
            id: resultId,
            timestamp: new Date().toISOString(),
            student_id: studentId,
            lessonId: 'quiz_game',
            score: req.body.score,
            totalPoints: req.body.totalPoints,
            questions: req.body.answers,
            ipAddress: req.body.ipAddress
        };
        
        const savedResult = await databaseService.saveQuizResult(newResult);
        
        res.json({ 
            success: true, 
            resultId: savedResult.id 
        });
    });
    
    // Save quiz configuration (admin only)
    saveQuiz = asyncHandler(async (req, res) => {
        const quizData = req.body;
        await databaseService.saveQuizData(quizData);
        res.json({ success: true });
    });
}

module.exports = new QuizController();

// =====================================
// File: /api/controllers/tagsController.js
const databaseService = require('../services/databaseService');
const { asyncHandler } = require('../middleware/errorHandler');

class TagsController {
    getAllTags = asyncHandler(async (req, res) => {
        const tags = await databaseService.getAllUniqueTags();
        res.json(tags);
    });
}

module.exports = new TagsController();

// =====================================
// File: /api/controllers/explainController.js
const aiService = require('../services/aiService');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');

class ExplainController {
    generateExplanation = asyncHandler(async (req, res) => {
        const { question, correctAnswer, studentAnswer } = req.body;
        
        if (!question || !correctAnswer) {
            throw new ValidationError('Question and correct answer are required');
        }
        
        const explanation = await aiService.generateQuestionExplanation(
            question,
            correctAnswer,
            studentAnswer || 'Không chọn'
        );
        
        res.json({
            success: true,
            explanation
        });
    });
}

module.exports = new ExplainController();