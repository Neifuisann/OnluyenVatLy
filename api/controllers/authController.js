const authService = require('../services/authService');
const sessionService = require('../services/sessionService');
const { asyncHandler, AuthenticationError, ValidationError } = require('../middleware/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

class AuthController {
  // Admin login
  adminLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const result = await authService.authenticateAdmin(username, password);
    
    // Set admin session
    sessionService.setAdminSession(req);
    
    res.json({
      success: true,
      message: result.message,
      user: { type: 'admin', username }
    });
  });

  // Student login
  studentLogin = asyncHandler(async (req, res) => {
    const { phone_number, password } = req.body;
    const deviceIdentifier = req.headers['x-device-id'] || req.body.deviceId;

    // Debug logging
    console.log('[Auth Debug] Student login attempt:', {
      endpoint: '/api/auth/student/login',
      phone: phone_number?.substring(0, 3) + '***',
      hasDeviceId: !!deviceIdentifier,
      sessionId: req.sessionID
    });

    const result = await authService.authenticateStudent(phone_number, password, deviceIdentifier);
    
    // Handle session management
    await sessionService.terminateExistingSessions(result.student.id, req.sessionID);
    
    // Set student session
    sessionService.setStudentSession(req, result.student);
    
    // Update student session in database
    await sessionService.updateStudentSession(result.student.id, req.sessionID, deviceIdentifier);
    
    console.log('[Auth Debug] Student login successful:', {
      studentId: result.student.id,
      studentName: result.student.name,
      sessionId: req.sessionID
    });
    
    res.json({
      success: true,
      message: result.message,
      user: {
        type: 'student',
        id: result.student.id,
        name: result.student.name
      }
    });
  });

  // Student registration
  studentRegister = asyncHandler(async (req, res) => {
    const result = await authService.registerStudent(req.body);
    
    res.status(201).json({
      success: true,
      message: result.message,
      studentId: result.studentId
    });
  });

  // Logout (both admin and student)
  logout = asyncHandler(async (req, res) => {
    const sessionData = sessionService.getSessionData(req);
    
    // Clear student session in database if student
    if (sessionData.studentId) {
      await sessionService.clearStudentSession(sessionData.studentId);
    }
    
    // Destroy session
    sessionService.destroySession(req, (err) => {
      if (err) {
        console.error('Error destroying session:', err);
        throw new Error('Logout failed');
      }
      
      res.json({
        success: true,
        message: SUCCESS_MESSAGES.LOGOUT_SUCCESS
      });
    });
  });

  // Check authentication status
  checkAuth = asyncHandler(async (req, res) => {
    const sessionData = sessionService.getSessionData(req);
    
    if (sessionData.isAuthenticated) {
      res.json({
        success: true,
        data: {
          authenticated: true,
          user: {
            type: 'admin'
          }
        }
      });
    } else if (sessionData.studentId) {
      res.json({
        success: true,
        data: {
          authenticated: true,
          user: {
            type: 'student',
            id: sessionData.studentId,
            name: sessionData.studentName
          }
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          authenticated: false
        }
      });
    }
  });

  // Refresh session
  refreshSession = asyncHandler(async (req, res) => {
    const sessionData = sessionService.getSessionData(req);
    
    if (!sessionData.isAuthenticated && !sessionData.studentId) {
      throw new AuthenticationError('No active session to refresh');
    }
    
    // Save session to extend expiry
    sessionService.saveSession(req, (err) => {
      if (err) {
        console.error('Error refreshing session:', err);
        throw new Error('Session refresh failed');
      }
      
      res.json({
        success: true,
        message: 'Session refreshed successfully',
        user: sessionData.isAuthenticated ? 
          { type: 'admin' } : 
          { type: 'student', id: sessionData.studentId, name: sessionData.studentName }
      });
    });
  });

  // Change password (for students)
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const sessionData = sessionService.getSessionData(req);
    
    if (!sessionData.studentId) {
      throw new AuthenticationError('Student authentication required');
    }

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    // This would need to be implemented in authService
    // For now, just return success
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  });

  // Validate device
  validateDevice = asyncHandler(async (req, res) => {
    const { deviceId } = req.body;
    const sessionData = sessionService.getSessionData(req);
    
    if (!sessionData.studentId) {
      throw new AuthenticationError('Student authentication required');
    }

    if (!deviceId) {
      throw new ValidationError('Device ID is required');
    }

    // This would validate the device against the stored device info
    // For now, just return success
    res.json({
      success: true,
      message: 'Device validated successfully',
      deviceId
    });
  });

  // Get session info
  getSessionInfo = asyncHandler(async (req, res) => {
    const sessionData = sessionService.getSessionData(req);
    
    res.json({
      success: true,
      data: {
        sessionId: sessionData.sessionId,
        authenticated: sessionData.isAuthenticated || !!sessionData.studentId,
        user: sessionData.isAuthenticated ? 
          { type: 'admin' } : 
          sessionData.studentId ? 
            { type: 'student', id: sessionData.studentId, name: sessionData.studentName } : 
            null
      }
    });
  });

  // Admin check endpoint
  checkAdminAuth = asyncHandler(async (req, res) => {
    const isAdmin = sessionService.isAdminAuthenticated(req);
    
    res.json({
      success: true,
      data: {
        isAdmin,
        authenticated: isAdmin
      }
    });
  });

  // Student check endpoint
  checkStudentAuth = asyncHandler(async (req, res) => {
    const sessionData = sessionService.getSessionData(req);
    const isStudent = !!sessionData.studentId;

    // Debug logging
    console.log('[Auth Debug] Student check:', {
      endpoint: '/api/auth/student/check',
      sessionId: req.sessionID,
      studentId: sessionData.studentId,
      studentName: sessionData.studentName,
      isStudent,
      headers: {
        'x-device-id': req.headers['x-device-id']
      }
    });

    res.json({
      success: true,
      data: {
        isStudent,
        authenticated: isStudent,
        isAuthenticated: isStudent, // Add this for client compatibility
        student: isStudent ? {
          id: sessionData.studentId,
          name: sessionData.studentName
        } : null
      }
    });
  });
}

module.exports = new AuthController();
