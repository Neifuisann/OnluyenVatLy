const express = require('express');
const router = express.Router();
const debugController = require('../api/controllers/debug-lesson');
const { requireAdminAuth } = require('../api/middleware/auth');

// Debug endpoint for lesson inspection (admin only)
router.post('/lesson', requireAdminAuth, debugController.debugLesson);

module.exports = router;