const express = require('express');
const router = express.Router();

// Import individual route modules
const adminRoutes = require('./admin');
const historyRoutes = require('./history');
const settingsRoutes = require('./settings');
const webhooksRoutes = require('./webhooks');
const debugRoutes = require('./debug');

// Mount all system-related routes
router.use('/admin', adminRoutes);
router.use('/history', historyRoutes);
router.use('/settings', settingsRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/debug', debugRoutes);

module.exports = router;
