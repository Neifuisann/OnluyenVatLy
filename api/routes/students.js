const express = require('express');
const router = express.Router();

// Import controllers
const studentController = require('../controllers/studentController');

// Import middleware
const { 
  validateIdParam,
  validatePagination 
} = require('../middleware/validation');
const { 
  requireAdminAuth, 
  requireStudentAuth,
  requireAdminOrOwner 
} = require('../middleware/auth');
const { shortCacheMiddleware, noCacheMiddleware } = require('../middleware/cache');

// Admin-only routes for student management
router.get('/',
  requireAdminAuth,
  validatePagination,
  shortCacheMiddleware(300), // 5 minutes cache
  studentController.getAllStudents
);

router.get('/pending',
  requireAdminAuth,
  noCacheMiddleware,
  studentController.getPendingStudents
);

router.get('/approved',
  requireAdminAuth,
  shortCacheMiddleware(300), // 5 minutes cache
  studentController.getApprovedStudents
);

router.post('/:studentId/approve',
  requireAdminAuth,
  validateIdParam('studentId'),
  noCacheMiddleware,
  studentController.approveStudent
);

router.post('/:studentId/reject',
  requireAdminAuth,
  validateIdParam('studentId'),
  noCacheMiddleware,
  studentController.rejectStudent
);

router.delete('/:studentId',
  requireAdminAuth,
  validateIdParam('studentId'),
  noCacheMiddleware,
  studentController.deleteStudent
);

router.post('/:studentId/reset-password',
  requireAdminAuth,
  validateIdParam('studentId'),
  noCacheMiddleware,
  studentController.resetStudentPassword
);

// Student profile routes (any authenticated student can view any profile)
router.get('/:studentId/profile',
  requireStudentAuth,
  validateIdParam('studentId'),
  shortCacheMiddleware(600), // 10 minutes cache
  studentController.getStudentProfile
);

router.put('/:studentId/profile',
  requireAdminOrOwner,
  validateIdParam('studentId'),
  noCacheMiddleware,
  studentController.updateStudentProfile
);

router.get('/:studentId/statistics',
  requireStudentAuth,
  validateIdParam('studentId'),
  shortCacheMiddleware(300), // 5 minutes cache
  studentController.getStudentStatistics
);

router.get('/:studentId/activity',
  requireStudentAuth,
  validateIdParam('studentId'),
  validatePagination,
  shortCacheMiddleware(300), // 5 minutes cache
  studentController.getStudentActivity
);

// Device management routes
router.put('/:studentId/device',
  requireAdminOrOwner,
  validateIdParam('studentId'),
  noCacheMiddleware,
  studentController.updateDeviceInfo
);

// Student info session management
router.post('/info',
  requireStudentAuth,
  noCacheMiddleware,
  studentController.setStudentInfo
);

router.get('/info',
  requireStudentAuth,
  noCacheMiddleware,
  studentController.getStudentInfo
);

module.exports = router;
