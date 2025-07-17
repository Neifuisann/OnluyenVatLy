const express = require('express');
const router = express.Router();
const adminEncryptionController = require('../lib/controllers/adminEncryptionController');
const { requireAdminAuth } = require('../lib/middleware/auth');
const { noCacheMiddleware } = require('../lib/middleware/cache');
const { addCSRFToken, validateCSRFToken } = require('../lib/middleware/csrf');

// All routes require admin authentication
router.use(requireAdminAuth);
router.use(noCacheMiddleware);
router.use(addCSRFToken);

// Get encryption status
router.get('/status', adminEncryptionController.getEncryptionStatus);

// Toggle encryption on/off
router.post('/toggle', validateCSRFToken, adminEncryptionController.toggleEncryption);

module.exports = router;