const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const uploadController = require('../controllers/uploadController');
const multer = require('multer');
const { requireAdminAuth } = require('../middleware/auth');
const { noCacheMiddleware } = require('../middleware/cache');
const {
  validateFileUpload
} = require('../middleware/validation');
const { uploadErrorHandler } = require('../middleware/errorHandler');

// Configure multer for document uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

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

// Dashboard statistics
router.get('/dashboard-stats', adminController.getDashboardStats);

// Document upload routes (for backward compatibility)
router.post('/upload-document',
  upload.single('document'),
  uploadErrorHandler,
  validateFileUpload,
  uploadController.uploadDocument
);

router.post('/process-document',
  upload.single('document'),
  uploadErrorHandler,
  validateFileUpload,
  uploadController.uploadDocument
);

module.exports = router;
