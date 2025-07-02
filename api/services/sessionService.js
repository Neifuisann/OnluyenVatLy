const databaseService = require('./databaseService');

class SessionService {
  constructor() {
    this.sessionStore = null; // Initialize as null
  }

  // Initialize session service with session store
  initialize(sessionStore) {
    this.sessionStore = sessionStore;
  }

  // Terminate existing sessions for a student (single session enforcement)
  async terminateExistingSessions(studentId, currentSessionId) {
    try {
      // Get student's current session ID from database
      const student = await databaseService.getStudentByPhone(null); // We need to modify this to get by ID
      // For now, let's get the student data directly
      const { data: studentData, error } = await require('../config/database').supabase
        .from('students')
        .select('current_session_id')
        .eq('id', studentId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching student session:', error);
        return;
      }

      if (studentData && studentData.current_session_id && studentData.current_session_id !== currentSessionId) {
        // Destroy the previous session (new login gets priority)
        console.log(`🔄 Single session enforcement: Terminating previous session ${studentData.current_session_id} for student ${studentId} (new session: ${currentSessionId})`);
        
        this.sessionStore.destroy(studentData.current_session_id, (err) => {
          if (err) {
            console.error('❌ Error destroying previous session:', err);
          } else {
            console.log(`✅ Previous session ${studentData.current_session_id} successfully terminated for student ${studentId}`);
          }
        });
      } else if (studentData && !studentData.current_session_id) {
        console.log(`📱 First session for student ${studentId}: ${currentSessionId}`);
      } else {
        console.log(`🔄 Session refresh for student ${studentId}: ${currentSessionId}`);
      }
    } catch (error) {
      console.error('Error terminating existing sessions:', error);
    }
  }

  // Update student session information
  async updateStudentSession(studentId, sessionId, deviceIdentifier) {
    const updateData = {
      current_session_id: sessionId,
      last_login_at: new Date().toISOString()
    };

    // Update device information if provided
    if (deviceIdentifier) {
      // Check if this is a device_id (new system) or device_fingerprint (legacy)
      if (deviceIdentifier.length > 20) { // Assume device_id is longer
        updateData.approved_device_id = deviceIdentifier;
        updateData.device_registered_at = new Date().toISOString();
      } else {
        // Legacy fingerprint support
        updateData.approved_device_fingerprint = deviceIdentifier;
      }
    }

    await databaseService.updateStudent(studentId, updateData);
    return true;
  }

  // Clear student session
  async clearStudentSession(studentId) {
    await databaseService.updateStudent(studentId, {
      current_session_id: null
    });
    return true;
  }

  // Get session data
  getSessionData(req) {
    // Safety check for request and session
    if (!req || !req.session) {
      return {
        sessionId: null,
        isAuthenticated: false,
        studentId: null,
        studentName: null,
        studentInfo: null
      };
    }

    return {
      sessionId: req.sessionID || null,
      isAuthenticated: req.session.isAuthenticated || false,
      studentId: req.session.studentId || null,
      studentName: req.session.studentName || null,
      studentInfo: req.session.studentInfo || null
    };
  }

  // Set admin session
  setAdminSession(req) {
    req.session.isAuthenticated = true;
    // Clear any student-related session data
    delete req.session.studentId;
    delete req.session.studentName;
    delete req.session.studentInfo;
  }

  // Set student session
  setStudentSession(req, student) {
    req.session.studentId = student.id;
    req.session.studentName = student.name;
    // Clear admin session data
    delete req.session.isAuthenticated;
  }

  // Clear all session data
  clearSession(req) {
    delete req.session.isAuthenticated;
    delete req.session.studentId;
    delete req.session.studentName;
    delete req.session.studentInfo;
  }

  // Destroy session completely
  destroySession(req, callback) {
    req.session.destroy(callback);
  }

  // Save session explicitly
  saveSession(req, callback) {
    req.session.save(callback);
  }

  // Check if user is authenticated admin
  isAdminAuthenticated(req) {
    return req.session && req.session.isAuthenticated === true;
  }

  // Check if user is authenticated student
  isStudentAuthenticated(req) {
    return req.session && req.session.studentId;
  }

  // Check if student has required info
  hasStudentInfo(req) {
    return req.session && req.session.studentInfo;
  }

  // Set student info
  setStudentInfo(req, studentInfo) {
    req.session.studentInfo = studentInfo;
  }

  // Get student info
  getStudentInfo(req) {
    return req.session.studentInfo;
  }

  // Validate session integrity
  validateSessionIntegrity(req) {
    const session = req.session;

    // Check for conflicting session states
    if (session.isAuthenticated && session.studentId) {
      console.warn('❌ Session integrity issue: Both admin and student authentication present');
      return false;
    }

    // Check for required session data consistency
    if (session.studentId && !session.studentName) {
      console.warn('❌ Session integrity issue: Student ID present but name missing');
      return false;
    }

    return true;
  }

  // Clean up invalid session data
  cleanupSession(req) {
    if (!this.validateSessionIntegrity(req)) {
      console.log('🧹 Cleaning up invalid session data for session:', req.sessionID);
      this.clearSession(req);
    }
  }
}

module.exports = new SessionService();
