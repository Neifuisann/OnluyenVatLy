const express = require('express');
const router = express.Router();

// Import individual route modules
const lessonsRoutes = require('./lessons');
const galleryRoutes = require('./gallery');
const tagsRoutes = require('./tags');
const uploadsRoutes = require('./uploads');
const ratingsRoutes = require('./ratings');

// Mount all content-related routes
router.use('/lessons', lessonsRoutes);
router.use('/gallery', galleryRoutes);
router.use('/tags', tagsRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/ratings', ratingsRoutes);

module.exports = router;
