const express = require('express');
const router = express.Router();
const explainController = require('../controllers/explainController');
const { requireStudentAuth } = require('../middleware/auth');
const { noCacheMiddleware } = require('../middleware/cache');
const { aiRateLimit } = require('../middleware/rateLimiting');

router.post('/',
    requireStudentAuth,
    noCacheMiddleware,
    aiRateLimit,
    explainController.explainAnswer
);

module.exports = router;
