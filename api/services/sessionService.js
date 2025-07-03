const databaseService = require('./databaseService');

class SessionService {
  constructor() {
    this.sessionStore = null; // Initialize as null
    this.studentCache = new Map(); // Cache for student data to reduce DB queries
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache timeout
  }

  // Initialize session service with session store
  initialize(sessionStore) {
    this.sessionStore = sessionStore;
    
    // Set up cache cleanup interval
    setInterval(() => {
      this.cleanupCache();
    }, this.cacheTimeout);
  }

  // Cache management methods
  getCachedStudent(studentId) {
    const cached = this.studentCache.get(studentId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedStudent(studentId, studentData) {
    this.studentCache.set(studentId, {
      data: studentData,
      timestamp: Date.now()
    });
  }

  clearStudentCache(studentId) {
    this.studentCache.delete(studentId);
  }

  cleanupCache() {
    const now = Date.now();
    for (const [studentId, cached] of this.studentCache.entries()) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.studentCache.delete(studentId);
      }
    }
  }

  // Terminate existing sessions for a student (single session enforcement)
  async terminateExistingSessions(studentId, currentSessionId) {
    try {
      // Try to get student data from cache first
      let studentData = this.getCachedStudent(studentId);
      
      if (!studentData) {
        // Get student's current session ID from database using databaseService
        studentData = await databaseService.getStudentById(studentId);
        
        if (!studentData) {
          console.error('Student not found:', studentId);
          return;
        }
        
        // Cache the student data for future use
        this.setCachedStudent(studentId, studentData);
      }

      if (studentData.current_session_id && studentData.current_session_id !== currentSessionId) {
        // Destroy the previous session (new login gets priority)
        console.log(`🔄 Single session enforcement: Terminating previous session ${studentData.current_session_id} for student ${studentId} (new session: ${currentSessionId})`);
        
        this.sessionStore.destroy(studentData.current_session_id, (err) => {
          if (err) {
            console.error('❌ Error destroying previous session:', err);
          } else {
            console.log(`✅ Previous session ${studentData.current_session_id} successfully terminated for student ${studentId}`);
          }
        });
      } else if (!studentData.current_session_id) {
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
      // More reliable device ID detection - check for UUID format or specific patterns
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deviceIdentifier);
      const isLongId = deviceIdentifier.length > 20;
      
      if (isUUID || isLongId) {
        updateData.approved_device_id = deviceIdentifier;
        updateData.device_registered_at = new Date().toISOString();
      } else {
        // Legacy fingerprint support
        updateData.approved_device_fingerprint = deviceIdentifier;
      }
    }

    await databaseService.updateStudent(studentId, updateData);
    
    // Clear cache since student data has been updated
    this.clearStudentCache(studentId);
    
    return true;
  }

  // Clear student session
  async clearStudentSession(studentId) {
    await databaseService.updateStudent(studentId, {
      current_session_id: null
    });
    
    // Clear cache since student data has been updated
    this.clearStudentCache(studentId);
    
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
