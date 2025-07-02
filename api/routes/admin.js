const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdminAuth } = require('../middleware/auth');
const { noCacheMiddleware } = require('../middleware/cache');

// All admin routes require admin authentication and no caching
router.use(requireAdminAuth);
router.use(noCacheMiddleware);

// Student management
router.get('/students', adminController.getStudents);
router.get('/unapproved-students', adminController.getUnapprovedStudents);
router.get('/approved-students', adminController.getApprovedStudents);
router.post('/students/:studentId/approve', adminController.approveStudent);
router.post('/students/:studentId/reject', adminController.rejectStudent);
router.delete('/students/:studentId', adminController.deleteStudent);

// Device management
router.post('/students/:studentId/device', adminController.updateDeviceInfo);
router.delete('/students/:studentId/device', adminController.unbindDevice);

// Student profile
router.get('/students/:studentId/profile', adminController.getStudentProfile);

module.exports = router;
