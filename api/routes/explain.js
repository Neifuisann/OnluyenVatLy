const express = require('express');
const router = express.Router();
const explainController = require('../controllers/explainController');
const { requireStudentAuth } = require('../middleware/auth');
const { noCacheMiddleware } = require('../middleware/cache');
const { aiRateLimit } = require('../middleware/rateLimiting');

// Debug middleware to log incoming explain requests
router.use((req, res, next) => {
    console.log('[Explain Route Debug] Incoming request:', {
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        headers: {
            'content-type': req.headers['content-type'],
            'x-csrf-token': req.headers['x-csrf-token'],
            'cookie': req.headers.cookie ? 'present' : 'missing'
        },
        hasBody: !!req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        sessionId: req.session?.id,
        isAuthenticated: !!req.session?.studentId
    });
    next();
});

router.post('/',
    requireStudentAuth,
    noCacheMiddleware,
    aiRateLimit,
    explainController.explainAnswer
);

module.exports = router;
