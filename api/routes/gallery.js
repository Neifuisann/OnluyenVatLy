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
