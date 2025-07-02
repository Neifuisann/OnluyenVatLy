// =====================================
// File: /api/controllers/adminController.js
// =====================================
const databaseService = require('../services/databaseService');
const { asyncHandler } = require('../middleware/errorHandler');

class AdminController {
    // Get unapproved students
    getUnapprovedStudents = asyncHandler(async (req, res) => {
        const students = await databaseService.getStudents({ approved: false });
        res.json(students);
    });

    // Unbind device from student
    unbindDevice = asyncHandler(async (req, res) => {
        const { studentId } = req.params;
        await databaseService.unbindDevice(studentId);
        
        res.json({ 
            success: true, 
            message: 'Device unbound successfully. The student can now log in from a new device.' 
        });
    });

    // Delete student and all data
    deleteStudent = asyncHandler(async (req, res) => {
        const { studentId } = req.params;
        await databaseService.deleteStudentAndData(studentId);
        
        res.json({ 
            success: true, 
            message: 'Student and all associated data deleted successfully.' 
        });
    });

    // Save raw lesson content
    saveRawLesson = asyncHandler(async (req, res) => {
        const { id, rawContent } = req.body;
        
        if (!rawContent) {
            return res.status(400).json({ success: false, error: 'No content provided' });
        }
        
        if (!id) {
            return res.status(400).json({ success: false, error: 'No ID provided' });
        }
        
        await databaseService.saveRawLessonContent(id, rawContent, req.session.user?.id);
        
        res.json({ success: true, id: id });
    });

    // Get raw lesson content
    getRawLesson = asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ success: false, error: 'No ID provided' });
        }
        
        const data = await databaseService.getRawLessonContent(id);
        
        if (!data) {
            return res.status(404).json({ success: false, error: 'Content not found' });
        }
        
        res.json({ success: true, content: data.content });
    });
}

module.exports = new AdminController();

// =====================================
// File: /api/controllers/historyController.js
// =====================================
const databaseService = require('../services/databaseService');
const { asyncHandler } = require('../middleware/errorHandler');

class HistoryController {
    // Get history with pagination
    getHistory = asyncHandler(async (req, res) => {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 15,
            search: req.query.search || '',
            sort: req.query.sort || 'time-desc'
        };
        
        const result = await databaseService.getHistoryWithPagination(options);
        
        res.json(result);
    });

    // Delete single history entry
    deleteHistoryEntry = asyncHandler(async (req, res) => {
        const { resultId } = req.params;
        await databaseService.deleteResult(resultId);
        
        res.json({ 
            success: true, 
            message: 'History entry deleted.' 
        });
    });

    // Delete all history (not implemented for safety)
    deleteAllHistory = asyncHandler(async (req, res) => {
        console.warn("Attempting to delete ALL history entries!");
        
        return res.status(501).json({ 
            success: false, 
            message: 'Bulk delete not safely implemented via this API route. Consider using Supabase dashboard or RPC.' 
        });
    });
}

module.exports = new HistoryController();

// =====================================
// File: /api/routes/admin.js (Additional admin routes)
// =====================================
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const uploadController = require('../controllers/uploadController');
const { requireAdminAuth } = require('../middleware/auth');
const { noCacheMiddleware } = require('../middleware/cache');

// All admin routes require authentication
router.use(requireAdminAuth);
router.use(noCacheMiddleware);

// Student management
router.get('/unapproved-students', adminController.getUnapprovedStudents);
router.post('/unbind-device/:studentId', adminController.unbindDevice);
router.delete('/delete-student/:studentId', adminController.deleteStudent);

// Raw lesson content management
router.post('/save-raw-lesson', adminController.saveRawLesson);
router.get('/raw-lesson/:id', adminController.getRawLesson);

// Image upload with URL support (already in uploadController)
router.post('/upload-image', 
    uploadController.uploadLessonImage
);

module.exports = router;

// =====================================
// File: /api/routes/history.js
// =====================================
const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { requireAdminAuth } = require('../middleware/auth');
const { noCacheMiddleware } = require('../middleware/cache');

// All history routes require admin authentication
router.use(requireAdminAuth);
router.use(noCacheMiddleware);

router.get('/', historyController.getHistory);
router.delete('/:resultId', historyController.deleteHistoryEntry);
router.delete('/all', historyController.deleteAllHistory);

module.exports = router;

// =====================================
// Update /api/index.js to include these routes:
// =====================================
/*
// Import additional routes
const adminRoutes = require('./routes/admin');
const historyRoutes = require('./routes/history');

// Add to route setup section
app.use('/api/admin', adminRoutes);
app.use('/api/history', historyRoutes);
*/

// =====================================
// File: /api/middleware/auth.js (Add this function)
// =====================================
/*
// Add this middleware function to auth.js
const requireNotStudentAuth = (req, res, next) => {
    if (req.session.studentId) {
        return res.status(403).json({ 
            error: 'Access denied',
            message: 'Students cannot access this resource' 
        });
    }
    next();
};

module.exports = {
    // ... existing exports
    requireNotStudentAuth
};
*/

// =====================================
// Update /api/services/sessionService.js
// =====================================
/*
// Fix the updateStudentSession method to handle device identifiers properly
async updateStudentSession(studentId, sessionId, deviceIdentifier) {
    const updateData = {
        current_session_id: sessionId,
        last_login_at: new Date().toISOString()
    };

    // Update device information if provided
    if (deviceIdentifier) {
        // Use the new device_id system instead of fingerprint
        updateData.approved_device_id = deviceIdentifier;
        updateData.device_registered_at = new Date().toISOString();
    }

    await databaseService.updateStudent(studentId, updateData);
    return true;
}
*/

// =====================================
// Update /api/controllers/authController.js
// =====================================
/*
// Update the studentLogin method to pass deviceId properly
studentLogin = asyncHandler(async (req, res) => {
    const { phone_number, password } = req.body;
    // Use the new device_id instead of device_fingerprint
    const deviceIdentifier = req.headers['x-device-id'] || req.body.device_id || req.body.deviceId;

    const result = await authService.authenticateStudent(phone_number, password, deviceIdentifier);
    
    // ... rest of the method
});
*/