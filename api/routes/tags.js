const express = require('express');
const router = express.Router();
const tagsController = require('../controllers/tagsController');
const { optionalAuth } = require('../middleware/auth');
const { longCacheMiddleware } = require('../middleware/cache');

router.get('/', 
    optionalAuth,
    longCacheMiddleware(3600), // 1 hour cache
    tagsController.getAllTags
);

module.exports = router;
