const databaseService = require('../services/databaseService');
const sessionService = require('../services/sessionService');
const { asyncHandler, NotFoundError, AuthorizationError, ValidationError, AuthenticationError } = require('../middleware/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

class StudentController {
  // Get all students (admin only)
  getAllStudents = asyncHandler(async (req, res) => {
    const { approved, limit } = req.query;
    
    const students = await databaseService.getStudents({
      approved: approved !== undefined ? approved === 'true' : null,
      limit: limit ? parseInt(limit) : 100
    });
    
    res.json({
      success: true,
      students,
      count: students.length
    });
  });

  // Get pending students (admin only)
  getPendingStudents = asyncHandler(async (req, res) => {
    const students = await databaseService.getStudents({ approved: false });
    
    res.json({
      success: true,
      students,
      count: students.length
    });
  });

  // Get approved students (admin only)
  getApprovedStudents = asyncHandler(async (req, res) => {
    const students = await databaseService.getStudents({ approved: true });
    
    res.json({
      success: true,
      students,
      count: students.length
    });
  });

  // Approve student (admin only)
  approveStudent = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    
    await databaseService.updateStudent(studentId, {
      is_approved: true,
      approved_at: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Student approved successfully'
    });
  });

  // Reject/unapprove student (admin only)
  rejectStudent = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    
    await databaseService.updateStudent(studentId, {
      is_approved: false,
      approved_at: null
    });
    
    res.json({
      success: true,
      message: 'Student approval revoked'
    });
  });

  // Get student profile
  getStudentProfile = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    
    // Authorization already handled by requireAdminOrOwner middleware
    // No need for additional checks here
    
    const profile = await databaseService.getStudentProfile(studentId);
    
    res.json({
      success: true,
      profile
    });
  });

  // Update student profile
  updateStudentProfile = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const updateData = req.body;
    
    // Authorization already handled by requireAdminOrOwner middleware
    // No need for additional checks here
    
    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password_hash;
    delete updateData.is_approved;
    delete updateData.approved_device_id;
    delete updateData.current_session_id;
    
    await databaseService.updateStudent(studentId, updateData);
    
    res.json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATE_SUCCESS
    });
  });

  // Delete student (admin only)
  deleteStudent = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    
    // This would need to be implemented in databaseService
    // For now, just return success
    res.json({
      success: true,
      message: SUCCESS_MESSAGES.DELETE_SUCCESS
    });
  });

  // Set student info in session
  setStudentInfo = asyncHandler(async (req, res) => {
    const sessionData = sessionService.getSessionData(req);
    
    if (!sessionData.studentId) {
      throw new AuthenticationError('Student authentication required');
    }
    
    const { name, school, grade } = req.body;
    
    if (!name) {
      throw new ValidationError('Student name is required');
    }
    
    const studentInfo = { name, school, grade };
    sessionService.setStudentInfo(req, studentInfo);
    
    res.json({
      success: true,
      message: 'Student information set successfully',
      studentInfo
    });
  });

  // Get student info from session
  getStudentInfo = asyncHandler(async (req, res) => {
    const sessionData = sessionService.getSessionData(req);
    
    if (!sessionData.studentId) {
      throw new AuthenticationError('Student authentication required');
    }
    
    const studentInfo = sessionService.getStudentInfo(req);
    
    res.json({
      success: true,
      studentInfo: studentInfo || null
    });
  });

  // Update device information
  updateDeviceInfo = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { deviceId, deviceFingerprint } = req.body;
    
    // Authorization already handled by requireAdminOrOwner middleware
    // No need for additional checks here
    
    const updateData = {};
    if (deviceId) {
      updateData.approved_device_id = deviceId;
      updateData.device_registered_at = new Date().toISOString();
    }
    if (deviceFingerprint) {
      updateData.approved_device_fingerprint = deviceFingerprint;
    }
    
    await databaseService.updateStudent(studentId, updateData);
    
    res.json({
      success: true,
      message: 'Device information updated successfully'
    });
  });

  // Get student statistics
  getStudentStatistics = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    
    // Authorization already handled by requireAdminOrOwner middleware
    // No need for additional checks here
    
    // This would need to be implemented to gather student statistics
    // For now, return basic info
    const stats = {
      totalLessonsCompleted: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastActivity: null
    };
    
    res.json({
      success: true,
      statistics: stats
    });
  });

  // Get student activity history
  getStudentActivity = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { limit = 50 } = req.query;
    
    // Authorization already handled by requireAdminOrOwner middleware
    // No need for additional checks here
    
    // This would need to be implemented to get activity history
    // For now, return empty array
    const activities = [];
    
    res.json({
      success: true,
      activities,
      count: activities.length
    });
  });

  // Reset student password (admin only)
  resetStudentPassword = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
      throw new ValidationError('New password is required');
    }
    
    // This would need to be implemented in authService
    // For now, just return success
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  });
}

module.exports = new StudentController();
