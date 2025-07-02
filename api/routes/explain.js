const express = require('express');
const router = express.Router();
const explainController = require('../controllers/explainController');
const { requireStudentAuth } = require('../middleware/auth');
const { noCacheMiddleware } = require('../middleware/cache');

router.post('/',
    requireStudentAuth,
    noCacheMiddleware,
    explainController.explainAnswer
);

module.exports = router;
