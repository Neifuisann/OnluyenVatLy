const express = require('express');
const router = express.Router();
const galleryController = require('../api/controllers/galleryController');
const { optionalAuth } = require('../api/middleware/auth');
const { shortCacheMiddleware } = require('../api/middleware/cache');

router.get('/', 
    optionalAuth,
    shortCacheMiddleware(600), // 10 minutes cache
    galleryController.getGalleryImages
);

module.exports = router;
