const express = require('express');
const router = express.Router();

// Import individual route modules
const quizRoutes = require('./quiz');
const resultsRoutes = require('./results');
const progressRoutes = require('./progress');
const explainRoutes = require('./explain');
const aiRoutes = require('./ai');

// Mount all learning-related routes
router.use('/quiz', quizRoutes);
router.use('/results', resultsRoutes);
router.use('/progress', progressRoutes);
router.use('/explain', explainRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
