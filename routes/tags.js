const express = require('express');
const router = express.Router();
const tagsController = require('../api/controllers/tagsController');
const { optionalAuth } = require('../api/middleware/auth');
const { longCacheMiddleware, shortCacheMiddleware } = require('../api/middleware/cache');

router.get('/',
    optionalAuth,
    longCacheMiddleware(3600), // 1 hour cache
    tagsController.getAllTags
);

router.get('/popular',
    optionalAuth,
    shortCacheMiddleware(600), // 10 minutes cache (shorter for dynamic popularity data)
    tagsController.getPopularTags
);

module.exports = router;
