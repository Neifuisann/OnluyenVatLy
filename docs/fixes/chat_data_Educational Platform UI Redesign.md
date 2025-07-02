### 用户:
The ui is good but not suitable for educational website. Please make it more formal. Using briliant, khan academy, skillshares,... As reference for educational purpose website. Build the UI base on science research and servey. Optimal for navigation, easy to use, convinient. The theme should more static, less distract. But shoudn't be too boring, still need some genZ on it, use dark theme. Using ULTRATHINK to make your response best. Reponse in full-file. Priority quality best! Make sure it fully functional as current. If you add new feature, also add a backend to serve it.
paste.txt->txt->Directory Structure:

└── ./
    └── api
        ├── config
        │   ├── constants.js
        │   ├── database.js
        │   └── session.js
        ├── controllers
        │   ├── authController.js
        │   ├── explainController.js
        │   ├── lessonController.js
        │   ├── quizController.js
        │   └── tagsController.js
        ├── middleware
        │   ├── auth.js
        │   ├── cache.js
        │   ├── errorHandler.js
        │   └── validation.js
        ├── routes
        │   ├── admin.js
        │   ├── auth.js
        │   ├── explain.js
        │   ├── lessons.js
        │   ├── students.js
        │   └── uploads.js
        ├── services
        │   ├── aiService.js
        │   ├── authService.js
        │   ├── cacheService.js
        │   ├── databaseService.js
        │   ├── ratingService.js
        │   └── sessionService.js
        ├── utils
        │   ├── helpers.js
        │   ├── logger.js
        │   └── validators.js
        └── index.js



---
File: /api/config/constants.js
---

// Application constants
const APP_CONFIG = {
  PORT: process.env.PORT || 3003,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SESSION_SECRET: process.env.SESSION_SECRET || 'fallback-secret-replace-me!',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "AIzaSyAxJF-5iBBx7gp9RPwrAfF58ERZi69KzCc"
};

// Admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  // This should be properly hashed in production
  password: '$2b$10$R4tMQGVYYReQayD82yx.6.E/4bE.0Ue.vmmWT6t1ggXrJFA3wUCqu' // Use bcrypt to generate this
};

// File upload configuration
const UPLOAD_CONFIG = {
  IMAGE_BUCKET: 'lesson-images',
  MAX_IMAGE_DIMENSION: 480,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_MAX_AGE: 60, // 1 minute
  LESSON_CACHE_MAX_AGE: 60 * 10, // 10 minutes
  STATISTICS_CACHE_MAX_AGE: 60 * 5, // 5 minutes
  RESULTS_CACHE_MAX_AGE: 60 * 60 * 24 // 24 hours
};

// Rating system configuration
const RATING_CONFIG = {
  DEFAULT_RATING: 1500,
  BASE_K_FACTOR: 32,
  MAX_TIME_BONUS: 300, // 5 minutes
  MAX_STREAK_MULTIPLIER: 10,
  STREAK_BONUS_RATE: 0.1
};

// API endpoints
const API_ENDPOINTS = {
  GEMINI_URL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
};

// Error messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Invalid input data',
  INTERNAL_ERROR: 'Internal server error',
  SESSION_ERROR: 'Session error',
  DATABASE_ERROR: 'Database operation failed'
};

// Success messages
const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful! Please wait for admin approval.',
  UPDATE_SUCCESS: 'Update successful',
  DELETE_SUCCESS: 'Delete successful'
};

module.exports = {
  APP_CONFIG,
  ADMIN_CREDENTIALS,
  UPLOAD_CONFIG,
  CACHE_CONFIG,
  RATING_CONFIG,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};



---
File: /api/config/database.js
---

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://miojaflixmncmhsgyabd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pb2phZmxpeG1uY21oc2d5YWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NTU0NTUsImV4cCI6MjA1OTIzMTQ1NX0.e3nU5sBvHsFHZP48jg1vjYsP-N2S4AgYuQgt8opHE_g';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validate required environment variables
if (!supabaseServiceKey) {
  console.warn('WARNING: SUPABASE_SERVICE_KEY environment variable not set. Storage uploads might fail if RLS requires authenticated users or service role.');
}

// Database connection string validation
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('FATAL ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

// PostgreSQL connection pool configuration
const pgPool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Adjust as per Supabase requirements or use proper CA certs
  }
});

// PostgreSQL pool error handling
pgPool.on('error', (err, client) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1); // Consider a more graceful shutdown strategy
});

module.exports = {
  supabase,
  supabaseAdmin,
  pgPool,
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceKey
};



---
File: /api/config/session.js
---

const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pgPool } = require('./database');

// Create PostgreSQL Session Store
const sessionStore = new pgSession({
  pool: pgPool,                // Connection pool
  tableName: 'session',        // Use the table created earlier
  createTableIfMissing: false  // We created it manually
});

// Session configuration
const sessionConfig = session({
  store: sessionStore, // Use the PostgreSQL store
  secret: process.env.SESSION_SECRET || 'fallback-secret-replace-me!', // !! USE AN ENV VAR FOR SECRET !!
  resave: false, // Recommended: Don't save session if unmodified
  saveUninitialized: false, // Recommended: Don't create session until something stored
  name: 'connect.sid', // Explicitly set the default session cookie name
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Ensure cookies are sent only over HTTPS in production
    httpOnly: true, // Prevent client-side JS from accessing the cookie
    sameSite: 'lax', // Recommended for most cases to prevent CSRF
    path: '/', // Ensure cookie is valid for all paths
    maxAge: 24 * 60 * 60 * 1000 // 1 day
    // Consider setting domain explicitly if needed
    // domain: process.env.NODE_ENV === 'production' ? '.yourdomain.com' : undefined
  },
  proxy: true // Trust the reverse proxy when setting secure cookies (Vercel/Heroku)
});

module.exports = {
  sessionStore,
  sessionConfig
};



---
File: /api/controllers/authController.js
---

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

    const result = await authService.authenticateStudent(phone_number, password, deviceIdentifier);
    
    // Handle session management
    await sessionService.terminateExistingSessions(result.student.id, req.sessionID);
    
    // Set student session
    sessionService.setStudentSession(req, result.student);
    
    // Update student session in database
    await sessionService.updateStudentSession(result.student.id, req.sessionID, deviceIdentifier);
    
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
        authenticated: true,
        user: {
          type: 'admin'
        }
      });
    } else if (sessionData.studentId) {
      res.json({
        authenticated: true,
        user: {
          type: 'student',
          id: sessionData.studentId,
          name: sessionData.studentName
        }
      });
    } else {
      res.json({
        authenticated: false
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
      sessionId: sessionData.sessionId,
      authenticated: sessionData.isAuthenticated || !!sessionData.studentId,
      user: sessionData.isAuthenticated ? 
        { type: 'admin' } : 
        sessionData.studentId ? 
          { type: 'student', id: sessionData.studentId, name: sessionData.studentName } : 
          null
    });
  });

  // Admin check endpoint
  checkAdminAuth = asyncHandler(async (req, res) => {
    const isAdmin = sessionService.isAdminAuthenticated(req);
    
    res.json({
      isAdmin,
      authenticated: isAdmin
    });
  });

  // Student check endpoint
  checkStudentAuth = asyncHandler(async (req, res) => {
    const sessionData = sessionService.getSessionData(req);
    const isStudent = !!sessionData.studentId;

    res.json({
      isStudent,
      authenticated: isStudent,
      isAuthenticated: isStudent, // Add this for client compatibility
      student: isStudent ? {
        id: sessionData.studentId,
        name: sessionData.studentName
      } : null
    });
  });
}

module.exports = new AuthController();



---
File: /api/controllers/explainController.js
---

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { asyncHandler } = require('../middleware/errorHandler');

class ExplainController {
    explainAnswer = asyncHandler(async (req, res) => {
        const { question, answer, explanation } = req.body;
        
        if (!question || !answer) {
            return res.status(400).json({ 
                error: 'Question and answer are required' 
            });
        }
        
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const prompt = `
Bạn là một giáo viên Vật lý giỏi. Hãy giải thích chi tiết câu trả lời sau:

Câu hỏi: ${question}
Đáp án: ${answer}
${explanation ? `Giải thích có sẵn: ${explanation}` : ''}

Hãy đưa ra lời giải thích chi tiết, dễ hiểu, bao gồm:
1. Phân tích câu hỏi
2. Các công thức/định luật liên quan (nếu có)
3. Cách giải từng bước
4. Kết luận

Trả lời bằng tiếng Việt, sử dụng ngôn ngữ phù hợp với học sinh trung học phổ thông.
            `.trim();
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            res.json({ 
                success: true, 
                explanation: text 
            });
            
        } catch (error) {
            console.error('Error generating explanation:', error);
            res.status(500).json({ 
                error: 'Không thể tạo giải thích. Vui lòng thử lại sau.' 
            });
        }
    });
}

module.exports = new ExplainController();



---
File: /api/controllers/lessonController.js
---

const databaseService = require('../services/databaseService');
const sessionService = require('../services/sessionService');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

class LessonController {
  // Get all lessons with pagination and search
  getAllLessons = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', sort = 'order' } = req.query;
    
    const result = await databaseService.getLessons({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sort
    });
    
    res.json({
      success: true,
      ...result
    });
  });

  // Get lesson by ID
  getLessonById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const lesson = await databaseService.getLessonById(id);
    
    // Increment view count
    await databaseService.incrementLessonViews(id, lesson.views || 0);
    
    res.json({
      success: true,
      lesson: {
        ...lesson,
        views: (lesson.views || 0) + 1
      }
    });
  });

  // Create new lesson (admin only)
  createLesson = asyncHandler(async (req, res) => {
    const lessonData = req.body;
    
    const newLesson = await databaseService.createLesson(lessonData);
    
    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      lesson: newLesson
    });
  });

  // Update lesson (admin only)
  updateLesson = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedLesson = await databaseService.updateLesson(id, updateData);
    
    res.json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATE_SUCCESS,
      lesson: updatedLesson[0]
    });
  });

  // Delete lesson (admin only)
  deleteLesson = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await databaseService.deleteLesson(id);
    
    res.json({
      success: true,
      message: SUCCESS_MESSAGES.DELETE_SUCCESS
    });
  });

  // Update lesson order (admin only)
  updateLessonOrder = asyncHandler(async (req, res) => {
    const { orderedLessons } = req.body;
    
    if (!Array.isArray(orderedLessons)) {
      throw new ValidationError('orderedLessons must be an array');
    }
    
    await databaseService.updateLessonOrder(orderedLessons);
    
    res.json({
      success: true,
      message: 'Lesson order updated successfully'
    });
  });

  // Get lesson statistics
  getLessonStatistics = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Get lesson basic info
    const lesson = await databaseService.getLessonById(id);
    
    // Get lesson results for statistics
    const results = await databaseService.getLessonResults(id);
    
    // Calculate statistics
    const totalAttempts = results.length;
    const averageScore = totalAttempts > 0 ? 
      results.reduce((sum, result) => sum + (result.score || 0), 0) / totalAttempts : 0;
    
    const completionRate = totalAttempts > 0 ? 
      results.filter(result => result.completed).length / totalAttempts * 100 : 0;
    
    const averageTime = totalAttempts > 0 ? 
      results.reduce((sum, result) => sum + (result.timeTaken || 0), 0) / totalAttempts : 0;
    
    const statistics = {
      lessonId: id,
      lessonTitle: lesson.title,
      totalAttempts,
      averageScore: Math.round(averageScore * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      averageTime: Math.round(averageTime),
      views: lesson.views || 0,
      lastUpdated: lesson.lastUpdated
    };
    
    res.json({
      success: true,
      statistics
    });
  });

  // Get lesson results (admin only)
  getLessonResults = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { limit = 100 } = req.query;
    
    const results = await databaseService.getLessonResults(id);
    
    // Limit results if specified
    const limitedResults = limit ? results.slice(0, parseInt(limit)) : results;
    
    res.json({
      success: true,
      results: limitedResults,
      total: results.length
    });
  });

  // Search lessons
  searchLessons = asyncHandler(async (req, res) => {
    const { q: search = '', page = 1, limit = 10, sort = 'order' } = req.query;
    
    const result = await databaseService.getLessons({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sort
    });
    
    res.json({
      success: true,
      ...result
    });
  });

  // Get lessons by subject
  getLessonsBySubject = asyncHandler(async (req, res) => {
    const { subject } = req.params;
    const { page = 1, limit = 10, sort = 'order' } = req.query;
    
    // This would need to be implemented in databaseService
    // For now, use the general getLessons method
    const result = await databaseService.getLessons({
      page: parseInt(page),
      limit: parseInt(limit),
      search: '', // Could filter by subject here
      sort
    });
    
    res.json({
      success: true,
      subject,
      ...result
    });
  });

  // Get lessons by grade
  getLessonsByGrade = asyncHandler(async (req, res) => {
    const { grade } = req.params;
    const { page = 1, limit = 10, sort = 'order' } = req.query;
    
    // This would need to be implemented in databaseService
    // For now, use the general getLessons method
    const result = await databaseService.getLessons({
      page: parseInt(page),
      limit: parseInt(limit),
      search: '', // Could filter by grade here
      sort
    });
    
    res.json({
      success: true,
      grade,
      ...result
    });
  });

  // Get featured lessons
  getFeaturedLessons = asyncHandler(async (req, res) => {
    const { limit = 5 } = req.query;
    
    // Get most popular lessons (by views)
    const result = await databaseService.getLessons({
      page: 1,
      limit: parseInt(limit),
      search: '',
      sort: 'popular'
    });
    
    res.json({
      success: true,
      featured: result.lessons
    });
  });

  // Get recent lessons
  getRecentLessons = asyncHandler(async (req, res) => {
    const { limit = 5 } = req.query;
    
    // Get newest lessons
    const result = await databaseService.getLessons({
      page: 1,
      limit: parseInt(limit),
      search: '',
      sort: 'newest'
    });
    
    res.json({
      success: true,
      recent: result.lessons
    });
  });

  // Duplicate lesson (admin only)
  duplicateLesson = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const originalLesson = await databaseService.getLessonById(id);
    
    // Create duplicate with modified title
    const duplicateData = {
      ...originalLesson,
      title: `${originalLesson.title} (Copy)`,
      id: undefined, // Let database generate new ID
      created: undefined, // Will be set by createLesson
      lastUpdated: undefined, // Will be set by createLesson
      views: 0 // Reset views for duplicate
    };
    
    const newLesson = await databaseService.createLesson(duplicateData);
    
    res.status(201).json({
      success: true,
      message: 'Lesson duplicated successfully',
      lesson: newLesson
    });
  });
}

module.exports = new LessonController();



---
File: /api/controllers/quizController.js
---

const databaseService = require('../services/databaseService');
const { asyncHandler } = require('../middleware/errorHandler');

class QuizController {
    // Get quiz data
    getQuiz = asyncHandler(async (req, res) => {
        const quizData = await databaseService.getQuizData();
        res.json(quizData);
    });
    
    // Submit quiz results
    submitQuiz = asyncHandler(async (req, res) => {
        const resultId = Date.now().toString();
        const studentId = req.session.studentId;
        
        if (!studentId) {
            return res.status(401).json({ error: 'Unauthorized: No student session found.' });
        }
        
        const newResult = {
            id: resultId,
            timestamp: new Date().toISOString(),
            student_id: studentId,
            lessonId: 'quiz_game',
            score: req.body.score,
            totalPoints: req.body.totalPoints,
            questions: req.body.answers,
            ipAddress: req.body.ipAddress
        };
        
        const savedResult = await databaseService.saveQuizResult(newResult);
        
        res.json({ 
            success: true, 
            resultId: savedResult.id 
        });
    });
    
    // Save quiz configuration (admin only)
    saveQuiz = asyncHandler(async (req, res) => {
        const quizData = req.body;
        await databaseService.saveQuizData(quizData);
        res.json({ success: true });
    });
}

module.exports = new QuizController();



---
File: /api/controllers/tagsController.js
---

const databaseService = require('../services/databaseService');
const { asyncHandler } = require('../middleware/errorHandler');

class TagsController {
    getAllTags = asyncHandler(async (req, res) => {
        const tags = await databaseService.getAllUniqueTags();
        res.json(tags);
    });
}

module.exports = new TagsController();



---
File: /api/middleware/auth.js
---

const sessionService = require('../services/sessionService');
const { ERROR_MESSAGES } = require('../config/constants');

// Middleware to check if user is authenticated as admin
const requireAdminAuth = (req, res, next) => {
  if (!sessionService.isAdminAuthenticated(req)) {
    return res.status(401).json({ 
      error: ERROR_MESSAGES.UNAUTHORIZED,
      message: 'Admin authentication required' 
    });
  }
  next();
};

// Middleware to check if user is authenticated as student
const requireStudentAuth = (req, res, next) => {
  if (!sessionService.isStudentAuthenticated(req)) {
    return res.status(401).json({ 
      error: ERROR_MESSAGES.UNAUTHORIZED,
      message: 'Student authentication required' 
    });
  }
  next();
};

// Middleware to check if student has required info
const requireStudentInfo = (req, res, next) => {
  const path = req.path;
  // Only check for lesson routes, not admin routes
  if (path.startsWith('/lesson/') && !path.includes('/admin/')) {
    if (!sessionService.hasStudentInfo(req)) {
      // Check if this is an HTML request or API request
      const isApiRequest = req.headers.accept && req.headers.accept.includes('application/json');

      if (isApiRequest) {
        return res.status(400).json({
          error: 'Student information required',
          message: 'Please provide student information first'
        });
      } else {
        // For HTML requests, redirect to home with error
        return res.redirect('/?error=no_student_info');
      }
    }
  }
  next();
};

// Middleware to check if user is authenticated (either admin or student)
const requireAuth = (req, res, next) => {
  if (!sessionService.isAdminAuthenticated(req) && !sessionService.isStudentAuthenticated(req)) {
    return res.status(401).json({ 
      error: ERROR_MESSAGES.UNAUTHORIZED,
      message: 'Authentication required' 
    });
  }
  next();
};

// Middleware to optionally authenticate (doesn't fail if not authenticated)
const optionalAuth = (req, res, next) => {
  // Just validate session integrity if session exists
  if (req.session) {
    sessionService.cleanupSession(req);
  }
  next();
};

// Middleware to check admin or student owner access
const requireAdminOrOwner = (req, res, next) => {
  const isAdmin = sessionService.isAdminAuthenticated(req);
  const isStudent = sessionService.isStudentAuthenticated(req);
  
  if (!isAdmin && !isStudent) {
    return res.status(401).json({ 
      error: ERROR_MESSAGES.UNAUTHORIZED,
      message: 'Authentication required' 
    });
  }

  // If student, check if they're accessing their own data
  if (isStudent && !isAdmin) {
    const studentId = req.session.studentId;
    const requestedStudentId = req.params.studentId || req.body.studentId || req.query.studentId;
    
    if (requestedStudentId && requestedStudentId !== studentId) {
      return res.status(403).json({ 
        error: ERROR_MESSAGES.FORBIDDEN,
        message: 'Access denied: can only access own data' 
      });
    }
  }

  next();
};

// Middleware to validate session integrity
const validateSession = (req, res, next) => {
  if (req.session) {
    if (!sessionService.validateSessionIntegrity(req)) {
      sessionService.clearSession(req);
      return res.status(401).json({ 
        error: ERROR_MESSAGES.SESSION_ERROR,
        message: 'Session integrity check failed' 
      });
    }
  }
  next();
};

// Middleware to add session info to request
const addSessionInfo = (req, res, next) => {
  req.sessionInfo = sessionService.getSessionData(req);
  next();
};

// Middleware to prevent access for already authenticated users
const requireNotAuthenticated = (req, res, next) => {
  // Check if user is already authenticated as admin
  if (sessionService.isAdminAuthenticated(req)) {
    // If trying to login as admin again, just redirect to admin dashboard
    if (req.path.includes('/admin/login')) {
      return res.json({
        success: true,
        message: 'Already logged in as admin',
        redirect: '/admin'
      });
    }
    // If trying to login as student while admin, clear admin session first
    sessionService.clearSession(req);
  }

  // Check if user is already authenticated as student
  if (sessionService.isStudentAuthenticated(req)) {
    // If trying to login as student again, allow re-authentication (clear existing session)
    if (req.path.includes('/student/login')) {
      sessionService.clearSession(req);
    }
    // If trying to login as admin while student, clear student session first
    else if (req.path.includes('/admin/login')) {
      sessionService.clearSession(req);
    }
  }

  next();
};

// Middleware to check device authentication for students
const requireDeviceAuth = (req, res, next) => {
  if (!sessionService.isStudentAuthenticated(req)) {
    return res.status(401).json({ 
      error: ERROR_MESSAGES.UNAUTHORIZED,
      message: 'Student authentication required' 
    });
  }

  // Check if device identifier is present in session or request
  const deviceId = req.headers['x-device-id'] || req.body.deviceId || req.query.deviceId;
  
  if (!deviceId) {
    return res.status(400).json({ 
      error: 'Device identification required',
      message: 'Device identifier missing' 
    });
  }

  // Add device info to request for further processing
  req.deviceId = deviceId;
  next();
};

// Middleware to log authentication events
const logAuthEvent = (eventType) => {
  return (req, res, next) => {
    const sessionInfo = sessionService.getSessionData(req);
    const userInfo = sessionInfo.isAuthenticated ? 'admin' : 
                    sessionInfo.studentId ? `student:${sessionInfo.studentId}` : 'anonymous';
    
    console.log(`🔐 Auth Event: ${eventType} - User: ${userInfo} - IP: ${req.ip} - UA: ${req.get('User-Agent')?.substring(0, 50)}...`);
    next();
  };
};

// Middleware to rate limit authentication attempts
const authRateLimit = (() => {
  const attempts = new Map();
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!attempts.has(key)) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }

    const record = attempts.get(key);
    
    // Reset if window has passed
    if (now - record.firstAttempt > WINDOW_MS) {
      attempts.set(key, { count: 1, firstAttempt: now });
      return next();
    }

    // Check if limit exceeded
    if (record.count >= MAX_ATTEMPTS) {
      return res.status(429).json({
        error: 'Too many authentication attempts',
        message: 'Please try again later',
        retryAfter: Math.ceil((WINDOW_MS - (now - record.firstAttempt)) / 1000)
      });
    }

    // Increment counter
    record.count++;
    next();
  };
})();

module.exports = {
  requireAdminAuth,
  requireStudentAuth,
  requireStudentInfo,
  requireAuth,
  optionalAuth,
  requireAdminOrOwner,
  validateSession,
  addSessionInfo,
  requireNotAuthenticated,
  requireDeviceAuth,
  logAuthEvent,
  authRateLimit
};



---
File: /api/middleware/cache.js
---

const cacheService = require('../services/cacheService');

// Main cache middleware
const cacheMiddleware = cacheService.cacheMiddleware();

// Specific cache middleware for lessons
const lessonCacheMiddleware = (req, res, next) => {
  // Store original res.json method
  const originalJson = res.json;
  
  // Override res.json to handle lesson-specific caching
  res.json = (data) => {
    const cacheResult = cacheService.handleCacheResponse(
      req, 
      res, 
      data, 
      `lesson:${req.params.id || 'list'}`,
      cacheService.getCacheMaxAge('/api/lessons/')
    );
    
    if (cacheResult.fromCache) {
      return; // 304 response already sent
    }
    
    // Call original json method with data
    return originalJson.call(res, cacheResult.data);
  };
  
  next();
};

// Cache middleware for statistics
const statisticsCacheMiddleware = (req, res, next) => {
  // Store original res.json method
  const originalJson = res.json;
  
  // Override res.json to handle statistics caching
  res.json = (data) => {
    const cacheResult = cacheService.handleCacheResponse(
      req, 
      res, 
      data, 
      `statistics:${req.path}`,
      cacheService.getCacheMaxAge('/api/lessons/statistics')
    );
    
    if (cacheResult.fromCache) {
      return; // 304 response already sent
    }
    
    // Call original json method with data
    return originalJson.call(res, cacheResult.data);
  };
  
  next();
};

// Cache middleware for results
const resultsCacheMiddleware = (req, res, next) => {
  // Store original res.json method
  const originalJson = res.json;
  
  // Override res.json to handle results caching
  res.json = (data) => {
    const cacheResult = cacheService.handleCacheResponse(
      req, 
      res, 
      data, 
      `results:${req.params.id || 'list'}`,
      cacheService.getCacheMaxAge('/api/results/')
    );
    
    if (cacheResult.fromCache) {
      return; // 304 response already sent
    }
    
    // Call original json method with data
    return originalJson.call(res, cacheResult.data);
  };
  
  next();
};

// No cache middleware (for dynamic content)
const noCacheMiddleware = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

// Short cache middleware (for frequently changing content)
const shortCacheMiddleware = (maxAge = 60) => {
  return (req, res, next) => {
    // Store original res.json method
    const originalJson = res.json;
    
    // Override res.json to handle short caching
    res.json = (data) => {
      const etag = cacheService.generateETag(data);
      
      if (cacheService.checkClientCache(req, etag)) {
        res.status(304).send();
        return;
      }
      
      cacheService.setCacheHeaders(res, etag, maxAge);
      return originalJson.call(res, data);
    };
    
    next();
  };
};

// Long cache middleware (for static content)
const longCacheMiddleware = (maxAge = 3600) => {
  return (req, res, next) => {
    // Store original res.json method
    const originalJson = res.json;
    
    // Override res.json to handle long caching
    res.json = (data) => {
      const etag = cacheService.generateETag(data);
      
      if (cacheService.checkClientCache(req, etag)) {
        res.status(304).send();
        return;
      }
      
      cacheService.setCacheHeaders(res, etag, maxAge);
      return originalJson.call(res, data);
    };
    
    next();
  };
};

// Conditional cache middleware
const conditionalCacheMiddleware = (condition, maxAge) => {
  return (req, res, next) => {
    if (condition(req)) {
      return cacheMiddleware(req, res, next);
    }
    return noCacheMiddleware(req, res, next);
  };
};

// Cache invalidation middleware
const cacheInvalidationMiddleware = (pattern) => {
  return (req, res, next) => {
    // Store original res.json method
    const originalJson = res.json;
    
    // Override res.json to invalidate cache after successful response
    res.json = (data) => {
      const result = originalJson.call(res, data);
      
      // Invalidate cache if response was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.invalidateCache(pattern);
      }
      
      return result;
    };
    
    next();
  };
};

// Cache warming middleware (for important routes)
const cacheWarmingMiddleware = (routes) => {
  return async (req, res, next) => {
    // Warm cache in background (don't block request)
    setImmediate(async () => {
      try {
        await cacheService.warmCache(routes);
      } catch (error) {
        console.error('Cache warming error:', error);
      }
    });
    
    next();
  };
};

// Cache monitoring middleware
const cacheMonitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Store original res.json method
  const originalJson = res.json;
  
  // Override res.json to log cache performance
  res.json = (data) => {
    const duration = Date.now() - startTime;
    const cacheStatus = res.getHeader('ETag') ? 'HIT' : 'MISS';
    
    console.log(`📊 Cache ${cacheStatus}: ${req.method} ${req.path} - ${duration}ms`);
    
    return originalJson.call(res, data);
  };
  
  next();
};

// Cache health check middleware
const cacheHealthMiddleware = (req, res, next) => {
  const cacheStats = cacheService.getCacheStats();
  const memoryUsage = cacheService.getMemoryUsage();
  
  // Add cache health info to response headers (for monitoring)
  res.setHeader('X-Cache-Enabled', cacheStats.enabled);
  res.setHeader('X-Memory-Usage', `${memoryUsage.heapUsed}MB`);
  
  next();
};

module.exports = {
  cacheMiddleware,
  lessonCacheMiddleware,
  statisticsCacheMiddleware,
  resultsCacheMiddleware,
  noCacheMiddleware,
  shortCacheMiddleware,
  longCacheMiddleware,
  conditionalCacheMiddleware,
  cacheInvalidationMiddleware,
  cacheWarmingMiddleware,
  cacheMonitoringMiddleware,
  cacheHealthMiddleware
};



---
File: /api/middleware/errorHandler.js
---

const { ERROR_MESSAGES, APP_CONFIG } = require('../config/constants');
const cacheService = require('../services/cacheService');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = ERROR_MESSAGES.FORBIDDEN) {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = ERROR_MESSAGES.NOT_FOUND) {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

class DatabaseError extends AppError {
  constructor(message = ERROR_MESSAGES.DATABASE_ERROR) {
    super(message, 500, 'DATABASE_ERROR');
  }
}

// Error logging utility
const logError = (error, req = null) => {
  const timestamp = new Date().toISOString();
  const requestInfo = req ? {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    sessionId: req.sessionID
  } : {};

  console.error('🚨 Error occurred:', {
    timestamp,
    message: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    code: error.code,
    request: requestInfo
  });
};

// Main error handler middleware
const errorHandler = (error, req, res, next) => {
  // Clear any cache headers for error responses
  cacheService.clearCacheHeaders(res);

  // Log the error
  logError(error, req);

  // Handle different types of errors
  let statusCode = 500;
  let message = ERROR_MESSAGES.INTERNAL_ERROR;
  let code = 'INTERNAL_ERROR';
  let details = null;

  if (error.isOperational) {
    // Operational errors (known errors)
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
    details = error.details;
  } else if (error.name === 'ValidationError') {
    // Mongoose/validation errors
    statusCode = 400;
    message = ERROR_MESSAGES.VALIDATION_ERROR;
    code = 'VALIDATION_ERROR';
    details = Object.values(error.errors).map(err => err.message);
  } else if (error.name === 'CastError') {
    // Database cast errors (invalid IDs)
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  } else if (error.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 400;
    message = 'Duplicate entry';
    code = 'DUPLICATE_ERROR';
  } else if (error.name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    // JWT expiration
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (error.code === 'ECONNREFUSED') {
    // Database connection errors
    statusCode = 503;
    message = 'Service temporarily unavailable';
    code = 'SERVICE_UNAVAILABLE';
  }

  // Prepare error response
  const errorResponse = {
    error: message,
    code: code,
    timestamp: new Date().toISOString()
  };

  // Add details in development mode or for validation errors
  if (APP_CONFIG.NODE_ENV === 'development' || details) {
    errorResponse.details = details;
  }

  // Add stack trace in development mode
  if (APP_CONFIG.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// 404 handler for unmatched routes
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database error handler
const handleDatabaseError = (error) => {
  if (error.code === 'PGRST116') {
    return new NotFoundError('Resource not found');
  }
  
  if (error.code === '23505') {
    return new ValidationError('Duplicate entry', ['This record already exists']);
  }
  
  if (error.code === '23503') {
    return new ValidationError('Foreign key constraint violation', ['Referenced record does not exist']);
  }
  
  if (error.code === '23502') {
    return new ValidationError('Required field missing', ['A required field is missing']);
  }

  return new DatabaseError(`Database operation failed: ${error.message}`);
};

// Rate limiting error handler
const rateLimitHandler = (req, res, next) => {
  const error = new AppError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  next(error);
};

// File upload error handler
const uploadErrorHandler = (error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    const sizeError = new ValidationError('File too large', ['File size exceeds the maximum limit']);
    return next(sizeError);
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    const countError = new ValidationError('Too many files', ['Number of files exceeds the limit']);
    return next(countError);
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    const fieldError = new ValidationError('Unexpected file field', ['File uploaded to unexpected field']);
    return next(fieldError);
  }

  next(error);
};

// Session error handler
const sessionErrorHandler = (error, req, res, next) => {
  if (error.code === 'SESSION_ERROR') {
    // Clear the problematic session
    if (req.session) {
      req.session.destroy(() => {
        const sessionError = new AuthenticationError('Session error, please login again');
        next(sessionError);
      });
    } else {
      const sessionError = new AuthenticationError('Session error, please login again');
      next(sessionError);
    }
  } else {
    next(error);
  }
};

// Global uncaught exception handler
const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    console.error('Shutting down...');
    process.exit(1);
  });
};

// Global unhandled rejection handler
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    console.error('Shutting down...');
    process.exit(1);
  });
};

// Error monitoring middleware
const errorMonitoring = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    if (statusCode >= 400) {
      console.log(`⚠️  Error Response: ${req.method} ${req.path} - ${statusCode} - ${duration}ms`);
    }
  });
  
  next();
};

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  
  // Error handlers
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleDatabaseError,
  rateLimitHandler,
  uploadErrorHandler,
  sessionErrorHandler,
  errorMonitoring,
  
  // Global handlers
  handleUncaughtException,
  handleUnhandledRejection,
  
  // Utilities
  logError
};



---
File: /api/middleware/validation.js
---

const { ERROR_MESSAGES } = require('../config/constants');

// Validation helper functions
const isValidPhoneNumber = (phone) => {
  // Vietnamese phone number validation
  const phoneRegex = /^(0|\+84)[3-9]\d{8}$/;
  return phoneRegex.test(phone);
};

const isValidPassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6;
};

const isValidName = (name) => {
  // At least 2 characters, only letters and spaces
  const nameRegex = /^[a-zA-ZÀ-ỹ\s]{2,50}$/;
  return nameRegex.test(name);
};

const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidId = (id) => {
  return id && (typeof id === 'string' || typeof id === 'number') && id.toString().length > 0;
};

// Validation middleware for student registration
const validateStudentRegistration = (req, res, next) => {
  const { full_name, phone_number, password, date_of_birth } = req.body;
  const errors = [];

  if (!full_name || !isValidName(full_name)) {
    errors.push('Họ tên không hợp lệ (2-50 ký tự, chỉ chữ cái và khoảng trắng)');
  }

  if (!phone_number || !isValidPhoneNumber(phone_number)) {
    errors.push('Số điện thoại không hợp lệ');
  }

  if (!password || !isValidPassword(password)) {
    errors.push('Mật khẩu phải có ít nhất 6 ký tự');
  }

  if (date_of_birth && !isValidDate(date_of_birth)) {
    errors.push('Ngày sinh không hợp lệ');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: ERROR_MESSAGES.VALIDATION_ERROR,
      message: 'Dữ liệu đầu vào không hợp lệ',
      details: errors
    });
  }

  next();
};

// Validation middleware for student login
const validateStudentLogin = (req, res, next) => {
  const { phone_number, password } = req.body;
  const errors = [];

  if (!phone_number || !isValidPhoneNumber(phone_number)) {
    errors.push('Số điện thoại không hợp lệ');
  }

  if (!password) {
    errors.push('Mật khẩu không được để trống');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: ERROR_MESSAGES.VALIDATION_ERROR,
      message: 'Dữ liệu đăng nhập không hợp lệ',
      details: errors
    });
  }

  next();
};

// Validation middleware for admin login
const validateAdminLogin = (req, res, next) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username || username.trim().length === 0) {
    errors.push('Tên đăng nhập không được để trống');
  }

  if (!password || password.length === 0) {
    errors.push('Mật khẩu không được để trống');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: ERROR_MESSAGES.VALIDATION_ERROR,
      message: 'Dữ liệu đăng nhập không hợp lệ',
      details: errors
    });
  }

  next();
};

// Validation middleware for lesson creation/update
const validateLesson = (req, res, next) => {
  const { title, content, subject, grade } = req.body;
  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push('Tiêu đề bài học không được để trống');
  }

  if (!content || content.trim().length === 0) {
    errors.push('Nội dung bài học không được để trống');
  }

  if (subject && typeof subject !== 'string') {
    errors.push('Môn học phải là chuỗi ký tự');
  }

  if (grade && (typeof grade !== 'string' && typeof grade !== 'number')) {
    errors.push('Lớp học không hợp lệ');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: ERROR_MESSAGES.VALIDATION_ERROR,
      message: 'Dữ liệu bài học không hợp lệ',
      details: errors
    });
  }

  next();
};

// Validation middleware for result submission
const validateResult = (req, res, next) => {
  const { lessonId, answers, timeTaken, studentInfo } = req.body;
  const errors = [];

  if (!isValidId(lessonId)) {
    errors.push('ID bài học không hợp lệ');
  }

  if (!answers || !Array.isArray(answers)) {
    errors.push('Câu trả lời phải là một mảng');
  }

  if (typeof timeTaken !== 'number' || timeTaken < 0) {
    errors.push('Thời gian làm bài không hợp lệ');
  }

  if (!studentInfo || typeof studentInfo !== 'object') {
    errors.push('Thông tin học sinh không hợp lệ');
  } else {
    if (!studentInfo.name || !isValidName(studentInfo.name)) {
      errors.push('Tên học sinh không hợp lệ');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: ERROR_MESSAGES.VALIDATION_ERROR,
      message: 'Dữ liệu kết quả không hợp lệ',
      details: errors
    });
  }

  next();
};

// Validation middleware for pagination parameters
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  
  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: 'Số trang phải là số nguyên dương'
      });
    }
    req.query.page = pageNum;
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: 'Giới hạn phải là số từ 1 đến 100'
      });
    }
    req.query.limit = limitNum;
  }

  next();
};

// Validation middleware for ID parameters
const validateIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!isValidId(id)) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: `${paramName} không hợp lệ`
      });
    }

    next();
  };
};

// Validation middleware for file uploads
const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      error: ERROR_MESSAGES.VALIDATION_ERROR,
      message: 'Không có file được tải lên'
    });
  }

  next();
};

// Validation middleware for search parameters
const validateSearch = (req, res, next) => {
  const { search, sort } = req.query;
  
  if (search !== undefined && typeof search !== 'string') {
    return res.status(400).json({
      error: ERROR_MESSAGES.VALIDATION_ERROR,
      message: 'Từ khóa tìm kiếm phải là chuỗi ký tự'
    });
  }

  if (sort !== undefined) {
    const validSorts = ['newest', 'oldest', 'az', 'za', 'newest-changed', 'popular', 'order'];
    if (!validSorts.includes(sort)) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: 'Kiểu sắp xếp không hợp lệ'
      });
    }
  }

  next();
};

// Generic validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      
      for (const rule of rules) {
        if (!rule.validator(value)) {
          errors.push(rule.message);
          break;
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: 'Dữ liệu không hợp lệ',
        details: errors
      });
    }

    next();
  };
};

module.exports = {
  validateStudentRegistration,
  validateStudentLogin,
  validateAdminLogin,
  validateLesson,
  validateResult,
  validatePagination,
  validateIdParam,
  validateFileUpload,
  validateSearch,
  validate,
  // Export validation helpers for reuse
  isValidPhoneNumber,
  isValidPassword,
  isValidName,
  isValidDate,
  isValidEmail,
  isValidId
};



---
File: /api/routes/admin.js
---

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



---
File: /api/routes/auth.js
---

const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../controllers/authController');

// Import middleware
const { 
  validateAdminLogin, 
  validateStudentLogin, 
  validateStudentRegistration 
} = require('../middleware/validation');
const { 
  requireAdminAuth, 
  requireStudentAuth, 
  requireNotAuthenticated,
  authRateLimit,
  logAuthEvent
} = require('../middleware/auth');
const { noCacheMiddleware } = require('../middleware/cache');

// Apply no-cache middleware to all auth routes
router.use(noCacheMiddleware);

// Admin authentication routes
router.post('/admin/login', 
  authRateLimit,
  logAuthEvent('admin_login_attempt'),
  requireNotAuthenticated,
  validateAdminLogin,
  authController.adminLogin
);

router.post('/admin/logout',
  requireAdminAuth,
  logAuthEvent('admin_logout'),
  authController.logout
);

router.get('/admin/check',
  authController.checkAdminAuth
);

// Student authentication routes
router.post('/student/login',
  authRateLimit,
  logAuthEvent('student_login_attempt'),
  requireNotAuthenticated,
  validateStudentLogin,
  authController.studentLogin
);

router.post('/student/register',
  authRateLimit,
  logAuthEvent('student_register_attempt'),
  requireNotAuthenticated,
  validateStudentRegistration,
  authController.studentRegister
);

router.post('/student/logout',
  requireStudentAuth,
  logAuthEvent('student_logout'),
  authController.logout
);

router.get('/student/check',
  authController.checkStudentAuth
);

// Alias for backward compatibility
router.get('/check-student-auth',
  authController.checkStudentAuth
);

// General authentication routes
router.post('/logout',
  logAuthEvent('logout'),
  authController.logout
);

router.get('/check',
  authController.checkAuth
);

router.get('/session',
  authController.getSessionInfo
);

router.post('/refresh',
  authController.refreshSession
);

// Password management routes
router.post('/change-password',
  requireStudentAuth,
  logAuthEvent('password_change_attempt'),
  authController.changePassword
);

// Device management routes
router.post('/validate-device',
  requireStudentAuth,
  authController.validateDevice
);

module.exports = router;



---
File: /api/routes/explain.js
---

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



---
File: /api/routes/lessons.js
---

const express = require('express');
const router = express.Router();

// Import controllers
const lessonController = require('../controllers/lessonController');

// Import middleware
const { 
  validateIdParam,
  validatePagination,
  validateSearch,
  validateLesson 
} = require('../middleware/validation');
const { 
  requireAdminAuth,
  optionalAuth 
} = require('../middleware/auth');
const { 
  lessonCacheMiddleware, 
  statisticsCacheMiddleware,
  noCacheMiddleware,
  shortCacheMiddleware 
} = require('../middleware/cache');

// Public lesson routes (with optional authentication)
router.get('/',
  optionalAuth,
  validatePagination,
  validateSearch,
  lessonCacheMiddleware,
  lessonController.getAllLessons
);

router.get('/search',
  optionalAuth,
  validatePagination,
  validateSearch,
  lessonCacheMiddleware,
  lessonController.searchLessons
);

router.get('/featured',
  optionalAuth,
  validatePagination,
  lessonCacheMiddleware,
  lessonController.getFeaturedLessons
);

router.get('/recent',
  optionalAuth,
  validatePagination,
  lessonCacheMiddleware,
  lessonController.getRecentLessons
);

router.get('/subject/:subject',
  optionalAuth,
  validatePagination,
  lessonCacheMiddleware,
  lessonController.getLessonsBySubject
);

router.get('/grade/:grade',
  optionalAuth,
  validatePagination,
  lessonCacheMiddleware,
  lessonController.getLessonsByGrade
);

router.get('/:id',
  optionalAuth,
  validateIdParam('id'),
  lessonCacheMiddleware,
  lessonController.getLessonById
);

// Admin-only lesson management routes
router.post('/',
  requireAdminAuth,
  validateLesson,
  noCacheMiddleware,
  lessonController.createLesson
);

router.put('/:id',
  requireAdminAuth,
  validateIdParam('id'),
  validateLesson,
  noCacheMiddleware,
  lessonController.updateLesson
);

router.delete('/:id',
  requireAdminAuth,
  validateIdParam('id'),
  noCacheMiddleware,
  lessonController.deleteLesson
);

router.post('/reorder',
  requireAdminAuth,
  noCacheMiddleware,
  lessonController.updateLessonOrder
);

router.post('/:id/duplicate',
  requireAdminAuth,
  validateIdParam('id'),
  noCacheMiddleware,
  lessonController.duplicateLesson
);

// Lesson statistics and results (admin only)
router.get('/:id/statistics',
  requireAdminAuth,
  validateIdParam('id'),
  statisticsCacheMiddleware,
  lessonController.getLessonStatistics
);

router.get('/:id/results',
  requireAdminAuth,
  validateIdParam('id'),
  validatePagination,
  shortCacheMiddleware(300), // 5 minutes cache
  lessonController.getLessonResults
);

module.exports = router;



---
File: /api/routes/students.js
---

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

// Student profile routes (admin or owner access)
router.get('/:studentId/profile',
  requireAdminOrOwner,
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
  requireAdminOrOwner,
  validateIdParam('studentId'),
  shortCacheMiddleware(300), // 5 minutes cache
  studentController.getStudentStatistics
);

router.get('/:studentId/activity',
  requireAdminOrOwner,
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



---
File: /api/routes/uploads.js
---

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import controllers
const uploadController = require('../controllers/uploadController');

// Import middleware
const { 
  validateFileUpload,
  validateIdParam 
} = require('../middleware/validation');
const { 
  requireAdminAuth 
} = require('../middleware/auth');
const { 
  noCacheMiddleware,
  shortCacheMiddleware 
} = require('../middleware/cache');
const { uploadErrorHandler } = require('../middleware/errorHandler');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Maximum 10 files for bulk upload
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
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

// Apply admin authentication to all upload routes
router.use(requireAdminAuth);
router.use(noCacheMiddleware);

// Image upload routes
router.post('/image',
  upload.single('image'),
  uploadErrorHandler,
  validateFileUpload,
  uploadController.uploadLessonImage
);

router.post('/images/bulk',
  upload.array('images', 10),
  uploadErrorHandler,
  validateFileUpload,
  uploadController.bulkUploadImages
);

router.delete('/image/:filename',
  validateIdParam('filename'),
  uploadController.deleteImage
);

// Document upload and processing routes
router.post('/document',
  upload.single('document'),
  uploadErrorHandler,
  validateFileUpload,
  uploadController.uploadDocument
);

// File validation route
router.post('/validate',
  upload.single('file'),
  uploadErrorHandler,
  uploadController.validateFile
);

// Configuration and utility routes
router.get('/config',
  shortCacheMiddleware(3600), // 1 hour cache
  uploadController.getUploadConfig
);

router.get('/storage/stats',
  shortCacheMiddleware(300), // 5 minutes cache
  uploadController.getStorageStats
);

// AI service testing route
router.post('/test-ai',
  uploadController.testAIService
);

module.exports = router;



---
File: /api/services/aiService.js
---

const fetch = require('node-fetch');
const { API_ENDPOINTS, APP_CONFIG } = require('../config/constants');

class AIService {
  constructor() {
    this.apiKey = APP_CONFIG.GEMINI_API_KEY;
    this.apiUrl = API_ENDPOINTS.GEMINI_URL;
  }

  // Format document content using AI
  async formatDocumentWithAI(text) {
    const prompt = `Bạn là một trợ lý AI chuyên định dạng nội dung bài học cho hệ thống giáo dục.

NHIỆM VỤ: Chuyển đổi văn bản sau thành định dạng bài học chuẩn với các câu hỏi trắc nghiệm.

YÊU CẦU ĐỊNH DẠNG:
1. Mỗi câu hỏi phải bắt đầu bằng "Câu X:" (X là số thứ tự)
2. Nếu câu hỏi có nhiều điểm, thêm "[X pts]" trên dòng mới sau câu hỏi
3. Với câu hỏi trắc nghiệm ABCD:
   - Mỗi lựa chọn trên một dòng riêng: A. [nội dung]
   - Đánh dấu đáp án đúng bằng dấu * ở đầu: *A. [đáp án đúng]
   - Luôn có đủ 4 lựa chọn A, B, C, D
4. Với câu hỏi Đúng/Sai nhiều ý:
   - Mỗi ý trên một dòng: a) [nội dung]
   - Đánh dấu ý đúng bằng dấu *: *a) [ý đúng]
5. Với câu hỏi điền số:
   - Viết "Answer: [số]" trên dòng mới sau câu hỏi
6. Giữa các câu hỏi cách nhau một dòng trống

QUY TẮC CHUYỂN ĐỔI:
- Nếu văn bản có sẵn câu hỏi, giữ nguyên và định dạng lại cho đúng chuẩn
- Nếu văn bản là bài giảng/lý thuyết, tạo 5-10 câu hỏi trắc nghiệm dựa trên nội dung
- Ưu tiên câu hỏi ABCD (70%), Đúng/Sai nhiều ý (20%), điền số (10%)
- Câu hỏi phải rõ ràng, súc tích, phù hợp với nội dung
- Các lựa chọn phải hợp lý, tránh quá dễ hoặc quá khó

VÍ DỤ OUTPUT:
Câu 1: Phương trình bậc hai ax² + bx + c = 0 có nghiệm khi nào?
A. Δ > 0
*B. Δ ≥ 0
C. Δ < 0
D. Δ ≤ 0

Câu 2: Các phát biểu sau về tam giác vuông, phát biểu nào đúng?
[2 pts]
*a) Tổng hai góc nhọn bằng 90°
b) Cạnh huyền là cạnh nhỏ nhất
*c) Định lý Pytago: a² + b² = c²
d) Có thể có hai góc vuông

Câu 3: Tính diện tích hình tròn có bán kính 5cm (lấy π = 3.14)
Answer: 78.5

VĂN BẢN CẦN CHUYỂN ĐỔI:
${text}

OUTPUT (chỉ trả về nội dung đã định dạng, không giải thích thêm):`;

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Gemini API error:', errorData);
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('Invalid AI response format:', data);
        throw new Error('Invalid AI response format');
      }

      let formattedContent = data.candidates[0].content.parts[0].text;

      // Clean up the response
      formattedContent = this.cleanupAIResponse(formattedContent);

      // Validate that we have at least one question
      if (!formattedContent.includes('Câu 1:')) {
        console.warn('AI response does not contain expected question format');
        throw new Error('AI không tạo được câu hỏi từ nội dung');
      }

      return formattedContent;

    } catch (error) {
      console.error('AI formatting error:', error);
      throw new Error('Không thể kết nối với AI để định dạng nội dung');
    }
  }

  // Clean up AI response
  cleanupAIResponse(content) {
    // Remove any markdown code blocks if present
    content = content.replace(/```[a-z]*\n/g, '');
    content = content.replace(/```/g, '');

    // Ensure proper line breaks
    content = content.replace(/\r\n/g, '\n');

    // Trim whitespace
    content = content.trim();

    return content;
  }

  // Generate lesson summary using AI
  async generateLessonSummary(lessonContent) {
    const prompt = `Tạo tóm tắt ngắn gọn (2-3 câu) cho bài học sau:

${lessonContent}

Tóm tắt phải:
- Ngắn gọn, súc tích
- Nêu được nội dung chính
- Phù hợp với học sinh`;

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.5,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 200
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid AI response format');
      }

      return this.cleanupAIResponse(data.candidates[0].content.parts[0].text);

    } catch (error) {
      console.error('Error generating lesson summary:', error);
      throw new Error('Không thể tạo tóm tắt bài học');
    }
  }

  // Generate question explanations using AI
  async generateQuestionExplanation(question, correctAnswer, studentAnswer) {
    const prompt = `Giải thích tại sao đáp án đúng cho câu hỏi sau:

Câu hỏi: ${question}
Đáp án đúng: ${correctAnswer}
Đáp án học sinh chọn: ${studentAnswer}

Yêu cầu:
- Giải thích ngắn gọn, dễ hiểu
- Nêu rõ tại sao đáp án đúng là chính xác
- Nếu học sinh chọn sai, giải thích tại sao đáp án đó không đúng
- Tối đa 2-3 câu`;

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 300
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid AI response format');
      }

      return this.cleanupAIResponse(data.candidates[0].content.parts[0].text);

    } catch (error) {
      console.error('Error generating question explanation:', error);
      throw new Error('Không thể tạo giải thích câu hỏi');
    }
  }

  // Validate AI service configuration
  validateConfiguration() {
    const errors = [];

    if (!this.apiKey) {
      errors.push('GEMINI_API_KEY is not configured');
    }

    if (!this.apiUrl) {
      errors.push('Gemini API URL is not configured');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Test AI service connectivity
  async testConnection() {
    try {
      const testPrompt = "Trả lời: OK";
      
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: testPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format');
      }

      return {
        success: true,
        message: 'AI service is working correctly'
      };

    } catch (error) {
      return {
        success: false,
        message: `AI service test failed: ${error.message}`
      };
    }
  }
}

module.exports = new AIService();



---
File: /api/services/authService.js
---

const bcrypt = require('bcrypt');
const { ADMIN_CREDENTIALS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../config/constants');
const databaseService = require('./databaseService');

class AuthService {
  // Admin authentication
  async authenticateAdmin(username, password) {
    if (!username || !password) {
      throw new Error(ERROR_MESSAGES.VALIDATION_ERROR);
    }

    const credentialsMatch = username === ADMIN_CREDENTIALS.username &&
      await bcrypt.compare(password, ADMIN_CREDENTIALS.password);

    if (!credentialsMatch) {
      throw new Error('Invalid credentials');
    }

    return { success: true, message: SUCCESS_MESSAGES.LOGIN_SUCCESS };
  }

  // Student authentication
  async authenticateStudent(phoneNumber, password, deviceIdentifier) {
    if (!phoneNumber || !password) {
      throw new Error('Missing phone number or password');
    }

    if (!deviceIdentifier) {
      throw new Error('Không thể xác định thiết bị. Vui lòng thử lại.');
    }

    // Get student from database
    const student = await databaseService.getStudentByPhone(phoneNumber);

    if (!student) {
      throw new Error('Tài khoản không tồn tại.');
    }

    if (!student.is_approved) {
      throw new Error('Tài khoản của bạn đang chờ được giáo viên phê duyệt.');
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, student.password_hash);
    if (!passwordMatch) {
      throw new Error('Mật khẩu không chính xác.');
    }

    // Check device ID/fingerprint if already set
    const approvedDevice = student.approved_device_id || student.approved_device_fingerprint;
    const isDeviceCheckEnabled = process.env.STRICT_DEVICE_CHECK !== 'false';

    if (approvedDevice && approvedDevice !== deviceIdentifier && isDeviceCheckEnabled) {
      console.log(`🔒 Device mismatch for student ${student.id}: stored=${approvedDevice.substring(0,8)}..., provided=${deviceIdentifier.substring(0,8)}...`);
      throw new Error('Bạn chỉ có thể đăng nhập từ thiết bị đã đăng ký trước đó. Vui lòng liên hệ giáo viên để thay đổi thiết bị.');
    } else if (approvedDevice && approvedDevice !== deviceIdentifier) {
      console.log(`⚠️  Device mismatch detected but allowing login (strict check disabled): student=${student.id}`);
    }

    return {
      success: true,
      student: {
        id: student.id,
        name: student.full_name
      },
      deviceIdentifier,
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS
    };
  }

  // Student registration
  async registerStudent(studentData) {
    const { full_name, date_of_birth, phone_number, password } = studentData;

    if (!full_name || !phone_number || !password) {
      throw new Error('Missing required fields');
    }

    // Check if phone number is already registered
    const existingUser = await databaseService.getStudentByPhone(phone_number);
    if (existingUser) {
      throw new Error('Số điện thoại này đã được đăng ký. Vui lòng sử dụng số điện thoại khác.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new student record
    const newStudent = await databaseService.createStudent({
      full_name,
      phone_number,
      date_of_birth,
      password_hash: hashedPassword
    });

    return {
      success: true,
      message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
      studentId: newStudent.id
    };
  }

  // Password hashing utility
  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  // Password verification utility
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Generate secure session data
  generateSessionData(user, type = 'student') {
    const sessionData = {
      timestamp: new Date().toISOString()
    };

    if (type === 'admin') {
      sessionData.isAuthenticated = true;
    } else if (type === 'student') {
      sessionData.studentId = user.id;
      sessionData.studentName = user.name;
    }

    return sessionData;
  }

  // Validate session data
  validateSession(session, type = 'student') {
    if (type === 'admin') {
      return session && session.isAuthenticated === true;
    } else if (type === 'student') {
      return session && session.studentId && session.studentName;
    }
    return false;
  }
}

module.exports = new AuthService();



---
File: /api/services/cacheService.js
---

const crypto = require('crypto');
const { CACHE_CONFIG } = require('../config/constants');

class CacheService {
  // Generate ETag for data
  generateETag(data) {
    if (!data) {
      return null;
    }
    
    // Use JSON.stringify for consistent serialization of JS objects/arrays
    // Sort keys for objects to ensure consistent hashing regardless of key order
    const dataString = JSON.stringify(data, (key, value) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.keys(value)
          .sort()
          .reduce((sorted, key) => {
            sorted[key] = value[key];
            return sorted;
          }, {});
      }
      return value;
    });
    
    // Create a SHA1 hash - strong enough for ETag, reasonably fast
    return crypto.createHash('sha1').update(dataString).digest('hex');
  }

  // Set cache headers on response
  setCacheHeaders(res, etag, maxAgeSeconds = CACHE_CONFIG.DEFAULT_MAX_AGE) {
    if (etag) {
      // ETags should be quoted as per HTTP spec
      res.setHeader('ETag', `"${etag}"`);
    }
    
    // Cache-Control: public (allow proxies), max-age (duration), must-revalidate (check ETag before using stale cache)
    res.setHeader('Cache-Control', `public, max-age=${maxAgeSeconds}, must-revalidate`);
    
    // Optionally add Last-Modified if you have a relevant timestamp for the data
    // res.setHeader('Last-Modified', new Date(data.lastUpdated).toUTCString());
  }

  // Check if request should be cached
  shouldCache(req) {
    const path = req.path || req.originalUrl || '';
    
    // Don't cache admin routes or authenticated routes that need fresh data
    return !path.includes('/admin/') && 
           !path.includes('/api/admin/') &&
           !path.includes('/api/history') &&
           req.method === 'GET'; // Only cache GET requests
  }

  // Check if client has valid cache
  checkClientCache(req, etag) {
    const clientETag = req.headers['if-none-match'];
    return clientETag && clientETag === `"${etag}"`;
  }

  // Handle cache response
  handleCacheResponse(req, res, data, cacheKey = null, maxAge = null) {
    if (!this.shouldCache(req)) {
      return { fromCache: false, data };
    }

    const etag = this.generateETag(data);
    const cacheMaxAge = maxAge || this.getCacheMaxAge(req.path);

    if (this.checkClientCache(req, etag)) {
      console.log(`Cache hit for ${req.path}`);
      res.status(304).send();
      return { fromCache: true, data: null };
    }

    console.log(`Cache miss for ${req.path}`);
    this.setCacheHeaders(res, etag, cacheMaxAge);
    return { fromCache: false, data };
  }

  // Get appropriate cache max age based on route
  getCacheMaxAge(path) {
    if (path.includes('/api/lessons/') && path.includes('/statistics')) {
      return CACHE_CONFIG.STATISTICS_CACHE_MAX_AGE;
    }
    
    if (path.includes('/api/lessons/')) {
      return CACHE_CONFIG.LESSON_CACHE_MAX_AGE;
    }
    
    if (path.includes('/api/results/')) {
      return CACHE_CONFIG.RESULTS_CACHE_MAX_AGE;
    }
    
    return CACHE_CONFIG.DEFAULT_MAX_AGE;
  }

  // Clear cache headers (for error responses)
  clearCacheHeaders(res) {
    res.removeHeader('ETag');
    res.removeHeader('Cache-Control');
    res.removeHeader('Last-Modified');
  }

  // Create cache key for complex data
  createCacheKey(prefix, ...parts) {
    const keyParts = [prefix, ...parts.map(part => 
      typeof part === 'object' ? JSON.stringify(part) : String(part)
    )];
    return keyParts.join(':');
  }

  // Validate cache configuration
  validateCacheConfig() {
    const errors = [];

    if (typeof CACHE_CONFIG.DEFAULT_MAX_AGE !== 'number' || CACHE_CONFIG.DEFAULT_MAX_AGE < 0) {
      errors.push('Invalid DEFAULT_MAX_AGE configuration');
    }

    if (typeof CACHE_CONFIG.LESSON_CACHE_MAX_AGE !== 'number' || CACHE_CONFIG.LESSON_CACHE_MAX_AGE < 0) {
      errors.push('Invalid LESSON_CACHE_MAX_AGE configuration');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get cache statistics (for monitoring)
  getCacheStats() {
    // This would be implemented with a proper cache store
    // For now, return basic info
    return {
      enabled: true,
      defaultMaxAge: CACHE_CONFIG.DEFAULT_MAX_AGE,
      lessonMaxAge: CACHE_CONFIG.LESSON_CACHE_MAX_AGE,
      statisticsMaxAge: CACHE_CONFIG.STATISTICS_CACHE_MAX_AGE,
      resultsMaxAge: CACHE_CONFIG.RESULTS_CACHE_MAX_AGE
    };
  }

  // Middleware for automatic cache handling
  cacheMiddleware() {
    return (req, res, next) => {
      // Store original res.json method
      const originalJson = res.json;
      
      // Override res.json to handle caching
      res.json = (data) => {
        const cacheResult = this.handleCacheResponse(req, res, data);
        
        if (cacheResult.fromCache) {
          return; // 304 response already sent
        }
        
        // Call original json method with data
        return originalJson.call(res, cacheResult.data);
      };
      
      next();
    };
  }

  // Cache warming utilities
  async warmCache(routes = []) {
    // This would be implemented to pre-populate cache for important routes
    console.log('Cache warming not implemented yet');
    return { warmed: 0, failed: 0 };
  }

  // Cache invalidation utilities
  invalidateCache(pattern) {
    // This would be implemented with a proper cache store
    console.log(`Cache invalidation for pattern: ${pattern}`);
    return true;
  }

  // Memory usage monitoring
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024) // MB
    };
  }
}

module.exports = new CacheService();



---
File: /api/services/databaseService.js
---

const { supabase, supabaseAdmin } = require('../config/database');

class DatabaseService {
  // Lesson operations
  async getLessons(options = {}) {
    const { page = 1, limit = 10, search = '', sort = 'order' } = options;
    const startIndex = (page - 1) * limit;

    // Determine sorting parameters
    let orderAscending = true;
    let orderColumn = 'order';
    switch (sort) {
      case 'newest': orderColumn = 'created'; orderAscending = false; break;
      case 'oldest': orderColumn = 'created'; orderAscending = true; break;
      case 'az': orderColumn = 'title'; orderAscending = true; break;
      case 'za': orderColumn = 'title'; orderAscending = false; break;
      case 'newest-changed': orderColumn = 'lastUpdated'; orderAscending = false; break;
      case 'popular': orderColumn = 'views'; orderAscending = false; break;
      case 'order': orderColumn = 'order'; orderAscending = true; break;
    }

    let lessons = [];
    let total = 0;

    if (search) {
      // Use RPC for search
      let rpcQuery = supabase
        .rpc('search_lessons', { search_term: search })
        .order(orderColumn, { ascending: orderAscending })
        .range(startIndex, startIndex + limit - 1);

      const { data: rpcData, error: rpcError } = await rpcQuery;
      if (rpcError) throw rpcError;

      lessons = rpcData || [];

      // Get total count for search results
      const { count, error: countError } = await supabase
        .rpc('search_lessons', { search_term: search }, { count: 'exact', head: true });

      if (countError) {
        console.warn('Could not get total count for search results:', countError);
        total = lessons.length + startIndex;
      } else {
        total = count || 0;
      }
    } else {
      // Regular query without search
      let query = supabase
        .from('lessons')
        .select('id, title, color, created, lastUpdated, views, order, subject, grade, tags, description, purpose, pricing, lessonImage, randomQuestions', { count: 'exact' })
        .order(orderColumn, { ascending: orderAscending })
        .range(startIndex, startIndex + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      lessons = data || [];
      total = count || 0;
    }

    return { lessons, total, page, limit, search, sort };
  }

  async getLessonById(id) {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Lesson not found');
      }
      throw error;
    }

    return lesson;
  }

  async createLesson(lessonData) {
    // Get next order number
    const { data: maxOrderLesson, error: maxOrderError } = await supabase
      .from('lessons')
      .select('order')
      .order('order', { ascending: false })
      .limit(1)
      .single();

    let nextOrder = 0;
    if (maxOrderError && maxOrderError.code !== 'PGRST116') {
      throw maxOrderError;
    }
    if (maxOrderLesson && typeof maxOrderLesson.order === 'number') {
      nextOrder = maxOrderLesson.order + 1;
    }

    const now = new Date().toISOString();
    const newLessonData = {
      ...lessonData,
      id: lessonData.id || Date.now().toString(),
      views: 0,
      lastUpdated: now,
      created: now,
      order: nextOrder
    };

    const { data, error } = await supabase
      .from('lessons')
      .insert(newLessonData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateLesson(id, updateData) {
    const updatedData = {
      ...updateData,
      lastUpdated: new Date().toISOString()
    };
    
    // Remove fields that shouldn't be updated
    delete updatedData.id;
    delete updatedData.created;

    const { data, error } = await supabase
      .from('lessons')
      .update(updatedData)
      .eq('id', id)
      .select();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Lesson not found');
      }
      throw error;
    }

    return data;
  }

  async deleteLesson(id) {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async updateLessonOrder(orderedLessons) {
    const updates = orderedLessons.map((lesson, index) => 
      supabase
        .from('lessons')
        .update({ order: index })
        .eq('id', lesson.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      console.error('Errors updating lesson order:', errors);
      throw new Error('One or more lessons failed to update order.');
    }

    return true;
  }

  async incrementLessonViews(lessonId, currentViews) {
    const { error } = await supabase
      .from('lessons')
      .update({ views: currentViews + 1 })
      .eq('id', lessonId);

    if (error) throw error;
    return true;
  }

  // Student operations
  async getStudentByPhone(phoneNumber) {
    const { data: student, error } = await supabase
      .from('students')
      .select('id, full_name, password_hash, is_approved, approved_device_id, approved_device_fingerprint, current_session_id')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    if (error) throw error;
    return student;
  }

  async createStudent(studentData) {
    const { data: newStudent, error } = await supabase
      .from('students')
      .insert({
        ...studentData,
        is_approved: false,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;
    return newStudent;
  }

  async updateStudent(id, updateData) {
    const { error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async getStudents(options = {}) {
    const { limit = 100, approved = null } = options;
    
    let query = supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (approved !== null) {
      query = query.eq('is_approved', approved);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data: students, error } = await query;
    if (error) throw error;
    return students || [];
  }

  // Results operations
  async createResult(resultData) {
    // Debug: Log the exact data being sent to Supabase
    console.log('🔍 databaseService.createResult - Data being sent to Supabase:', JSON.stringify(resultData, null, 2));
    console.log('🔍 databaseService.createResult - Data keys:', Object.keys(resultData));

    const { data: savedResult, error } = await supabase
      .from('results')
      .insert(resultData)
      .select('id')
      .single();

    if (error) {
      console.log('🚨 databaseService.createResult - Supabase error:', error);
      throw error;
    }
    return savedResult;
  }

  async getResultById(id) {
    const { data: result, error } = await supabase
      .from('results')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Result not found');
      }
      throw error;
    }

    return result;
  }

  async deleteResult(id) {
    const { error } = await supabase
      .from('results')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async getLessonResults(lessonId) {
    const { data: results, error } = await supabase
      .from('results')
      .select(`
        *,
        students ( full_name )
      `)
      .eq('lessonId', lessonId);

    if (error) throw error;
    return results || [];
  }

  // Rating operations
  async getRatings(limit = 100, offset = 0) {
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select(`
        *,
        students ( full_name )
      `)
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return ratings || [];
  }

  async getStudentRating(studentId) {
    const { data: rating, error } = await supabase
      .from('ratings')
      .select(`
        *,
        students ( full_name )
      `)
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return rating;
  }

  async upsertRating(ratingData) {
    const { error } = await supabase
      .from('ratings')
      .upsert(ratingData);

    if (error) throw error;
    return true;
  }

  async createRatingHistory(historyData) {
    const { error } = await supabase
      .from('rating_history')
      .insert(historyData);

    if (error) throw error;
    return true;
  }

  async getStudentRatingHistory(studentId, limit = 50) {
    const { data: history, error } = await supabase
      .from('rating_history')
      .select('*')
      .eq('student_id', studentId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return history || [];
  }

  async getStudentProfile(studentId) {
    // Get student info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, full_name, created_at')
      .eq('id', studentId)
      .maybeSingle();

    if (studentError) throw studentError;
    if (!student) throw new Error('Student not found');

    // Get current rating
    const { data: rating, error: ratingError } = await supabase
      .from('ratings')
      .select('rating')
      .eq('student_id', studentId)
      .maybeSingle();

    if (ratingError) {
      console.warn(`Could not fetch rating for student ${studentId}:`, ratingError.message);
    }

    // Get rating history with lesson titles
    const { data: ratingHistory, error: historyError } = await supabase
      .from('rating_history')
      .select(`
        *,
        lessons ( title )
      `)
      .eq('student_id', studentId)
      .order('timestamp', { ascending: false })
      .limit(20);

    if (historyError) {
      console.error(`Error fetching rating history for student ${studentId}:`, historyError);
    }

    // Format history
    const formattedHistory = ratingHistory?.map(item => ({
      ...item,
      lesson_title: item.lessons?.title
    })) || [];

    return {
      student,
      rating,
      ratingHistory: formattedHistory
    };
  }

  // Get student by ID
  async getStudentById(studentId) {
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Student not found');
      }
      throw error;
    }
    return student;
  }

  // Save raw lesson content (for session storage fallback)
  async saveRawLessonContent(id, content, userId) {
    const { data, error } = await supabaseAdmin
      .from('temp_lesson_content')
      .upsert({
        id: id,
        content: content,
        created_at: new Date().toISOString(),
        user_id: userId || 'unknown'
      });

    if (error) throw error;
    return data;
  }

  // Get raw lesson content
  async getRawLessonContent(id) {
    const { data, error } = await supabaseAdmin
      .from('temp_lesson_content')
      .select('content')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Content not found');
      }
      throw error;
    }
    return data;
  }

  // Get quiz data
  async getQuizData() {
    const { data: quizConfig, error } = await supabase
      .from('quizzes')
      .select('quiz_data')
      .eq('id', 'main_quiz')
      .maybeSingle();

    if (error) throw error;
    return quizConfig?.quiz_data || { questions: [] };
  }

  // Save quiz result
  async saveQuizResult(resultData) {
    const { data, error } = await supabase
      .from('quiz_results')
      .insert(resultData)
      .select('id')
      .single();

    if (error) throw error;
    return data;
  }

  // Save quiz data (admin)
  async saveQuizData(quizData) {
    const { error } = await supabase
      .from('quizzes')
      .upsert({
        id: 'main_quiz',
        quiz_data: quizData
      });

    if (error) throw error;
    return true;
  }

  // Get all unique tags from lessons
  async getAllUniqueTags() {
    const { data, error } = await supabase
      .from('lessons')
      .select('tags');

    if (error) throw error;

    const allTags = new Set();
    if (data) {
      data.forEach(lesson => {
        if (Array.isArray(lesson.tags)) {
          lesson.tags.forEach(tag => {
            if (tag && typeof tag === 'string') {
              allTags.add(tag.trim());
            }
          });
        }
      });
    }

    return Array.from(allTags).sort();
  }

  // Delete student and all associated data
  async deleteStudentAndData(studentId) {
    console.warn(`ADMIN ACTION: Attempting to permanently delete student ${studentId} and all related data.`);

    try {
      // Delete in order to avoid foreign key constraints

      // 1. Delete rating history
      console.log(`Deleting rating history for student ${studentId}...`);
      const { error: historyError } = await supabaseAdmin
        .from('rating_history')
        .delete()
        .eq('student_id', studentId);
      if (historyError) {
        console.error('Error deleting rating history:', historyError);
      }

      // 2. Delete ratings
      console.log(`Deleting ratings for student ${studentId}...`);
      const { error: ratingError } = await supabaseAdmin
        .from('ratings')
        .delete()
        .eq('student_id', studentId);
      if (ratingError) {
        console.error('Error deleting ratings:', ratingError);
      }

      // 3. Delete quiz results
      console.log(`Deleting quiz results for student ${studentId}...`);
      const { error: quizResultsError } = await supabaseAdmin
        .from('quiz_results')
        .delete()
        .eq('student_id', studentId);
      if (quizResultsError) {
        console.error('Error deleting quiz results:', quizResultsError);
      }

      // 4. Delete lesson results
      console.log(`Deleting lesson results for student ${studentId}...`);
      const { error: resultsError } = await supabaseAdmin
        .from('results')
        .delete()
        .eq('student_id', studentId);
      if (resultsError) {
        console.error('Error deleting lesson results:', resultsError);
      }

      // 5. Finally, delete the student record
      console.log(`Deleting student record ${studentId}...`);
      const { error: studentDeleteError } = await supabaseAdmin
        .from('students')
        .delete()
        .eq('id', studentId);

      if (studentDeleteError) {
        console.error('Critical error deleting student record:', studentDeleteError);
        throw new Error(`Failed to delete student record: ${studentDeleteError.message}`);
      }

      console.log(`Successfully deleted student ${studentId} and associated data.`);
      return true;

    } catch (error) {
      console.error(`Error processing delete request for student ${studentId}:`, error);
      throw error;
    }
  }

  // Update device information for student
  async updateDeviceInfo(studentId, deviceId, deviceFingerprint) {
    const updateData = {};

    if (deviceId) {
      // Check if this is a device_id (new system) or device_fingerprint (legacy)
      if (deviceId.length > 20) { // Assume device_id is longer
        updateData.approved_device_id = deviceId;
        updateData.device_registered_at = new Date().toISOString();
      } else {
        // Legacy fingerprint support
        updateData.approved_device_fingerprint = deviceId;
      }
    }

    if (deviceFingerprint) {
      updateData.approved_device_fingerprint = deviceFingerprint;
    }

    await this.updateStudent(studentId, updateData);
    return true;
  }

  // Unbind device from student
  async unbindDevice(studentId) {
    const { data, error } = await supabase
      .from('students')
      .update({
        approved_device_fingerprint: null,
        approved_device_id: null
      })
      .eq('id', studentId)
      .select('id')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Student not found');
      }
      throw error;
    }

    return true;
  }

  // Get lesson results with student info
  async getLessonResultsWithStudents(lessonId) {
    const { data: results, error } = await supabase
      .from('results')
      .select(`
        *,
        students ( full_name )
      `)
      .eq('lessonId', lessonId);

    if (error) throw error;
    return results || [];
  }

  // Get history with pagination
  async getHistoryWithPagination(options = {}) {
    const { page = 1, limit = 15, search = '', sort = 'time-desc' } = options;
    const startIndex = (page - 1) * limit;

    // Determine sorting
    let orderAscending = false;
    let orderColumn = 'timestamp';

    const sortMap = {
      'time-asc': { column: 'timestamp', ascending: true },
      'time-desc': { column: 'timestamp', ascending: false },
      'score-asc': { column: 'score', ascending: true },
      'score-desc': { column: 'score', ascending: false },
    };

    if (sortMap[sort]) {
      orderColumn = sortMap[sort].column;
      orderAscending = sortMap[sort].ascending;
    }

    let query = supabase
      .from('results')
      .select(`
        id,
        student_id,
        timestamp,
        score,
        totalPoints,
        lessonId,
        students!inner ( full_name ),
        lessons ( title )
      `, { count: 'exact' });

    // Apply search filter if provided
    if (search) {
      query = query.or(`students.full_name.ilike.%${search}%,lessons.title.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(orderColumn, { ascending: orderAscending });

    // Apply pagination
    query = query.range(startIndex, startIndex + limit - 1);

    const { data: historyData, error, count: totalCount } = await query;

    if (error) throw error;

    const history = historyData.map(result => ({
      resultId: result.id,
      studentName: result.students?.full_name || 'Unknown Student',
      lessonTitle: result.lessons?.title || (result.lessonId === 'quiz_game' ? 'Trò chơi chinh phục' : 'Unknown Lesson'),
      submittedAt: result.timestamp,
      score: result.score,
      totalPoints: result.totalPoints,
      scorePercentage: result.totalPoints ? ((result.score / result.totalPoints) * 100).toFixed(1) + '%' : 'N/A'
    }));

    return {
      history,
      total: totalCount || 0,
      page,
      limit
    };
  }
}

module.exports = new DatabaseService();



---
File: /api/services/ratingService.js
---

const { RATING_CONFIG } = require('../config/constants');
const databaseService = require('./databaseService');

class RatingService {
  // Calculate rating change using ELO-like algorithm
  calculateRatingChange(previousRating, performance, timeTaken, streak) {
    // Base K-factor (sensitivity of rating changes)
    const baseK = RATING_CONFIG.BASE_K_FACTOR;
    
    // Time bonus (faster completion = higher bonus)
    const timeBonus = Math.max(0, 1 - (timeTaken / RATING_CONFIG.MAX_TIME_BONUS));
    
    // Streak multiplier
    const streakMultiplier = 1 + (Math.min(streak, RATING_CONFIG.MAX_STREAK_MULTIPLIER) * RATING_CONFIG.STREAK_BONUS_RATE);
    
    // Performance factor (0-1)
    const performanceFactor = performance;
    
    // Calculate expected score (ELO formula)
    const expectedScore = 1 / (1 + Math.pow(10, (1500 - previousRating) / 400));
    
    // Calculate rating change
    const ratingChange = baseK * (performanceFactor - expectedScore) * timeBonus * streakMultiplier;
    
    return Math.round(ratingChange);
  }

  // Update student rating after lesson completion
  async updateStudentRating(studentId, lessonId, score, totalPoints, timeTaken, streak) {
    try {
      // Get current rating
      const currentRating = await databaseService.getStudentRating(studentId);
      const previousRating = currentRating?.rating || RATING_CONFIG.DEFAULT_RATING;
      const performance = score / totalPoints;
      
      // Calculate new rating
      const ratingChange = this.calculateRatingChange(previousRating, performance, timeTaken, streak);
      const newRating = previousRating + ratingChange;

      // Update or insert rating
      await databaseService.upsertRating({
        student_id: studentId,
        rating: newRating,
        last_updated: new Date().toISOString()
      });

      // Record rating history
      await databaseService.createRatingHistory({
        student_id: studentId,
        lesson_id: lessonId,
        previous_rating: previousRating,
        rating_change: ratingChange,
        new_rating: newRating,
        performance: performance,
        time_taken: timeTaken,
        streak: streak,
        timestamp: new Date().toISOString()
      });

      return { newRating, ratingChange, previousRating };
    } catch (error) {
      console.error('Error updating student rating:', error);
      throw error;
    }
  }

  // Get leaderboard data
  async getLeaderboard(limit = 100, offset = 0) {
    try {
      const ratings = await databaseService.getRatings(limit, offset);
      return ratings;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  // Get student rating with history
  async getStudentRatingData(studentId) {
    try {
      const rating = await databaseService.getStudentRating(studentId);
      const history = await databaseService.getStudentRatingHistory(studentId);
      
      return {
        currentRating: rating,
        history: history
      };
    } catch (error) {
      console.error('Error fetching student rating data:', error);
      throw error;
    }
  }

  // Calculate performance metrics
  calculatePerformanceMetrics(score, totalPoints, timeTaken, streak) {
    const accuracy = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    const timeEfficiency = timeTaken > 0 ? Math.max(0, 1 - (timeTaken / RATING_CONFIG.MAX_TIME_BONUS)) : 0;
    const streakBonus = Math.min(streak, RATING_CONFIG.MAX_STREAK_MULTIPLIER) * RATING_CONFIG.STREAK_BONUS_RATE;
    
    return {
      accuracy: Math.round(accuracy * 100) / 100,
      timeEfficiency: Math.round(timeEfficiency * 100) / 100,
      streakBonus: Math.round(streakBonus * 100) / 100,
      overallPerformance: accuracy / 100
    };
  }

  // Get rating statistics
  async getRatingStatistics() {
    try {
      const allRatings = await databaseService.getRatings(1000); // Get more for statistics
      
      if (!allRatings || allRatings.length === 0) {
        return {
          totalPlayers: 0,
          averageRating: RATING_CONFIG.DEFAULT_RATING,
          highestRating: RATING_CONFIG.DEFAULT_RATING,
          lowestRating: RATING_CONFIG.DEFAULT_RATING,
          ratingDistribution: []
        };
      }

      const ratings = allRatings.map(r => r.rating);
      const totalPlayers = ratings.length;
      const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / totalPlayers;
      const highestRating = Math.max(...ratings);
      const lowestRating = Math.min(...ratings);

      // Create rating distribution (ranges of 100 points)
      const distribution = {};
      ratings.forEach(rating => {
        const range = Math.floor(rating / 100) * 100;
        const rangeKey = `${range}-${range + 99}`;
        distribution[rangeKey] = (distribution[rangeKey] || 0) + 1;
      });

      return {
        totalPlayers,
        averageRating: Math.round(averageRating),
        highestRating,
        lowestRating,
        ratingDistribution: Object.entries(distribution).map(([range, count]) => ({
          range,
          count,
          percentage: Math.round((count / totalPlayers) * 100)
        }))
      };
    } catch (error) {
      console.error('Error calculating rating statistics:', error);
      throw error;
    }
  }

  // Validate rating data
  validateRatingData(score, totalPoints, timeTaken, streak) {
    const errors = [];

    if (typeof score !== 'number' || score < 0) {
      errors.push('Invalid score value');
    }

    if (typeof totalPoints !== 'number' || totalPoints <= 0) {
      errors.push('Invalid total points value');
    }

    if (score > totalPoints) {
      errors.push('Score cannot be greater than total points');
    }

    if (typeof timeTaken !== 'number' || timeTaken < 0) {
      errors.push('Invalid time taken value');
    }

    if (typeof streak !== 'number' || streak < 0) {
      errors.push('Invalid streak value');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get rating tier/rank
  getRatingTier(rating) {
    if (rating >= 2000) return { tier: 'Master', color: '#ff6b6b' };
    if (rating >= 1800) return { tier: 'Diamond', color: '#4ecdc4' };
    if (rating >= 1600) return { tier: 'Platinum', color: '#45b7d1' };
    if (rating >= 1400) return { tier: 'Gold', color: '#f9ca24' };
    if (rating >= 1200) return { tier: 'Silver', color: '#a4b0be' };
    return { tier: 'Bronze', color: '#cd6133' };
  }
}

module.exports = new RatingService();



---
File: /api/services/sessionService.js
---

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
    return {
      sessionId: req.sessionID,
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



---
File: /api/utils/helpers.js
---

const crypto = require('crypto');

/**
 * Utility functions for common operations
 */

// Generate unique ID
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Generate UUID v4
function generateUUID() {
  return crypto.randomUUID();
}

// Generate random string
function generateRandomString(length = 10) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

// Hash password using crypto
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

// Verify password
function verifyPassword(password, hash, salt) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Format date to Vietnamese locale
function formatDateVN(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format time duration (seconds to readable format)
function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0 giây';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours} giờ`);
  if (minutes > 0) parts.push(`${minutes} phút`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds} giây`);
  
  return parts.join(' ');
}

// Sanitize HTML content
function sanitizeHTML(html) {
  if (!html) return '';
  
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '');
}

// Validate Vietnamese phone number
function isValidVietnamesePhone(phone) {
  if (!phone) return false;
  
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it matches Vietnamese phone patterns
  const patterns = [
    /^(84|0)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/, // Mobile
    /^(84|0)(2[0-9])[0-9]{8}$/ // Landline
  ];
  
  return patterns.some(pattern => pattern.test(cleanPhone));
}

// Validate email
function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Escape special characters for regex
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Paginate array
function paginateArray(array, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const paginatedItems = array.slice(offset, offset + limit);
  
  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      total: array.length,
      totalPages: Math.ceil(array.length / limit),
      hasNext: offset + limit < array.length,
      hasPrev: page > 1
    }
  };
}

// Deep clone object
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

// Remove undefined/null values from object
function cleanObject(obj) {
  const cleaned = {};
  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

// Convert string to slug
function slugify(text) {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// Calculate percentage
function calculatePercentage(value, total, decimals = 2) {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Generate ETag for caching
function generateETag(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

// Check if object is empty
function isEmpty(obj) {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  return Object.keys(obj).length === 0;
}

// Retry function with exponential backoff
async function retry(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = {
  generateId,
  generateUUID,
  generateRandomString,
  hashPassword,
  verifyPassword,
  formatDateVN,
  formatDuration,
  sanitizeHTML,
  isValidVietnamesePhone,
  isValidEmail,
  escapeRegex,
  paginateArray,
  deepClone,
  cleanObject,
  slugify,
  calculatePercentage,
  formatFileSize,
  debounce,
  throttle,
  generateETag,
  isEmpty,
  retry
};



---
File: /api/utils/logger.js
---

const fs = require('fs');
const path = require('path');

/**
 * Simple logging utility
 */

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}\n`;
  }

  writeToFile(filename, content) {
    const filePath = path.join(this.logDir, filename);
    fs.appendFileSync(filePath, content);
  }

  log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Write to console
    console.log(formattedMessage.trim());
    
    // Write to file
    const today = new Date().toISOString().split('T')[0];
    this.writeToFile(`app-${today}.log`, formattedMessage);
    
    // Write to level-specific file for errors and warnings
    if (level === 'error' || level === 'warn') {
      this.writeToFile(`${level}-${today}.log`, formattedMessage);
    }
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, meta);
    }
  }

  // Log authentication events
  logAuth(event, details = {}) {
    this.info(`Auth Event: ${event}`, {
      event,
      ...details,
      timestamp: new Date().toISOString()
    });
    
    // Write to auth-specific log
    const today = new Date().toISOString().split('T')[0];
    const authMessage = this.formatMessage('auth', `${event}`, details);
    this.writeToFile(`auth-${today}.log`, authMessage);
  }

  // Log API requests
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };

    this.info(`${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`, logData);
    
    // Write to access log
    const today = new Date().toISOString().split('T')[0];
    const accessMessage = this.formatMessage('access', 
      `${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`, 
      logData
    );
    this.writeToFile(`access-${today}.log`, accessMessage);
  }

  // Log database operations
  logDatabase(operation, details = {}) {
    this.debug(`Database: ${operation}`, {
      operation,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // Log cache operations
  logCache(operation, key, details = {}) {
    this.debug(`Cache: ${operation} - ${key}`, {
      operation,
      key,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // Log file operations
  logFile(operation, filename, details = {}) {
    this.info(`File: ${operation} - ${filename}`, {
      operation,
      filename,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // Log rating updates
  logRating(studentId, change, details = {}) {
    this.info(`Rating Update: Student ${studentId} - ${change > 0 ? '+' : ''}${change}`, {
      studentId,
      ratingChange: change,
      ...details,
      timestamp: new Date().toISOString()
    });
    
    // Write to rating-specific log
    const today = new Date().toISOString().split('T')[0];
    const ratingMessage = this.formatMessage('rating', 
      `Student ${studentId} rating change: ${change > 0 ? '+' : ''}${change}`, 
      { studentId, ratingChange: change, ...details }
    );
    this.writeToFile(`rating-${today}.log`, ratingMessage);
  }

  // Clean old log files (keep last 30 days)
  cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          this.info(`Cleaned old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('Error cleaning old logs', { error: error.message });
    }
  }

  // Get log statistics
  getLogStats() {
    try {
      const files = fs.readdirSync(this.logDir);
      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        filesByType: {}
      };
      
      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const fileStats = fs.statSync(filePath);
        stats.totalSize += fileStats.size;
        
        const type = file.split('-')[0];
        if (!stats.filesByType[type]) {
          stats.filesByType[type] = { count: 0, size: 0 };
        }
        stats.filesByType[type].count++;
        stats.filesByType[type].size += fileStats.size;
      });
      
      return stats;
    } catch (error) {
      this.error('Error getting log stats', { error: error.message });
      return null;
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Clean old logs on startup
logger.cleanOldLogs();

module.exports = logger;



---
File: /api/utils/validators.js
---

const { isValidVietnamesePhone, isValidEmail } = require('./helpers');

/**
 * Validation utility functions
 */

// Validate admin login data
function validateAdminLogin(data) {
  const errors = [];
  
  if (!data.username || typeof data.username !== 'string' || data.username.trim().length === 0) {
    errors.push('Username is required');
  }
  
  if (!data.password || typeof data.password !== 'string' || data.password.length === 0) {
    errors.push('Password is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate student login data
function validateStudentLogin(data) {
  const errors = [];
  
  if (!data.phone_number || !isValidVietnamesePhone(data.phone_number)) {
    errors.push('Valid Vietnamese phone number is required');
  }
  
  if (!data.password || typeof data.password !== 'string' || data.password.length === 0) {
    errors.push('Password is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate student registration data
function validateStudentRegistration(data) {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (!data.phone_number || !isValidVietnamesePhone(data.phone_number)) {
    errors.push('Valid Vietnamese phone number is required');
  }
  
  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Valid email address is required');
  }
  
  if (data.grade && (typeof data.grade !== 'number' || data.grade < 6 || data.grade > 12)) {
    errors.push('Grade must be between 6 and 12');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate lesson data
function validateLesson(data) {
  const errors = [];
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Lesson title is required');
  }
  
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('Lesson content is required');
  }
  
  if (data.order && (typeof data.order !== 'number' || data.order < 0)) {
    errors.push('Lesson order must be a positive number');
  }
  
  if (data.difficulty && !['easy', 'medium', 'hard'].includes(data.difficulty)) {
    errors.push('Difficulty must be easy, medium, or hard');
  }
  
  if (data.subject && typeof data.subject !== 'string') {
    errors.push('Subject must be a string');
  }
  
  if (data.grade && (typeof data.grade !== 'number' || data.grade < 6 || data.grade > 12)) {
    errors.push('Grade must be between 6 and 12');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate result submission data
function validateResult(data) {
  const errors = [];
  
  if (!data.lessonId || typeof data.lessonId !== 'string') {
    errors.push('Lesson ID is required');
  }
  
  if (!data.answers || !Array.isArray(data.answers)) {
    errors.push('Answers must be an array');
  }
  
  if (data.timeTaken && (typeof data.timeTaken !== 'number' || data.timeTaken < 0)) {
    errors.push('Time taken must be a positive number');
  }
  
  if (!data.studentInfo || typeof data.studentInfo !== 'object') {
    errors.push('Student info is required');
  } else {
    if (!data.studentInfo.name || typeof data.studentInfo.name !== 'string') {
      errors.push('Student name is required in student info');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate pagination parameters
function validatePagination(query) {
  const errors = [];
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  
  if (page < 1) {
    errors.push('Page must be greater than 0');
  }
  
  if (limit < 1 || limit > 100) {
    errors.push('Limit must be between 1 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    page,
    limit
  };
}

// Validate search parameters
function validateSearch(query) {
  const errors = [];
  const search = query.search || query.q || '';
  
  if (search && typeof search !== 'string') {
    errors.push('Search query must be a string');
  }
  
  if (search && search.length > 100) {
    errors.push('Search query must be less than 100 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    search: search.trim()
  };
}

// Validate ID parameter
function validateId(id) {
  const errors = [];
  
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    errors.push('ID is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate file upload
function validateFileUpload(file) {
  const errors = [];
  
  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size must be less than 10MB');
  }
  
  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('File type not allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate rating data
function validateRatingData(score, totalPoints, timeTaken, streak) {
  const errors = [];
  
  if (typeof score !== 'number' || score < 0) {
    errors.push('Score must be a non-negative number');
  }
  
  if (typeof totalPoints !== 'number' || totalPoints <= 0) {
    errors.push('Total points must be a positive number');
  }
  
  if (score > totalPoints) {
    errors.push('Score cannot be greater than total points');
  }
  
  if (typeof timeTaken !== 'number' || timeTaken < 0) {
    errors.push('Time taken must be a non-negative number');
  }
  
  if (typeof streak !== 'number' || streak < 0) {
    errors.push('Streak must be a non-negative number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate password strength
function validatePasswordStrength(password) {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  // Check for at least one letter and one number (optional but recommended)
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasLetter || !hasNumber) {
    // This is a warning, not an error
    return {
      isValid: true,
      errors,
      warnings: ['Password should contain both letters and numbers for better security']
    };
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate Vietnamese name
function validateVietnameseName(name) {
  const errors = [];
  
  if (!name || typeof name !== 'string') {
    errors.push('Name is required');
    return { isValid: false, errors };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (trimmedName.length > 50) {
    errors.push('Name must be less than 50 characters');
  }
  
  // Check for Vietnamese name pattern (letters, spaces, and Vietnamese characters)
  const vietnameseNamePattern = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/;
  
  if (!vietnameseNamePattern.test(trimmedName)) {
    errors.push('Name contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateAdminLogin,
  validateStudentLogin,
  validateStudentRegistration,
  validateLesson,
  validateResult,
  validatePagination,
  validateSearch,
  validateId,
  validateFileUpload,
  validateRatingData,
  validatePasswordStrength,
  validateVietnameseName
};



---
File: /api/index.js
---

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
// const { inject } = require('@vercel/analytics');

// Import configuration modules
const { sessionConfig, sessionStore } = require('./config/session');
const { UPLOAD_CONFIG } = require('./config/constants');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import route modules
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const lessonRoutes = require('./routes/lessons');
const ratingRoutes = require('./routes/ratings');
const uploadRoutes = require('./routes/uploads');
const resultRoutes = require('./routes/results');
const viewRoutes = require('./routes/views');
const galleryRoutes = require('./routes/gallery');
const quizRoutes = require('./routes/quiz');
const tagsRoutes = require('./routes/tags');
const explainRoutes = require('./routes/explain');
const adminRoutes = require('./routes/admin');
const historyRoutes = require('./routes/history');

// Import utilities
const logger = require('./utils/logger');

// Import services that need initialization
const sessionService = require('./services/sessionService');

const app = express();
const PORT = process.env.PORT || 3003;

// --- Global Error Handling ---
process.on('uncaughtException', (error) => {
  logger.error('FATAL: Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('FATAL: Unhandled Rejection', { reason, promise });
});
// --- End Global Error Handling ---

// Initialize Vercel Analytics
// inject();

// Set proper charset for all responses
app.use((req, res, next) => {
    res.charset = 'utf-8';
    next();
});

// Middleware to inject Speed Insights script
app.use((req, res, next) => {
    const originalSend = res.send;

    res.send = function(body) {
        // Only inject script into HTML responses
        if (typeof body === 'string' && body.includes('</head>')) {
            // Inject the Speed Insights script before the closing head tag
            const speedInsightsScript = '<script defer src="/_vercel/speed-insights/script.js"></script>';
            body = body.replace('</head>', `${speedInsightsScript}</head>`);
        }
        return originalSend.call(this, body);
    };

    next();
});

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const responseTime = Date.now() - start;
        logger.logRequest(req, res, responseTime);
    });

    next();
});

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true, parameterLimit: 50000 }));
app.use(express.static(path.join(process.cwd(), 'public'), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath);

        // Force no-cache for CSS and JS files to prevent theme issues
        if (ext === '.css' || ext === '.js') {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else if (ext === '.html') {
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else {
            // Images and other assets can be cached
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
        }
    }
}));

// Configure express-session
app.set('trust proxy', 1); // Trust first proxy, crucial for Vercel/Heroku/etc.
app.use(sessionConfig);

// Initialize session service with session store
sessionService.initialize(sessionStore);

// Add session cleanup middleware only for non-static routes
app.use((req, _res, next) => {
    // Skip session cleanup for static files and assets
    if (req.url.startsWith('/css/') ||
        req.url.startsWith('/js/') ||
        req.url.startsWith('/images/') ||
        req.url.startsWith('/favicon.ico')) {
        return next();
    }

    // Ensure session integrity for dynamic routes
    if (req.session) {
        sessionService.cleanupSession(req);
    }
    next();
});

// Add cache busting for theme changes
app.use((_req, res, next) => {
    // Add cache buster to prevent theme caching issues
    res.locals.cacheVersion = process.env.CACHE_VERSION || Date.now();
    next();
});

// Setup API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/explain', explainRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/history', historyRoutes);

// Setup view routes (HTML pages) - Register early to avoid conflicts
app.use('/', viewRoutes);

// Add specific route aliases for backward compatibility
// Import auth controller and middleware for direct route handling
const authController = require('./controllers/authController');
const {
  validateAdminLogin,
  validateStudentLogin,
  validateStudentRegistration
} = require('./middleware/validation');
const {
  requireAdminAuth,
  requireStudentAuth,
  requireNotAuthenticated,
  authRateLimit,
  logAuthEvent
} = require('./middleware/auth');

app.post('/api/login',
  authRateLimit,
  logAuthEvent('admin_login_attempt'),
  requireNotAuthenticated,
  validateAdminLogin,
  authController.adminLogin
);

app.post('/api/student/login',
  authRateLimit,
  logAuthEvent('student_login_attempt'),
  requireNotAuthenticated,
  validateStudentLogin,
  authController.studentLogin
);

app.post('/api/register',
  authRateLimit,
  logAuthEvent('student_register_attempt'),
  requireNotAuthenticated,
  validateStudentRegistration,
  authController.studentRegister
);

app.get('/api/check-student-auth',
  authController.checkStudentAuth
);

app.get('/api/check-auth',
  authController.checkAuth
);

// Student info endpoints for session storage
app.get('/api/student-info', (req, res) => {
  const sessionData = sessionService.getSessionData(req);

  if (sessionData.studentId) {
    res.json({
      success: true,
      student: {
        id: sessionData.studentId,
        name: sessionData.studentName
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'No student session found'
    });
  }
});

// Student info session endpoint (for backward compatibility)
app.post('/api/student-info', (req, res) => {
    req.session.studentInfo = req.body;
    res.json({ success: true });
});

// Temporary cache clear endpoint for development
app.get('/api/clear-cache', (_req, res) => {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
    res.json({ message: 'Cache cleared' });
});

// View routes already registered above

// 404 handler for unmatched routes
app.use('*', (req, res) => {
    logger.warn('404 Not Found', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(404).json({
            success: false,
            message: 'Route not found'
        });
    } else {
        res.status(404).sendFile(path.join(process.cwd(), 'views', '404.html'));
    }
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

module.exports = app;
 paste-2.txt->txt-><!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chọn bài học - Ôn luyện Vật lí</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <!-- Styles -->
    <link rel="stylesheet" href="/css/style.css">
    
    <style>
        /* Home Page Specific Styles */
        .main-content {
            min-height: 100vh;
            padding: 7rem 2rem 2rem;
            max-width: 1400px;
            margin: 0 auto;
            position: relative;
        }
        
        .page-header {
            text-align: center;
            margin-bottom: 3rem;
            animation: fadeIn 0.6s ease-out;
        }
        
        .page-header h1 {
            font-size: clamp(2.5rem, 5vw, 4rem);
            margin-bottom: 1rem;
        }
        
        .page-header p {
            font-size: 1.2rem;
            color: var(--text-secondary);
        }
        
        /* Search and Filter Section */
        .search-filter-section {
            display: flex;
            gap: 1rem;
            margin-bottom: 3rem;
            flex-wrap: wrap;
            animation: fadeIn 0.8s ease-out;
        }
        
        .search-container {
            flex: 1;
            min-width: 300px;
            position: relative;
        }
        
        .search-container input {
            width: 100%;
            padding: 1rem 1rem 1rem 3.5rem;
            background: var(--glass-bg);
            border: 2px solid var(--glass-border);
            border-radius: var(--radius-full);
            color: var(--text-primary);
            font-size: 1rem;
            transition: var(--transition-fast);
        }
        
        .search-container input:focus {
            border-color: var(--neon-purple);
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
        }
        
        .search-container .search-icon {
            position: absolute;
            left: 1.2rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-tertiary);
            font-size: 1.2rem;
        }
        
        .filter-container {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        
        .filter-select {
            padding: 1rem 2rem 1rem 1rem;
            background: var(--glass-bg);
            border: 2px solid var(--glass-border);
            border-radius: var(--radius-full);
            color: var(--text-primary);
            font-size: 1rem;
            cursor: pointer;
            transition: var(--transition-fast);
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 1rem center;
            background-size: 12px;
        }
        
        .filter-select:hover,
        .filter-select:focus {
            border-color: var(--neon-purple);
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
            outline: none;
        }
        
        /* Tags Container */
        .tags-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 1rem;
            animation: fadeIn 1s ease-out;
        }
        
        .tag {
            padding: 0.5rem 1rem;
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-full);
            font-size: 0.9rem;
            cursor: pointer;
            transition: var(--transition-fast);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .tag:hover {
            background: var(--primary-gradient);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(168, 85, 247, 0.3);
        }
        
        .tag.active {
            background: var(--primary-gradient);
            color: white;
            box-shadow: 0 5px 15px rgba(168, 85, 247, 0.3);
        }
        
        /* Lessons Grid */
        .lessons-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 2rem;
            animation: fadeIn 1.2s ease-out;
        }
        
        .lesson-card {
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-xl);
            overflow: hidden;
            transition: var(--transition-normal);
            cursor: pointer;
            position: relative;
            backdrop-filter: blur(10px);
        }
        
        .lesson-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 100%;
            background: linear-gradient(135deg, transparent 0%, rgba(168, 85, 247, 0.1) 100%);
            opacity: 0;
            transition: opacity var(--transition-normal);
        }
        
        .lesson-card:hover {
            transform: translateY(-10px) scale(1.02);
            border-color: var(--neon-purple);
            box-shadow: 0 20px 40px rgba(168, 85, 247, 0.3);
        }
        
        .lesson-card:hover::before {
            opacity: 1;
        }
        
        .lesson-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            transition: var(--transition-slow);
        }
        
        .lesson-card:hover .lesson-image {
            transform: scale(1.1);
        }
        
        .lesson-content {
            padding: 1.5rem;
            position: relative;
            z-index: 1;
        }
        
        .lesson-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 1rem;
        }
        
        .lesson-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
            background: var(--primary-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .lesson-meta {
            display: flex;
            gap: 1.5rem;
            margin-bottom: 1rem;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .lesson-meta-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .lesson-meta-item i {
            color: var(--neon-purple);
        }
        
        .lesson-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .lesson-tag {
            padding: 0.25rem 0.75rem;
            background: rgba(168, 85, 247, 0.1);
            border: 1px solid rgba(168, 85, 247, 0.3);
            border-radius: var(--radius-full);
            font-size: 0.8rem;
            color: var(--neon-purple);
        }
        
        .lesson-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
        }
        
        .lesson-button {
            flex: 1;
            padding: 0.75rem 1.5rem;
            background: var(--primary-gradient);
            color: white;
            border: none;
            border-radius: var(--radius-full);
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition-fast);
            text-align: center;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        .lesson-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(168, 85, 247, 0.4);
        }
        
        .lesson-button.secondary {
            background: transparent;
            border: 2px solid var(--glass-border);
            color: var(--text-primary);
        }
        
        .lesson-button.secondary:hover {
            border-color: var(--neon-purple);
            color: var(--neon-purple);
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
        }
        
        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: var(--text-secondary);
        }
        
        .empty-state i {
            font-size: 5rem;
            color: var(--text-tertiary);
            margin-bottom: 1rem;
        }
        
        .empty-state h3 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }
        
        /* Home Button Dropdown */
        .home-button-container {
            position: fixed;
            top: 2rem;
            left: 2rem;
            z-index: 1001;
        }
        
        .home-dropdown {
            position: absolute;
            top: 70px;
            left: 0;
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-lg);
            padding: 0.5rem;
            min-width: 200px;
            backdrop-filter: blur(20px);
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: var(--transition-fast);
        }
        
        .home-button-container:hover .home-dropdown {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        
        .dropdown-item {
            padding: 0.75rem 1rem;
            border-radius: var(--radius-md);
            transition: var(--transition-fast);
        }
        
        .dropdown-item:hover {
            background: rgba(168, 85, 247, 0.1);
        }
        
        .dropdown-item a {
            color: var(--text-primary);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .dropdown-item a:hover {
            color: var(--neon-purple);
        }
        
        /* Modal Styles */
        .modal {
            display: none;
        }
        
        .modal.active {
            display: flex;
        }
        
        /* Loading State */
        .loading-skeleton {
            animation: shimmer 2s infinite;
            background: linear-gradient(90deg, var(--glass-bg) 0%, rgba(168, 85, 247, 0.1) 50%, var(--glass-bg) 100%);
            background-size: 200% 100%;
            border-radius: var(--radius-lg);
            height: 300px;
        }
        
        @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .main-content {
                padding: 5rem 1rem 2rem;
            }
            
            .lessons-grid {
                grid-template-columns: 1fr;
            }
            
            .search-filter-section {
                flex-direction: column;
            }
            
            .filter-container {
                width: 100%;
                justify-content: space-between;
            }
        }
    </style>
</head>
<body>
    <!-- Loading Indicator -->
    <div id="loading-indicator" class="loading-indicator">
        <div class="spinner"></div>
        <p>Đang tải bài học...</p>
    </div>

    <!-- Background Animation -->
    <canvas id="network-canvas"></canvas>
    
    <!-- Main Content -->
    <div class="main-content">
        <!-- Home Button with Dropdown -->
        <div class="home-button-container">
            <a href="/" class="home-button">
                <img src="https://styles.redditmedia.com/t5_851o4i/styles/profileIcon_0elfudeu2s5b1.jpg?width=256&height=256&frame=1&auto=webp&crop=256:256,smart&s=86be605407a08efe2894a6bacd089074aca51879" alt="Home">
            </a>
            <div class="home-dropdown">
                <div class="dropdown-item">
                    <a href="/admin/login">
                        <i class="fas fa-user-shield"></i>
                        <span>Vào chế độ chỉnh sửa</span>
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Page Header -->
        <div class="page-header">
            <h1>Chọn bài học</h1>
            <p>Khám phá kho tàng kiến thức Vật lí 12 🚀</p>
        </div>
        
        <!-- Search and Filter Section -->
        <div class="search-filter-section">
            <div class="search-container">
                <i class="fas fa-search search-icon"></i>
                <input type="text" id="search-input" placeholder="Tìm kiếm bài học hoặc tag...">
            </div>
            <div class="filter-container">
                <select id="sort-select" class="filter-select">
                    <option value="newest">🆕 Mới nhất</option>
                    <option value="oldest">📅 Cũ nhất</option>
                    <option value="az">🔤 Tên A-Z</option>
                    <option value="za">🔤 Tên Z-A</option>
                    <option value="popular">🔥 Phổ biến</option>
                </select>
            </div>
        </div>
        
        <!-- Tags Container -->
        <div class="tags-container"></div>
        
        <!-- Lessons Grid -->
        <div id="lessons" class="lessons-grid">
            <!-- Lessons will be dynamically loaded here -->
        </div>

        <!-- Student Info Modal -->
        <div id="user-info-modal" class="modal">
            <div class="modal-content">
                <div class="modal-icon" style="text-align: center; font-size: 4rem; margin-bottom: 1.5rem;">
                    <i class="fas fa-user-graduate"></i>
                </div>
                <h2 style="text-align: center; margin-bottom: 2rem;">Thông tin học sinh</h2>
                <form id="user-info-form" autocomplete="off">
                    <div class="form-group">
                        <label>Họ và tên *</label>
                        <input type="text" id="student-name" required>
                    </div>
                    <div class="form-group">
                        <label>Ngày sinh</label>
                        <input type="date" id="student-dob">
                    </div>
                    <div class="form-group">
                        <label>Mã số học sinh</label>
                        <input type="text" id="student-id">
                    </div>
                    <div class="modal-buttons" style="display: flex; gap: 1rem; margin-top: 2rem;">
                        <button type="submit" class="button primary" style="flex: 1;">
                            <i class="fas fa-play"></i>
                            Làm bài
                        </button>
                        <button type="button" onclick="closeModal()" class="button secondary" style="flex: 1;">
                            <i class="fas fa-times"></i>
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="/js/network-animation.js"></script>
    <script src="/js/lessons.js"></script>
    <script>
        // Add hover effect for cards
        document.addEventListener('DOMContentLoaded', () => {
            // Add stagger animation to lesson cards
            const observer = new IntersectionObserver(entries => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0)';
                        }, index * 100);
                    }
                });
            });
            
            // Observe all lesson cards
            setTimeout(() => {
                document.querySelectorAll('.lesson-card').forEach(card => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    card.style.transition = 'all 0.6s ease-out';
                    observer.observe(card);
                });
            }, 100);
        });
    </script>
</body>
</html> paste-3.txt->txt->/* ===== MODERN GEN Z DESIGN SYSTEM ===== */

/* Root Variables */
:root {
    /* Primary Colors - Vibrant Gradients */
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --accent-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    --success-gradient: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    --warning-gradient: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    --danger-gradient: linear-gradient(135deg, #f43b47 0%, #453a94 100%);
    
    /* Dark Theme Colors */
    --bg-primary: #0a0a0f;
    --bg-secondary: #1a1a2e;
    --bg-tertiary: #16213e;
    --bg-card: rgba(255, 255, 255, 0.05);
    --bg-card-hover: rgba(255, 255, 255, 0.08);
    
    /* Text Colors */
    --text-primary: #ffffff;
    --text-secondary: #b8bcc8;
    --text-tertiary: #6c757d;
    
    /* Glassmorphism */
    --glass-bg: rgba(255, 255, 255, 0.05);
    --glass-border: rgba(255, 255, 255, 0.1);
    --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    
    /* Neon Effects */
    --neon-purple: #a855f7;
    --neon-pink: #ec4899;
    --neon-blue: #3b82f6;
    --neon-cyan: #06b6d4;
    
    /* Spacing */
    --space-xs: 0.5rem;
    --space-sm: 1rem;
    --space-md: 1.5rem;
    --space-lg: 2rem;
    --space-xl: 3rem;
    --space-2xl: 4rem;
    
    /* Border Radius */
    --radius-sm: 0.5rem;
    --radius-md: 1rem;
    --radius-lg: 1.5rem;
    --radius-xl: 2rem;
    --radius-full: 9999px;
    
    /* Transitions */
    --transition-fast: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-normal: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    
    /* Z-index */
    --z-dropdown: 1000;
    --z-sticky: 1020;
    --z-fixed: 1030;
    --z-modal-backdrop: 1040;
    --z-modal: 1050;
    --z-popover: 1060;
    --z-tooltip: 1070;
}

/* ===== GLOBAL STYLES ===== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    font-size: 16px;
    scroll-behavior: smooth;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
    overflow-x: hidden;
    position: relative;
    min-height: 100vh;
}

/* Background Pattern */
body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
        radial-gradient(circle at 20% 50%, rgba(120, 60, 237, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 20%, rgba(6, 182, 212, 0.3) 0%, transparent 50%);
    z-index: -1;
    animation: backgroundShift 20s ease-in-out infinite;
}

@keyframes backgroundShift {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-20px, -20px) scale(1.1); }
    66% { transform: translate(20px, -10px) scale(0.9); }
}

/* ===== TYPOGRAPHY ===== */
h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: var(--space-sm);
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

h1 { font-size: clamp(2.5rem, 5vw, 4rem); }
h2 { font-size: clamp(2rem, 4vw, 3rem); }
h3 { font-size: clamp(1.5rem, 3vw, 2rem); }
h4 { font-size: clamp(1.25rem, 2.5vw, 1.5rem); }
h5 { font-size: 1.25rem; }
h6 { font-size: 1rem; }

p {
    margin-bottom: var(--space-sm);
    color: var(--text-secondary);
}

a {
    color: var(--neon-blue);
    text-decoration: none;
    transition: var(--transition-fast);
}

a:hover {
    color: var(--neon-cyan);
    text-shadow: 0 0 10px currentColor;
}

/* ===== BUTTONS ===== */
.button, button, .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    border: none;
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: var(--transition-normal);
    position: relative;
    overflow: hidden;
    text-decoration: none;
    white-space: nowrap;
}

.button::before, button::before, .btn::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
}

.button:hover::before, button:hover::before, .btn:hover::before {
    width: 300px;
    height: 300px;
}

.button.primary, button.primary, .btn-primary {
    background: var(--primary-gradient);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.button.primary:hover, button.primary:hover, .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.button.secondary, button.secondary, .btn-secondary {
    background: var(--glass-bg);
    color: var(--text-primary);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(10px);
}

.button.secondary:hover, button.secondary:hover, .btn-secondary:hover {
    background: var(--glass-bg);
    border-color: var(--neon-purple);
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
}

/* ===== CARDS ===== */
.card {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    backdrop-filter: blur(10px);
    transition: var(--transition-normal);
    position: relative;
    overflow: hidden;
}

.card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--primary-gradient);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform var(--transition-normal);
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: var(--glass-shadow);
    border-color: var(--neon-purple);
}

.card:hover::before {
    transform: scaleX(1);
}

/* ===== FORMS ===== */
input, textarea, select {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--glass-bg);
    border: 2px solid var(--glass-border);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: 1rem;
    transition: var(--transition-fast);
    backdrop-filter: blur(10px);
}

input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: var(--neon-purple);
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.2);
    background: rgba(255, 255, 255, 0.08);
}

.form-group {
    margin-bottom: var(--space-md);
}

.form-group label {
    display: block;
    margin-bottom: var(--space-xs);
    font-weight: 600;
    color: var(--text-primary);
}

/* ===== MODALS ===== */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
    opacity: 0;
    visibility: hidden;
    transition: var(--transition-normal);
}

.modal.active {
    opacity: 1;
    visibility: visible;
}

.modal-content {
    background: var(--bg-secondary);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: var(--space-xl);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    transform: scale(0.9) translateY(20px);
    transition: var(--transition-normal);
    position: relative;
}

.modal.active .modal-content {
    transform: scale(1) translateY(0);
}

/* ===== ANIMATIONS ===== */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
}

@keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
}

@keyframes neonGlow {
    0%, 100% { 
        text-shadow: 
            0 0 10px currentColor,
            0 0 20px currentColor,
            0 0 30px currentColor;
    }
    50% { 
        text-shadow: 
            0 0 20px currentColor,
            0 0 30px currentColor,
            0 0 40px currentColor;
    }
}

.fade-in {
    animation: fadeIn 0.6s ease-out forwards;
}

.slide-in {
    animation: slideIn 0.4s ease-out forwards;
}

/* ===== LOADING STATES ===== */
.loading-indicator {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--bg-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
}

.spinner {
    width: 60px;
    height: 60px;
    border: 3px solid var(--glass-border);
    border-top-color: var(--neon-purple);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* ===== UTILITIES ===== */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.mt-1 { margin-top: var(--space-xs); }
.mt-2 { margin-top: var(--space-sm); }
.mt-3 { margin-top: var(--space-md); }
.mt-4 { margin-top: var(--space-lg); }
.mt-5 { margin-top: var(--space-xl); }

.mb-1 { margin-bottom: var(--space-xs); }
.mb-2 { margin-bottom: var(--space-sm); }
.mb-3 { margin-bottom: var(--space-md); }
.mb-4 { margin-bottom: var(--space-lg); }
.mb-5 { margin-bottom: var(--space-xl); }

.hidden { display: none !important; }
.invisible { visibility: hidden !important; }

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
    :root {
        font-size: 14px;
    }
    
    .hide-mobile { display: none !important; }
}

@media (max-width: 480px) {
    :root {
        font-size: 13px;
    }
}

/* ===== HOME BUTTON ===== */
.home-button {
    position: fixed;
    top: 2rem;
    left: 2rem;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--glass-bg);
    border: 2px solid var(--glass-border);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition-normal);
    z-index: var(--z-fixed);
    overflow: hidden;
}

.home-button img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.home-button:hover {
    transform: scale(1.1) rotate(5deg);
    border-color: var(--neon-purple);
    box-shadow: 0 0 30px rgba(168, 85, 247, 0.6);
}

/* ===== STAT CARDS ===== */
.stat-card {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    text-align: center;
    backdrop-filter: blur(10px);
    transition: var(--transition-normal);
    position: relative;
    overflow: hidden;
}

.stat-card::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    transform: rotate(45deg);
    transition: var(--transition-slow);
    opacity: 0;
}

.stat-card:hover::before {
    opacity: 1;
}

.stat-card.primary {
    border-color: rgba(102, 126, 234, 0.3);
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.stat-card.success {
    border-color: rgba(67, 233, 123, 0.3);
    background: linear-gradient(135deg, rgba(67, 233, 123, 0.1) 0%, rgba(56, 249, 215, 0.1) 100%);
}

.stat-card.warning {
    border-color: rgba(250, 112, 154, 0.3);
    background: linear-gradient(135deg, rgba(250, 112, 154, 0.1) 0%, rgba(254, 225, 64, 0.1) 100%);
}

.stat-card.info {
    border-color: rgba(79, 172, 254, 0.3);
    background: linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%);
}

.stat-icon {
    font-size: 3rem;
    margin-bottom: var(--space-sm);
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: var(--space-xs);
}

.stat-label {
    font-size: 1rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* ===== TABLES ===== */
.table-responsive {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: var(--space-md) 0;
}

table {
    width: 100%;
    border-collapse: collapse;
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    border-radius: var(--radius-md);
    overflow: hidden;
}

th, td {
    padding: var(--space-sm) var(--space-md);
    text-align: left;
    border-bottom: 1px solid var(--glass-border);
}

th {
    background: rgba(255, 255, 255, 0.05);
    font-weight: 600;
    color: var(--text-primary);
    text-transform: uppercase;
    font-size: 0.875rem;
    letter-spacing: 0.05em;
}

tr:hover {
    background: rgba(255, 255, 255, 0.03);
}

/* ===== NETWORK CANVAS ===== */
#network-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    opacity: 0.5;
}

/* ===== SEARCH BOX ===== */
.search-box {
    position: relative;
    margin-bottom: var(--space-md);
}

.search-box input {
    padding-left: 3rem;
    background: var(--glass-bg);
    border: 2px solid var(--glass-border);
    color: var(--text-primary);
}

.search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary);
}

/* ===== PAGINATION ===== */
.pagination {
    display: flex;
    justify-content: center;
    gap: var(--space-xs);
    margin-top: var(--space-lg);
}

.pagination button {
    padding: 0.5rem 1rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    color: var(--text-primary);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: var(--transition-fast);
}

.pagination button:hover:not(:disabled) {
    background: var(--glass-bg);
    border-color: var(--neon-purple);
    transform: translateY(-2px);
}

.pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* ===== ERROR MESSAGES ===== */
.error-message, .error {
    background: rgba(244, 59, 71, 0.1);
    border: 1px solid rgba(244, 59, 71, 0.3);
    color: #ff6b6b;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-md);
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.success-message, .success {
    background: rgba(67, 233, 123, 0.1);
    border: 1px solid rgba(67, 233, 123, 0.3);
    color: #43e97b;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-md);
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

/* ===== RESPONSIVE GRID ===== */
.grid {
    display: grid;
    gap: var(--space-md);
}

.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 768px) {
    .grid-cols-2,
    .grid-cols-3,
    .grid-cols-4 {
        grid-template-columns: 1fr;
    }
}

/* ===== BADGES ===== */
.badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    border-radius: var(--radius-full);
    background: var(--primary-gradient);
    color: white;
}

.badge.secondary {
    background: var(--secondary-gradient);
}

.badge.success {
    background: var(--success-gradient);
}

.badge.warning {
    background: var(--warning-gradient);
}

.badge.danger {
    background: var(--danger-gradient);
}

/* ===== TOOLTIPS ===== */
[data-tooltip] {
    position: relative;
    cursor: pointer;
}

[data-tooltip]::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.5rem 1rem;
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: var(--transition-fast);
    margin-bottom: 0.5rem;
    box-shadow: var(--glass-shadow);
}

[data-tooltip]:hover::after {
    opacity: 1;
}

/* ===== SCROLLBAR ===== */
::-webkit-scrollbar {
    width: 12px;
    height: 12px;
}

::-webkit-scrollbar-track {
    background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
    background: var(--glass-bg);
    border-radius: var(--radius-full);
    border: 2px solid var(--bg-secondary);
}

::-webkit-scrollbar-thumb:hover {
    background: var(--glass-border);
}

/* ===== SELECTION ===== */
::selection {
    background: var(--neon-purple);
    color: white;
}

::-moz-selection {
    background: var(--neon-purple);
    color: white;
}

/* ===== ADDITIONAL MODERN STYLES FOR CONSISTENCY ===== */

/* Quiz Game Specific */
.quiz-game-container {
    min-height: 100vh;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
}

.score-display {
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 1.5rem 2rem;
    backdrop-filter: blur(20px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    z-index: 100;
    animation: slideIn 0.6s ease-out;
}

.score-content {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
}

.score-label {
    font-size: 0.9rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.score-value {
    font-size: 2.5rem;
    font-weight: 800;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: pulse 2s infinite;
}

.score-total {
    font-size: 1.2rem;
    color: var(--text-tertiary);
}

.quiz-info {
    position: fixed;
    top: 2rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2rem;
    z-index: 100;
}

.question-counter, .timer-display {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-full);
    padding: 0.75rem 1.5rem;
    backdrop-filter: blur(20px);
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.timer-display {
    background: linear-gradient(135deg, rgba(244, 59, 71, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%);
    border-color: rgba(244, 59, 71, 0.3);
}

.timer-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ff6b6b;
}

.progress-container {
    width: 100%;
    max-width: 800px;
    margin-bottom: 3rem;
}

.progress-bar {
    position: relative;
    height: 30px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-full);
    overflow: hidden;
    backdrop-filter: blur(10px);
}

.progress {
    height: 100%;
    background: var(--primary-gradient);
    width: 0%;
    transition: width 0.5s ease-out;
    position: relative;
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.6);
}

.milestone {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-secondary);
    border: 2px solid var(--glass-border);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: var(--text-primary);
    z-index: 1;
}

.question-container {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 3rem;
    max-width: 800px;
    width: 100%;
    backdrop-filter: blur(20px);
    box-shadow: var(--glass-shadow);
    animation: fadeIn 0.6s ease-out;
}

.question-text {
    font-size: 1.8rem;
    margin-bottom: 2rem;
    text-align: center;
    color: var(--text-primary);
    line-height: 1.6;
}

.options-container {
    display: flex;
    gap: 2rem;
    justify-content: center;
}

.option-btn {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 3px solid var(--glass-border);
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 3rem;
    color: var(--text-primary);
    position: relative;
    overflow: hidden;
}

.option-btn.true-btn {
    background: linear-gradient(135deg, rgba(67, 233, 123, 0.1) 0%, rgba(56, 249, 215, 0.1) 100%);
    border-color: rgba(67, 233, 123, 0.3);
}

.option-btn.true-btn:hover {
    transform: scale(1.1);
    background: var(--success-gradient);
    color: white;
    box-shadow: 0 10px 30px rgba(67, 233, 123, 0.5);
}

.option-btn.false-btn {
    background: linear-gradient(135deg, rgba(244, 59, 71, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%);
    border-color: rgba(244, 59, 71, 0.3);
}

.option-btn.false-btn:hover {
    transform: scale(1.1);
    background: var(--danger-gradient);
    color: white;
    box-shadow: 0 10px 30px rgba(244, 59, 71, 0.5);
}

.celebration-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.celebration-content {
    background: var(--glass-bg);
    border: 2px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 3rem 4rem;
    text-align: center;
    backdrop-filter: blur(20px);
    box-shadow: 0 20px 60px rgba(168, 85, 247, 0.4);
}

.celebration-content h2 {
    font-size: 3rem;
    margin-bottom: 1rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.celebration-content p {
    font-size: 1.5rem;
    color: var(--text-primary);
}

.milestone-number {
    font-weight: 700;
    color: var(--neon-purple);
    text-shadow: 0 0 20px rgba(168, 85, 247, 0.8);
}

/* Admin Pages Styling */
.admin-container, .lesson-editor, .statistics-container, .history-container {
    min-height: 100vh;
    padding: 7rem 2rem 2rem;
    max-width: 1400px;
    margin: 0 auto;
    animation: fadeIn 0.6s ease-out;
}

.admin-container h1, .editor-header h1, .stats-header h1, .history-header h1 {
    font-size: clamp(2.5rem, 5vw, 4rem);
    text-align: center;
    margin-bottom: 3rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.admin-controls {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 3rem;
}

.admin-nav {
    display: flex;
    justify-content: center;
    margin-bottom: 3rem;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-full);
    color: var(--text-primary);
    text-decoration: none;
    transition: var(--transition-normal);
    backdrop-filter: blur(10px);
}

.nav-item:hover {
    background: var(--glass-bg);
    border-color: var(--neon-purple);
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(168, 85, 247, 0.3);
    color: var(--neon-purple);
}

.nav-item i {
    font-size: 1.2rem;
}

#lesson-list {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 2rem;
    backdrop-filter: blur(20px);
}

#lesson-list h2 {
    margin-bottom: 2rem;
    font-size: 2rem;
}

.lesson-item {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: var(--transition-normal);
}

.lesson-item:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--neon-purple);
    transform: translateX(5px);
    box-shadow: 0 5px 20px rgba(168, 85, 247, 0.2);
}

.lesson-info h3 {
    margin-bottom: 0.5rem;
    color: var(--text-primary);
}

.lesson-meta {
    display: flex;
    gap: 1rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.lesson-actions {
    display: flex;
    gap: 0.5rem;
}

/* Configuration Form Styling */
.configuration-form {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 2rem;
    backdrop-filter: blur(20px);
    max-width: 1000px;
    margin: 0 auto;
}

.configuration-form h2 {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    color: var(--text-primary);
    border-bottom: 1px solid var(--glass-border);
    padding-bottom: 1rem;
}

.form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.modern-input, .modern-select, .modern-textarea {
    width: 100%;
    padding: 1rem 1.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid var(--glass-border);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: 1rem;
    transition: var(--transition-fast);
}

.modern-input:focus, .modern-select:focus, .modern-textarea:focus {
    outline: none;
    border-color: var(--neon-purple);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
}

.image-upload-container {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.image-upload-container input[type="file"] {
    flex: 1;
}

.remove-image-btn {
    padding: 0.5rem 1rem;
    background: var(--danger-gradient);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: var(--transition-fast);
}

.remove-image-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(244, 59, 71, 0.4);
}

.help-text {
    font-size: 0.9rem;
    color: var(--text-tertiary);
    margin-left: 0.5rem;
}

.tags-input-container {
    position: relative;
}

.tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.tag-item {
    padding: 0.5rem 1rem;
    background: var(--primary-gradient);
    color: white;
    border-radius: var(--radius-full);
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    animation: fadeIn 0.3s ease-out;
}

.tag-item button {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0;
    margin: 0;
    line-height: 1;
}

/* Statistics Page Enhancements */
.stats-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.export-controls {
    display: flex;
    gap: 1rem;
}

.export-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--primary-gradient);
    color: white;
    border: none;
    border-radius: var(--radius-full);
    cursor: pointer;
    font-weight: 600;
    transition: var(--transition-normal);
}

.export-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
}

.stats-content-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
}

.stats-card, .history-card {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 2rem;
    backdrop-filter: blur(20px);
    box-shadow: var(--glass-shadow);
}

.stats-card h3, .history-card h3 {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    color: var(--text-primary);
}

.stats-card h3 i, .history-card h3 i {
    color: var(--neon-purple);
}

.chart-container {
    position: relative;
    height: 300px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

/* Table Styling */
.statistics-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: transparent;
}

.statistics-table th {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.875rem;
    letter-spacing: 0.05em;
    padding: 1rem;
    text-align: left;
    border-bottom: 2px solid var(--glass-border);
}

.statistics-table td {
    padding: 1rem;
    color: var(--text-secondary);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.statistics-table tr:hover {
    background: rgba(255, 255, 255, 0.03);
}

/* History Page Specific */
.history-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
}

.header-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
}

.delete-all-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--danger-gradient);
    color: white;
    border: none;
    border-radius: var(--radius-full);
    cursor: pointer;
    font-weight: 600;
    transition: var(--transition-normal);
}

.delete-all-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(244, 59, 71, 0.4);
}

.clear-btn {
    background: transparent;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition-fast);
}

.clear-btn:hover {
    color: var(--neon-purple);
}

.sortable {
    cursor: pointer;
    user-select: none;
}

.sortable i {
    margin-left: 0.5rem;
    font-size: 0.8rem;
    color: var(--text-tertiary);
}

.sortable:hover {
    color: var(--neon-purple);
}

/* Pagination */
.pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin-top: 2rem;
}

.pagination-container button {
    padding: 0.5rem 1rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    color: var(--text-primary);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: var(--transition-fast);
}

.pagination-container button:hover:not(:disabled) {
    background: var(--glass-bg);
    border-color: var(--neon-purple);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(168, 85, 247, 0.3);
}

.pagination-container button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.pagination-container button.active {
    background: var(--primary-gradient);
    color: white;
    border-color: transparent;
}

/* Gallery Specific Styles */
.gallery-container {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.gallery-layout {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 2rem;
    max-width: 1200px;
    width: 100%;
    backdrop-filter: blur(20px);
    box-shadow: var(--glass-shadow);
}

.gallery-main {
    position: relative;
    margin-bottom: 2rem;
}

.gallery-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: var(--glass-bg);
    border: 2px solid var(--glass-border);
    border-radius: 50%;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.5rem;
    color: var(--text-primary);
    transition: var(--transition-fast);
    backdrop-filter: blur(10px);
    z-index: 10;
}

.gallery-arrow:hover {
    background: var(--primary-gradient);
    color: white;
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);
}

.prev-arrow {
    left: -25px;
}

.next-arrow {
    right: -25px;
}

.gallery-content {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 500px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: var(--radius-lg);
    overflow: hidden;
}

.gallery-content img {
    max-width: 100%;
    max-height: 500px;
    object-fit: contain;
    cursor: zoom-in;
    transition: var(--transition-normal);
}

.image-counter {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-full);
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    color: var(--text-primary);
    backdrop-filter: blur(10px);
}

.gallery-preview {
    overflow-x: auto;
    padding: 0.5rem 0;
}

.preview-strip {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
}

.preview-item {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    border: 2px solid var(--glass-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    cursor: pointer;
    transition: var(--transition-fast);
    opacity: 0.6;
}

.preview-item:hover {
    opacity: 1;
    transform: scale(1.05);
    border-color: var(--neon-purple);
    box-shadow: 0 5px 15px rgba(168, 85, 247, 0.3);
}

.preview-item.active {
    opacity: 1;
    border-color: var(--neon-purple);
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
}

.preview-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Image Modal */
.image-modal {
    display: none;
    position: fixed;
    z-index: 2000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
}

.image-modal.active {
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-image {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
    border-radius: var(--radius-lg);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.close-modal {
    position: absolute;
    top: 2rem;
    right: 2rem;
    font-size: 3rem;
    color: var(--text-primary);
    cursor: pointer;
    transition: var(--transition-fast);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 50%;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
}

.close-modal:hover {
    transform: rotate(90deg) scale(1.1);
    color: var(--neon-purple);
    border-color: var(--neon-purple);
}

/* Admin Quiz Edit Styles */
.sortable-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.sortable-container h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 2rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.questions-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1rem;
}

.minimize-all-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-full);
    color: var(--text-primary);
    cursor: pointer;
    transition: var(--transition-fast);
    backdrop-filter: blur(10px);
}

.minimize-all-btn:hover {
    background: var(--glass-bg);
    border-color: var(--neon-purple);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(168, 85, 247, 0.3);
}

.add-question-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    padding: 1.5rem;
    margin-top: 2rem;
    background: var(--glass-bg);
    border: 2px dashed var(--glass-border);
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    cursor: pointer;
    transition: var(--transition-normal);
    font-weight: 600;
    font-size: 1.1rem;
}

.add-question-btn:hover {
    background: rgba(168, 85, 247, 0.1);
    border-color: var(--neon-purple);
    color: var(--neon-purple);
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(168, 85, 247, 0.3);
}

.text-editor-panel {
    position: fixed;
    right: 0;
    top: 0;
    height: 100vh;
    width: 400px;
    background: var(--bg-secondary);
    border-left: 1px solid var(--glass-border);
    transform: translateX(350px);
    transition: transform var(--transition-normal);
    z-index: 1000;
}

.text-editor-panel.active {
    transform: translateX(0);
}

.text-editor-toggle {
    position: absolute;
    left: -50px;
    top: 50%;
    transform: translateY(-50%);
    width: 50px;
    height: 100px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-right: none;
    border-radius: var(--radius-lg) 0 0 var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    backdrop-filter: blur(10px);
    transition: var(--transition-fast);
}

.text-editor-toggle:hover {
    background: rgba(168, 85, 247, 0.1);
    border-color: var(--neon-purple);
}

.text-editor-content {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.text-editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: var(--glass-bg);
    border-bottom: 1px solid var(--glass-border);
}

.text-editor-header h3 {
    margin: 0;
    font-size: 1.2rem;
}

.render-btn {
    padding: 0.5rem 1rem;
    background: var(--primary-gradient);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-weight: 600;
    transition: var(--transition-fast);
}

.render-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(168, 85, 247, 0.4);
}

.text-editor-container {
    flex: 1;
    padding: 1rem;
}

#text-editor {
    width: 100%;
    height: 100%;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
    padding: 1rem;
    color: var(--text-primary);
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    resize: none;
}

/* Mobile Responsive Adjustments */
@media (max-width: 768px) {
    .quiz-info {
        flex-direction: column;
        gap: 1rem;
        position: relative;
        top: auto;
        left: auto;
        transform: none;
        margin-bottom: 2rem;
    }
    
    .score-display {
        position: relative;
        top: auto;
        right: auto;
        margin-bottom: 1rem;
    }
    
    .options-container {
        flex-direction: column;
        gap: 1rem;
    }
    
    .option-btn {
        width: 100px;
        height: 100px;
        font-size: 2.5rem;
    }
    
    .stats-grid, .history-stats-grid {
        grid-template-columns: 1fr;
    }
    
    .stats-content-grid {
        grid-template-columns: 1fr;
    }
    
    .form-row {
        grid-template-columns: 1fr;
    }
    
    .text-editor-panel {
        width: 100%;
        transform: translateX(100%);
    }
    
    .text-editor-toggle {
        display: none;
    }
    
    .gallery-arrow {
        width: 40px;
        height: 40px;
        font-size: 1.2rem;
    }
    
    .mobile-hide {
        display: none;
    }
    
    .mobile-optional {
        display: none;
    }
    
    .header-controls {
        flex-direction: column;
        width: 100%;
    }
    
    .search-box {
        width: 100%;
    }
}

/* Loading Animation Improvements */
.loading-indicator {
    background: rgba(10, 10, 15, 0.95);
    backdrop-filter: blur(10px);
}

.loading-indicator p {
    margin-top: 1rem;
    font-size: 1.1rem;
    color: var(--text-primary);
    animation: pulse 2s infinite;
}

/* Review Lesson Modal Styling */
#review-lesson-modal {
    backdrop-filter: blur(10px);
}

#review-lesson-modal > div {
    background: var(--bg-secondary) !important;
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl) !important;
    padding: 2rem !important;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

#review-lesson-modal h2 {
    color: var(--text-primary);
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
}

#review-lesson-modal label {
    color: var(--text-primary);
    font-weight: 600;
    margin-bottom: 0.5rem;
    display: block;
}

#review-lesson-modal input,
#review-lesson-modal select {
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--glass-bg);
    border: 2px solid var(--glass-border);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-size: 1rem;
    transition: var(--transition-fast);
    margin-bottom: 1rem;
}

#review-lesson-modal input:focus,
#review-lesson-modal select:focus {
    outline: none;
    border-color: var(--neon-purple);
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
}

#review-lesson-modal .button {
    width: 100%;
    margin-top: 0.5rem;
}

#review-lesson-modal > div > span {
    color: var(--text-tertiary);
    transition: var(--transition-fast);
}

#review-lesson-modal > div > span:hover {
    color: var(--neon-purple);
    transform: rotate(90deg);
}

/* Fireworks Container */
.fireworks-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 3000;
}

.firework-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

/* Additional Hover Effects */
.button:active, button:active, .btn:active {
    transform: scale(0.98);
}

/* Smooth Scrollbar for Gallery */
.gallery-preview::-webkit-scrollbar {
    height: 8px;
}

.gallery-preview::-webkit-scrollbar-track {
    background: var(--glass-bg);
    border-radius: var(--radius-full);
}

.gallery-preview::-webkit-scrollbar-thumb {
    background: var(--glass-border);
    border-radius: var(--radius-full);
}

.gallery-preview::-webkit-scrollbar-thumb:hover {
    background: var(--neon-purple);
}

/* Message Styles */
.message {
    padding: 1rem 1.5rem;
    border-radius: var(--radius-md);
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    animation: slideIn 0.5s ease-out;
}

.success-message {
    background: rgba(67, 233, 123, 0.1);
    border: 1px solid rgba(67, 233, 123, 0.3);
    color: #43e97b;
}

.error-message {
    background: rgba(244, 59, 71, 0.1);
    border: 1px solid rgba(244, 59, 71, 0.3);
    color: #ff6b6b;
}

/* Make tables more modern */
table {
    border-radius: var(--radius-lg);
    overflow: hidden;
}

th:first-child {
    border-top-left-radius: var(--radius-lg);
}

th:last-child {
    border-top-right-radius: var(--radius-lg);
}

/* Input animations */
input, textarea, select {
    transition: all var(--transition-fast);
}

input:focus, textarea:focus, select:focus {
    transform: translateY(-2px);
}

/* Button group styling */
.modal-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
}

.modal-buttons button {
    flex: 1;
}

/* Add subtle animations to stat cards */
.stat-card {
    transition: all var(--transition-normal);
    cursor: pointer;
}

.stat-card:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

.stat-card:hover .stat-icon {
    transform: scale(1.1);
    animation: pulse 1s infinite;
}

.stat-icon {
    transition: transform var(--transition-fast);
}

/* ===== PROFILE PAGE STYLES ===== */
.profile-container {
    max-width: 1000px;
    margin: 7rem auto 2rem;
    padding: 2rem;
    animation: fadeIn 0.6s ease-out;
}

.profile-header {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 2.5rem;
    backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    gap: 2rem;
    margin-bottom: 2rem;
    position: relative;
    overflow: hidden;
}

.profile-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--primary-gradient);
}

.profile-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: var(--primary-gradient);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    font-weight: 800;
    box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);
    animation: pulse 3s infinite;
}

.profile-info h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.profile-info p {
    color: var(--text-secondary);
    font-size: 1.1rem;
}

.profile-rating {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.3rem;
    font-weight: 700;
}

.profile-rating .fas {
    color: var(--neon-purple);
    filter: drop-shadow(0 0 5px currentColor);
}

.profile-section {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 2rem;
    margin-bottom: 2rem;
    backdrop-filter: blur(20px);
    transition: var(--transition-normal);
}

.profile-section:hover {
    border-color: var(--neon-purple);
    box-shadow: 0 10px 30px rgba(168, 85, 247, 0.2);
}

.profile-section h2 {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.chart-container {
    position: relative;
    width: 100%;
    height: 350px;
    margin: 1.5rem 0;
    background: rgba(255, 255, 255, 0.02);
    border-radius: var(--radius-lg);
    padding: 1rem;
}

.rating-tiers {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1.5rem;
    justify-content: center;
}

.rating-tier {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-full);
    font-size: 0.9rem;
    transition: var(--transition-fast);
}

.rating-tier:hover {
    transform: translateY(-2px);
    border-color: var(--neon-purple);
    box-shadow: 0 5px 15px rgba(168, 85, 247, 0.3);
}

.tier-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    box-shadow: 0 0 10px currentColor;
}

.rating-history-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--glass-border);
    transition: var(--transition-fast);
}

.history-item:hover {
    background: rgba(255, 255, 255, 0.03);
    padding-left: 2rem;
}

.history-item:last-child {
    border-bottom: none;
}

.history-details strong {
    color: var(--text-primary);
    font-size: 1.1rem;
}

.history-details span {
    display: block;
    color: var(--text-tertiary);
    font-size: 0.9rem;
    margin-top: 0.25rem;
}

.history-change {
    font-weight: 700;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-full);
    font-size: 1rem;
    min-width: 80px;
    text-align: center;
}

.history-change.positive {
    background: rgba(67, 233, 123, 0.1);
    border: 1px solid rgba(67, 233, 123, 0.3);
    color: #43e97b;
}

.history-change.negative {
    background: rgba(244, 59, 71, 0.1);
    border: 1px solid rgba(244, 59, 71, 0.3);
    color: #ff6b6b;
}

.no-data {
    padding: 3rem;
    text-align: center;
    color: var(--text-secondary);
    font-style: italic;
}

/* ===== LEADERBOARD PAGE STYLES ===== */
.leaderboard-container {
    max-width: 1200px;
    margin: 7rem auto 2rem;
    padding: 2rem;
    animation: fadeIn 0.6s ease-out;
}

.leaderboard-header {
    text-align: center;
    margin-bottom: 3rem;
    animation: fadeIn 0.8s ease-out;
}

.leaderboard-header h1 {
    font-size: clamp(2.5rem, 5vw, 4rem);
    margin-bottom: 1rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.leaderboard-header p {
    color: var(--text-secondary);
    font-size: 1.2rem;
}

.leaderboard-filters {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 3rem;
    animation: fadeIn 1s ease-out;
}

.filter-button {
    padding: 0.75rem 2rem;
    font-size: 1rem;
    border: 2px solid var(--glass-border);
    border-radius: var(--radius-full);
    background: var(--glass-bg);
    color: var(--text-primary);
    cursor: pointer;
    transition: var(--transition-normal);
    backdrop-filter: blur(10px);
    font-weight: 600;
}

.filter-button:hover {
    border-color: var(--neon-purple);
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(168, 85, 247, 0.3);
}

.filter-button.active {
    background: var(--primary-gradient);
    color: white;
    border-color: transparent;
    box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);
}

.table-responsive-wrapper {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 0;
    backdrop-filter: blur(20px);
    overflow: hidden;
    box-shadow: var(--glass-shadow);
    animation: fadeIn 1.2s ease-out;
}

.leaderboard-table {
    width: 100%;
    border-collapse: collapse;
    background: transparent;
}

.leaderboard-table th {
    background: rgba(255, 255, 255, 0.05);
    padding: 1.5rem;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-primary);
    text-align: left;
    border-bottom: 2px solid var(--glass-border);
    font-weight: 700;
}

.leaderboard-table td {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: var(--text-secondary);
    vertical-align: middle;
    transition: var(--transition-fast);
}

.leaderboard-table tr {
    transition: var(--transition-fast);
}

.leaderboard-table tr:hover {
    background: rgba(255, 255, 255, 0.03);
}

.leaderboard-table tr:hover td {
    color: var(--text-primary);
}

.rank {
    font-weight: 700;
    font-size: 1.2rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.top-3 .rank {
    font-size: 1.5rem;
    font-weight: 800;
}

.medal {
    margin-right: 0.5rem;
    font-size: 1.5rem;
    filter: drop-shadow(0 0 5px currentColor);
    animation: pulse 2s infinite;
}

.gold { color: #FFD700; }
.silver { color: #C0C0C0; }
.bronze { color: #CD7F32; }

.user-profile {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.user-avatar {
    width: 45px;
    height: 45px;
    min-width: 45px;
    font-size: 1.2rem;
    font-weight: 700;
    background: var(--primary-gradient);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 5px 15px rgba(168, 85, 247, 0.3);
}

.user-profile a {
    color: var(--text-primary);
    text-decoration: none;
    font-weight: 600;
    transition: var(--transition-fast);
}

.user-profile a:hover {
    color: var(--neon-purple);
    text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
}

.rating-value {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--text-primary);
}

.rating-change {
    font-weight: 700;
    font-size: 1rem;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-full);
}

.rating-change.positive {
    background: rgba(67, 233, 123, 0.1);
    border: 1px solid rgba(67, 233, 123, 0.3);
    color: #43e97b;
}

.rating-change.negative {
    background: rgba(244, 59, 71, 0.1);
    border: 1px solid rgba(244, 59, 71, 0.3);
    color: #ff6b6b;
}

/* ===== LESSON PAGE STYLES ===== */
.lesson-container {
    min-height: 100vh;
    padding: 7rem 2rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    animation: fadeIn 0.6s ease-out;
}

#lesson-title {
    text-align: center;
    font-size: clamp(2.5rem, 5vw, 4rem);
    margin-bottom: 3rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: fadeIn 0.8s ease-out;
}

.lesson-image-container {
    margin-bottom: 3rem;
    text-align: center;
    animation: fadeIn 1s ease-out;
}

#lesson-image {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-xl);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    cursor: zoom-in;
    transition: var(--transition-normal);
}

#lesson-image:hover {
    transform: scale(1.02);
    box-shadow: 0 30px 60px rgba(168, 85, 247, 0.4);
}

/* Question sections styling */
#abcd-questions, #truefalse-questions, #number-questions {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 2.5rem;
    margin-bottom: 2rem;
    backdrop-filter: blur(20px);
    animation: fadeIn 1.2s ease-out;
}

#abcd-questions h3, #truefalse-questions h3, #number-questions h3 {
    font-size: 2rem;
    margin-bottom: 2rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

#submit-quiz-btn {
    display: block;
    margin: 3rem auto;
    padding: 1rem 3rem;
    background: var(--primary-gradient);
    color: white;
    border: none;
    border-radius: var(--radius-full);
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
    transition: var(--transition-normal);
    box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);
    animation: fadeIn 1.4s ease-out;
}

#submit-quiz-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(168, 85, 247, 0.6);
}

/* ===== SHARE LESSON PAGE STYLES ===== */
.share-container {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 3rem;
    max-width: 700px;
    width: 90%;
    backdrop-filter: blur(20px);
    box-shadow: var(--glass-shadow);
    text-align: center;
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
    animation: fadeIn 0.6s ease-out forwards;
}

.share-container.loaded {
    opacity: 1;
}

.share-container h1 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.share-container .lesson-image {
    max-width: 100%;
    height: auto;
    max-height: 300px;
    border-radius: var(--radius-lg);
    margin-bottom: 2rem;
    object-fit: cover;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.share-container .info {
    text-align: left;
    margin-bottom: 2.5rem;
    font-size: 1.1rem;
    color: var(--text-secondary);
}

.share-container .info p {
    margin: 1rem 0;
    display: flex;
    align-items: center;
}

.share-container .info svg {
    width: 24px;
    height: 24px;
    margin-right: 1rem;
    fill: var(--neon-purple);
}

.share-container .start-button {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--primary-gradient);
    color: white;
    padding: 1rem 2.5rem;
    border: none;
    border-radius: var(--radius-full);
    font-size: 1.2rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition: var(--transition-normal);
    box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);
}

.share-container .start-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(168, 85, 247, 0.6);
}

.user-history-section {
    margin-top: 3rem;
}

.user-history-section h2 {
    text-align: left;
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
    color: var(--text-primary);
    padding-top: 2rem;
    border-top: 1px solid var(--glass-border);
}

.user-history-section .history-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    margin-bottom: 1rem;
    text-align: left;
    transition: var(--transition-normal);
}

.user-history-section .history-card:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--neon-purple);
    transform: translateX(5px);
    box-shadow: 0 5px 20px rgba(168, 85, 247, 0.2);
}

.user-history-section .history-card p {
    margin: 0.5rem 0;
    font-size: 1rem;
    color: var(--text-secondary);
}

.user-history-section .history-card .score-line {
    font-size: 1.3rem;
    font-weight: 700;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.user-history-section .history-card .details-link {
    display: inline-block;
    margin-top: 1rem;
    font-size: 1rem;
    color: var(--neon-purple);
    text-decoration: none;
    transition: var(--transition-fast);
}

.user-history-section .history-card .details-link:hover {
    color: var(--neon-blue);
    text-shadow: 0 0 10px currentColor;
}

/* ===== RESULTS PAGE STYLES ===== */
.results-container {
    min-height: 100vh;
    padding: 7rem 2rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
    animation: fadeIn 0.6s ease-out;
    position: relative;
}

.results-header {
    text-align: center;
    margin-bottom: 3rem;
    animation: fadeIn 0.8s ease-out;
}

.results-header h1 {
    font-size: clamp(2.5rem, 5vw, 4rem);
    margin-bottom: 1rem;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.results-content {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: 2rem;
    backdrop-filter: blur(20px);
    animation: fadeIn 1.2s ease-out;
}

.sort-buttons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
}

.sort-btn {
    padding: 0.75rem 2rem;
    background: transparent;
    border: 2px solid var(--glass-border);
    border-radius: var(--radius-full);
    color: var(--text-primary);
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition-normal);
}

.sort-btn:hover {
    border-color: var(--neon-purple);
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(168, 85, 247, 0.3);
}

.sort-btn.active {
    background: var(--primary-gradient);
    color: white;
    border-color: transparent;
    box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);
}

.results-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Question result cards */
.question-result {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    transition: var(--transition-normal);
    animation: fadeIn 0.6s ease-out;
}

.question-result:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateX(5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.question-result.correct {
    border-left: 4px solid #43e97b;
}

.question-result.incorrect {
    border-left: 4px solid #ff6b6b;
}

.question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.question-number {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
}

.result-icon {
    font-size: 1.5rem;
    animation: pulse 2s infinite;
}

.result-icon.correct {
    color: #43e97b;
}

.result-icon.incorrect {
    color: #ff6b6b;
}

.question-text {
    font-size: 1.1rem;
    color: var(--text-secondary);
    margin-bottom: 1rem;
    line-height: 1.6;
}

.question-image {
    max-width: 100%;
    margin: 1rem 0;
    border-radius: var(--radius-md);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    cursor: zoom-in;
    transition: var(--transition-normal);
}

.question-image:hover {
    transform: scale(1.02);
    box-shadow: 0 10px 30px rgba(168, 85, 247, 0.3);
}

/* Multiple choice options styling */
.multiple-choice-options {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.option-item {
    padding: 1rem 1.5rem;
    border: 2px solid var(--glass-border);
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    color: var(--text-secondary);
    transition: var(--transition-fast);
    display: flex;
    align-items: center;
    gap: 1rem;
    position: relative;
    overflow: hidden;
}

.option-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: transparent;
    transition: var(--transition-fast);
}

.mc-icon {
    font-size: 1.2rem;
    min-width: 20px;
    text-align: center;
}

.option-item.correct-option {
    background: rgba(67, 233, 123, 0.1);
    border-color: rgba(67, 233, 123, 0.3);
    color: #43e97b;
}

.option-item.correct-option::before {
    background: #43e97b;
}

.option-item.correct-option .mc-icon {
    color: #43e97b;
    filter: drop-shadow(0 0 5px currentColor);
}

.option-item.incorrect-selected {
    background: rgba(244, 59, 71, 0.1);
    border-color: rgba(244, 59, 71, 0.3);
    color: #ff6b6b;
}

.option-item.incorrect-selected::before {
    background: #ff6b6b;
}

.option-item.incorrect-selected .mc-icon {
    color: #ff6b6b;
    filter: drop-shadow(0 0 5px currentColor);
}

/* Answer section */
.answer-section {
    margin-top: 1.5rem;
    padding: 1.5rem;
    background: rgba(168, 85, 247, 0.05);
    border: 1px solid rgba(168, 85, 247, 0.2);
    border-radius: var(--radius-md);
}

.answer-section h4 {
    color: var(--neon-purple);
    margin-bottom: 1rem;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.answer-section h4 i {
    font-size: 1rem;
}

/* User answer display */
.user-answer {
    margin-top: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-md);
}

.user-answer-label {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.user-answer-value {
    color: var(--text-secondary);
}

/* Rank display animations and styles */
#user-rank {
    transition: all 0.5s ease;
    min-height: 2.5em;
}

.rank-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2em;
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.numeric-rank {
    font-size: 0.8em;
    font-weight: normal;
    opacity: 0.8;
}

.tier-rank {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-weight: bold;
    text-shadow: 0 0 5px currentColor;
}

.tier-icon {
    font-size: 1.5em;
    margin-bottom: 0.2em;
    filter: drop-shadow(0 0 4px currentColor);
    animation: pulse 2s infinite;
}

.tier-name {
    font-size: 0.9em;
    white-space: nowrap;
}

.rank-revealed .rank-container {
    opacity: 1;
    transform: scale(1);
}

/* Tier-specific styling and animations */
[data-tier="thách-đấu"] .stat-card.warning {
    background: linear-gradient(135deg, rgba(255, 78, 255, 0.1) 0%, rgba(183, 0, 165, 0.1) 100%);
    border-color: rgba(255, 78, 255, 0.3);
    animation: challengerGlow 3s infinite;
}

[data-tier="cao-thủ"] .stat-card.warning {
    background: linear-gradient(135deg, rgba(255, 85, 85, 0.1) 0%, rgba(183, 0, 0, 0.1) 100%);
    border-color: rgba(255, 85, 85, 0.3);
}

[data-tier="tinh-anh"] .stat-card.warning {
    background: linear-gradient(135deg, rgba(140, 0, 255, 0.1) 0%, rgba(88, 0, 163, 0.1) 100%);
    border-color: rgba(140, 0, 255, 0.3);
}

[data-tier="kim-cương"] .stat-card.warning {
    background: linear-gradient(135deg, rgba(0, 170, 255, 0.1) 0%, rgba(0, 102, 204, 0.1) 100%);
    border-color: rgba(0, 170, 255, 0.3);
}

@keyframes challengerGlow {
    0% { box-shadow: 0 0 10px rgba(255, 78, 255, 0.5); }
    50% { box-shadow: 0 0 30px rgba(255, 78, 255, 0.8), 0 0 50px rgba(255, 78, 255, 0.4); }
    100% { box-shadow: 0 0 10px rgba(255, 78, 255, 0.5); }
}

[data-tier="thách-đấu"] .tier-icon {
    animation: challenger-shine 3s infinite;
}

[data-tier="cao-thủ"] .tier-icon,
[data-tier="tinh-anh"] .tier-icon,
[data-tier="kim-cương"] .tier-icon {
    animation: shimmer 2s infinite;
}

@keyframes challenger-shine {
    0% { 
        filter: drop-shadow(0 0 5px currentColor); 
        transform: scale(1) rotate(0deg);
    }
    25% { 
        filter: drop-shadow(0 0 10px currentColor);
        transform: scale(1.1) rotate(5deg);
    }
    50% { 
        filter: drop-shadow(0 0 15px currentColor);
        transform: scale(1.15) rotate(0deg);
    }
    75% { 
        filter: drop-shadow(0 0 10px currentColor);
        transform: scale(1.1) rotate(-5deg);
    }
    100% { 
        filter: drop-shadow(0 0 5px currentColor);
        transform: scale(1) rotate(0deg);
    }
}

@keyframes shimmer {
    0% { filter: drop-shadow(0 0 3px currentColor); }
    50% { filter: drop-shadow(0 0 7px currentColor); }
    100% { filter: drop-shadow(0 0 3px currentColor); }
}

/* Particles for special effects */
.particles-container {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    pointer-events: none;
    z-index: 10;
}

.particle {
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 50%;
    pointer-events: none;
}

/* Confetti animations */
@keyframes confettiFall {
    0% { 
        transform: translateY(0) rotate(var(--rotation, 0deg)); 
        opacity: var(--opacity, 0.8);
    }
    70% {
        opacity: var(--opacity, 0.8);
    }
    100% { 
        transform: translateY(100vh) rotate(var(--rotation, 0deg));
        opacity: 0;
    }
}

/* Mobile responsive */
@media (max-width: 768px) {
    .results-container {
        padding: 5rem 1rem 2rem;
    }
    
    .results-header h1 {
        font-size: 2rem;
    }
    
    .sort-buttons {
        gap: 0.5rem;
    }
    
    .sort-btn {
        padding: 0.5rem 1.5rem;
        font-size: 0.9rem;
    }
    
    .question-result {
        padding: 1rem;
    }
    
    .question-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
}

@media (max-width: 480px) {
    .sort-btn {
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
    }
    
    .option-item {
        padding: 0.75rem 1rem;
    }
}

/* ===== NAVIGATION STYLES ===== */
.main-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 1rem 2rem;
    background: rgba(10, 10, 15, 0.8);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--glass-border);
    z-index: var(--z-sticky);
    transition: var(--transition-normal);
}

.nav-container {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-logo {
    font-size: 1.5rem;
    font-weight: 800;
    text-decoration: none;
    transition: var(--transition-fast);
}

.logo-gradient {
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.nav-logo:hover {
    transform: scale(1.05);
}

.nav-links {
    display: flex;
    gap: 2rem;
    align-items: center;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary);
    text-decoration: none;
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-full);
    transition: var(--transition-fast);
    position: relative;
}

.nav-link:hover {
    background: var(--glass-bg);
    color: var(--neon-purple);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(168, 85, 247, 0.3);
}

.nav-link i {
    font-size: 1.1rem;
}

.nav-mobile-toggle {
    display: none;
    color: var(--text-primary);
    font-size: 1.5rem;
    cursor: pointer;
    transition: var(--transition-fast);
}

.nav-mobile-toggle:hover {
    color: var(--neon-purple);
}

/* Navigation Responsive */
@media (max-width: 768px) {
    .nav-links {
        position: fixed;
        top: 70px;
        left: 0;
        right: 0;
        background: var(--bg-secondary);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid var(--glass-border);
        flex-direction: column;
        padding: 1rem;
        gap: 0.5rem;
        transform: translateY(-100%);
        opacity: 0;
        transition: all var(--transition-normal);
        z-index: -1;
    }
    
    .nav-links.active {
        transform: translateY(0);
        opacity: 1;
        z-index: 999;
    }
    
    .nav-link {
        width: 100%;
        justify-content: center;
    }
    
    .nav-mobile-toggle {
        display: block;
    }
}

@media (max-width: 480px) {
    .main-nav {
        padding: 1rem;
    }
    
    .nav-logo {
        font-size: 1.2rem;
    }
    
    .nav-link span {
        display: none;
    }
    
    .nav-link {
        padding: 0.75rem;
    }
    
    .nav-links {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
    }
}

/* ===== ADDITIONAL MODERN STYLES FOR CONSISTENCY ===== */
/* ===== ENHANCED MODERN ANIMATIONS ===== */
@keyframes floatElement {
    0% {
        transform: translateY(110vh) rotate(0deg);
        opacity: 0;
    }
    10% {
        opacity: 0.08;
    }
    90% {
        opacity: 0.08;
    }
    100% {
        transform: translateY(-110vh) rotate(360deg);
        opacity: 0;
    }
}

@keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

@keyframes iconBounce {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-5px) scale(1.1); }
}

@keyframes checkPulse {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

@keyframes xShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}

@keyframes answerReveal {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes challengerSpin {
    0% { transform: rotate(0deg) scale(1); }
    25% { transform: rotate(5deg) scale(1.1); }
    50% { transform: rotate(0deg) scale(1.2); }
    75% { transform: rotate(-5deg) scale(1.1); }
    100% { transform: rotate(0deg) scale(1); }
}

@keyframes tierPulse {
    0%, 100% { 
        transform: scale(1); 
        filter: drop-shadow(0 0 8px currentColor);
    }
    50% { 
        transform: scale(1.15); 
        filter: drop-shadow(0 0 15px currentColor);
    }
}

/* ===== ENHANCED GLASSMORPHISM EFFECTS ===== */
.glass-card-modern {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.glass-hover-effect {
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.glass-hover-effect:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3),
                0 0 60px rgba(168, 85, 247, 0.2);
}

/* ===== MODERN GRADIENT TEXT ===== */
.gradient-text-animated {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #667eea 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientShift 8s ease infinite;
}

/* ===== ENHANCED BUTTONS ===== */
.button-modern {
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.button-modern::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    transition: all 0.5s ease;
}

.button-modern:hover::before {
    width: 300px;
    height: 300px;
}

/* ===== ENHANCED RESULTS STYLING ===== */
.result-card-modern {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 2rem;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    position: relative;
    overflow: hidden;
}

.result-card-modern::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #667eea, #764ba2, #f093fb, transparent);
    animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

/* ===== FLOATING PARTICLES ===== */
.particle-effect {
    position: absolute;
    pointer-events: none;
    animation: particleFloat 4s linear infinite;
}

@keyframes particleFloat {
    0% {
        transform: translateY(0) translateX(0) scale(1);
        opacity: 0.8;
    }
    25% {
        transform: translateY(-30px) translateX(10px) scale(1.1);
    }
    50% {
        transform: translateY(-50px) translateX(-10px) scale(0.9);
    }
    75% {
        transform: translateY(-30px) translateX(5px) scale(1.05);
    }
    100% {
        transform: translateY(0) translateX(0) scale(1);
        opacity: 0;
    }
}

/* ===== NEON GLOW EFFECTS ===== */
.neon-glow-purple {
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.5),
                inset 0 0 20px rgba(168, 85, 247, 0.1);
}

.neon-glow-blue {
    box-shadow: 0 0 20px rgba(79, 172, 254, 0.5),
                inset 0 0 20px rgba(79, 172, 254, 0.1);
}

.neon-glow-pink {
    box-shadow: 0 0 20px rgba(236, 72, 153, 0.5),
                inset 0 0 20px rgba(236, 72, 153, 0.1);
}

.neon-glow-green {
    box-shadow: 0 0 20px rgba(67, 233, 123, 0.5),
                inset 0 0 20px rgba(67, 233, 123, 0.1);
}

/* ===== ENHANCED QUESTION RESULT CARDS ===== */
.question-result-modern {
    animation: questionSlideIn 0.6s ease-out;
    animation-fill-mode: both;
}

@keyframes questionSlideIn {
    from {
        opacity: 0;
        transform: translateX(-50px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateX(0) scale(1);
    }
}

.question-result-modern:nth-child(1) { animation-delay: 0.1s; }
.question-result-modern:nth-child(2) { animation-delay: 0.2s; }
.question-result-modern:nth-child(3) { animation-delay: 0.3s; }
.question-result-modern:nth-child(4) { animation-delay: 0.4s; }
.question-result-modern:nth-child(5) { animation-delay: 0.5s; }
.question-result-modern:nth-child(6) { animation-delay: 0.6s; }
.question-result-modern:nth-child(7) { animation-delay: 0.7s; }
.question-result-modern:nth-child(8) { animation-delay: 0.8s; }
.question-result-modern:nth-child(9) { animation-delay: 0.9s; }
.question-result-modern:nth-child(10) { animation-delay: 1s; }

/* ===== ENHANCED MOBILE RESPONSIVE ===== */
@media (max-width: 768px) {
    .gradient-text-animated {
        font-size: clamp(2rem, 8vw, 3rem);
    }
    
    .result-card-modern {
        padding: 1.5rem;
        border-radius: 16px;
    }
    
    .stat-card {
        padding: 1.5rem;
    }
    
    .floating-element {
        font-size: 1.5rem;
    }
}

@media (max-width: 480px) {
    .button-modern {
        padding: 0.6rem 1.2rem;
        font-size: 0.9rem;
    }
    
    .result-card-modern {
        padding: 1rem;
    }
}

/* ===== SMOOTH SCROLL ANIMATIONS ===== */
.scroll-reveal {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.scroll-reveal.revealed {
    opacity: 1;
    transform: translateY(0);
}

/* ===== CONFETTI ANIMATION ===== */
.confetti {
    position: fixed;
    width: 10px;
    height: 10px;
    position: absolute;
    animation: confettiFall linear forwards;
    border-radius: 2px;
}

.confetti:nth-child(odd) {
    transform: rotate(45deg);
}

@keyframes confettiFall {
    0% { 
        transform: translateY(-100vh) rotate(0deg); 
        opacity: 1;
    }
    100% { 
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
    }
}

/* ===== ENHANCED LOADING STATES ===== */
.loading-modern {
    position: relative;
    overflow: hidden;
}

.loading-modern::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
        transparent, 
        rgba(255, 255, 255, 0.2), 
        transparent
    );
    animation: loadingShimmer 2s infinite;
}

@keyframes loadingShimmer {
    0% { left: -100%; }
    100% { left: 100%; }
}

/* ===== ADDITIONAL MODERN STYLES FOR CONSISTENCY ===== */

/* ===== MODERN HOVER STATES ===== */
.hover-lift {
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.hover-lift:hover {
    transform: translateY(-5px);
}

.hover-glow:hover {
    box-shadow: 0 10px 40px rgba(168, 85, 247, 0.4);
}

/* ===== VIBRANT COLOR UTILITIES ===== */
.bg-gradient-purple {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.bg-gradient-pink {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.bg-gradient-blue {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.bg-gradient-green {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

/* ===== MODERN CARD VARIATIONS ===== */
.card-glow {
    position: relative;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    overflow: hidden;
}

.card-glow::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c);
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
}

.card-glow:hover::before {
    opacity: 0.5;
}

/* ===== ANIMATED BACKGROUNDS ===== */
.bg-animated {
    background-size: 200% 200%;
    animation: bgMove 15s ease infinite;
}

@keyframes bgMove {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* ===== MODERN TEXT EFFECTS ===== */
.text-glow {
    text-shadow: 0 0 20px currentColor;
}

.text-outline {
    -webkit-text-stroke: 2px currentColor;
    -webkit-text-fill-color: transparent;
}

/* ===== ENHANCED FORM ELEMENTS ===== */
input.modern, 
textarea.modern, 
select.modern {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    color: white;
    transition: all 0.3s ease;
}

input.modern:focus, 
textarea.modern:focus, 
select.modern:focus {
    background: rgba(255, 255, 255, 0.08);
    border-color: #a855f7;
    box-shadow: 0 0 30px rgba(168, 85, 247, 0.4);
    transform: translateY(-2px);
}

/* ===== RANK TIER COLORS ===== */
.tier-challenger { color: #FF4EFF; }
.tier-grandmaster { color: #FF5555; }
.tier-master { color: #8C00FF; }
.tier-diamond { color: #00AAFF; }
.tier-platinum { color: #00D4A4; }
.tier-gold { color: #FFD700; }
.tier-silver { color: #C0C0C0; }
.tier-bronze { color: #CD7F32; }

/* ===== MODERN ANIMATIONS ===== */
@keyframes float-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
}

@keyframes rotate-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes scale-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

/* ===== UTILITY CLASSES ===== */
.blur-bg { backdrop-filter: blur(20px); }
.blur-sm { backdrop-filter: blur(10px); }
.blur-lg { backdrop-filter: blur(30px); }

.shadow-neon-purple { box-shadow: 0 0 30px rgba(168, 85, 247, 0.5); }
.shadow-neon-pink { box-shadow: 0 0 30px rgba(236, 72, 153, 0.5); }
.shadow-neon-blue { box-shadow: 0 0 30px rgba(79, 172, 254, 0.5); }
.shadow-neon-green { box-shadow: 0 0 30px rgba(67, 233, 123, 0.5); }

/* ===== MODERN TRANSITIONS ===== */
.transition-bounce {
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.transition-smooth {
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
} paste-4.txt->txt->let displayedLessons = []; // Renamed from allLessons
let allTags = []; // To store tags fetched from API
let currentPage = 1;
const lessonsPerPage = 10; // Adjust as needed
let totalLessons = 0;
let currentSearch = '';
let currentSort = 'newest';
let isLoading = false;
let currentStudent = null; // Store student info

// Function to show/hide loader
function showLoader(show) {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.classList.toggle('hidden', !show);
    }
}

// Fetch all unique tags
async function loadTags() {
    try {
        const response = await fetch('/api/tags');
        if (!response.ok) throw new Error('Failed to fetch tags');
        allTags = await response.json();
        renderTagsList(); // Render tags once fetched
    } catch (error) {
        console.error('Error loading tags:', error);
    }
}

async function loadLessons() {
    if (isLoading) return; // Prevent concurrent loads
    isLoading = true;
    showLoader(true);
    try {
        // Construct API URL with parameters
        const params = new URLSearchParams({
            page: currentPage,
            limit: lessonsPerPage,
            sort: currentSort
        });
        if (currentSearch) {
            params.append('search', currentSearch);
        }
        
        const response = await fetch(`/api/lessons?${params.toString()}`);
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Failed to fetch lessons: ${response.status} ${errorData}`);
        }
        
        const data = await response.json();
        console.log('Loaded lessons page:', data);
        
        displayedLessons = data.lessons || [];
        totalLessons = data.total || 0;
        
        renderLessons(displayedLessons); // Render only the current page's lessons
        updatePaginationControls();

        // Do NOT update tags here, tags are loaded separately

    } catch (error) {
        console.error('Error loading lessons:', error);
        const lessonsContainer = document.getElementById('lessons');
        if (lessonsContainer) {
            lessonsContainer.innerHTML = `<p class="error-message">Error loading lessons: ${error.message}. Please try again later.</p>`;
        }
    } finally {
        showLoader(false);
        isLoading = false;
    }
}

// Modified function: Now just triggers a reload by resetting page and calling loadLessons
function filterAndRenderLessons() {
    currentSearch = document.getElementById('search-input').value.toLowerCase();
    currentSort = document.getElementById('sort-select').value;
    currentPage = 1; // Reset to first page for new search/sort
    loadLessons(); // Fetch data from backend with new filters
}

// Modified function: Renders tags fetched from /api/tags
function renderTagsList() {
    const tagsContainer = document.querySelector('.tags-container');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = ''; // Clear previous tags
    
    // Add heading
    const heading = document.createElement('h3');
    heading.textContent = 'Tags phổ biến';
    tagsContainer.appendChild(heading);
    
    const tagsList = document.createElement('div');
    tagsList.className = 'tags-list';
    
    allTags.forEach(tag => {
        const tagButton = document.createElement('button');
        tagButton.className = 'tag-filter';
        tagButton.textContent = tag;
        tagButton.onclick = () => {
            document.getElementById('search-input').value = tag; 
            filterAndRenderLessons(); // Trigger search with this tag
        };
        tagsList.appendChild(tagButton);
    });
    
    tagsContainer.appendChild(tagsList);
}

function closeModal() {
    const modal = document.getElementById('user-info-modal');
    modal.classList.remove('show');
}

// --- Check student authentication (optional) ---
async function checkStudentAuthentication() {
    console.log('DEBUG: checkStudentAuthentication called - 2025-07-01 17:54');
    try {
        const response = await fetch('/api/check-student-auth');
        if (!response.ok) {
            // If API fails, assume not logged in
            console.log('Auth check failed, user not authenticated');
            return false;
        }
        const authData = await response.json();

        if (authData.isAuthenticated && authData.student) {
            currentStudent = authData.student;
            console.log('Student authenticated:', currentStudent.name);
            return true; // Authenticated
        } else {
            // Not authenticated - this is OK for public pages
            console.log('Student not authenticated - continuing without redirect');
            return false; // Not authenticated
        }
    } catch (error) {
        console.error('Error checking student authentication:', error);
        // Don't redirect on error for public pages
        console.log('Auth error - continuing without redirect');
        return false; // Treat error as not authenticated
    }
}

// --- NEW: Handle logout ---
async function handleLogout() {
    try {
        const response = await fetch('/api/student/logout', { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            console.log('Logout successful');
            window.location.href = '/student/login'; // Redirect to login page after logout
        } else {
            alert('Logout failed: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('An error occurred during logout.');
    }
}

// --- MODIFIED: Start Lesson - Remove modal, rely on session ---
function startLesson(lessonId) {
    // No modal needed, authentication is checked on page load
    // Simply navigate to the lesson page
    window.location.href = `/lesson/${lessonId}`;
}

// Modified function: Renders only the lessons passed to it
function renderLessons(lessonsToRender) {
    const lessonsContainer = document.getElementById('lessons');
    
    // **Important**: Clear container ONLY when loading page 1
    if (currentPage === 1) {
         lessonsContainer.innerHTML = '';
    }
    
    if (lessonsToRender.length === 0 && currentPage === 1) {
        const noResults = document.createElement('p');
        noResults.className = 'no-results';
        noResults.textContent = 'No results found';
        lessonsContainer.innerHTML = '';
        lessonsContainer.appendChild(noResults);
        return;
    }

    lessonsToRender.forEach(lesson => {
        const lessonDiv = document.createElement('div');
        lessonDiv.className = 'lesson-card';
        lessonDiv.style.setProperty('--lesson-bg', lesson.color || '#a4aeff');
        
        const tagsHtml = lesson.tags ? 
            `<div class="lesson-tags">
                ${lesson.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>` : '';
        
        // Add lesson image or placeholder in a container
        const imageHtml = `
            <div class="lesson-image-container">
                ${lesson.lessonImage ? 
                    `<img src="${lesson.lessonImage}" alt="${lesson.title}" class="lesson-image">` :
                    `<div class="lesson-image-placeholder">📚</div>`
                }
            </div>`;
        
        lessonDiv.innerHTML = `
            <div class="lesson-content">
                <h3>${lesson.title}</h3>
                <button onclick="startLesson('${lesson.id}')" class="start-btn">
                    Làm bài
                </button>
            </div>
            ${imageHtml}
            ${tagsHtml}
        `;
        lessonsContainer.appendChild(lessonDiv);
    });
}

// --- PAGINATION FUNCTIONS ---
function updatePaginationControls() {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return; // Exit if container doesn't exist

    paginationContainer.innerHTML = ''; // Clear existing controls
    const totalPages = Math.ceil(totalLessons / lessonsPerPage);

    if (totalPages <= 1) return; // No controls needed for 0 or 1 page

    // Previous Button
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Trước';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            loadLessons();
        }
    };
    paginationContainer.appendChild(prevButton);

    // Page Number Indicator (Simple version)
    const pageInfo = document.createElement('span');
    pageInfo.textContent = ` Trang ${currentPage} trên ${totalPages} `;
    pageInfo.style.margin = '0 10px'; // Add some spacing
    paginationContainer.appendChild(pageInfo);

    // Next Button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Tiếp';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadLessons();
        }
    };
    paginationContainer.appendChild(nextButton);
}

// Create pagination container dynamically if it doesn't exist
function ensurePaginationContainer() {
    let container = document.getElementById('pagination-controls');
    if (!container) {
        container = document.createElement('div');
        container.id = 'pagination-controls';
        container.style.textAlign = 'center'; // Center the controls
        container.style.marginTop = '20px'; // Add space above
        // Insert it after the lessons container
        const lessonsDiv = document.getElementById('lessons');
        if (lessonsDiv && lessonsDiv.parentNode) {
            lessonsDiv.parentNode.insertBefore(container, lessonsDiv.nextSibling);
        } else {
            // Fallback: append to main content
            const mainContent = document.querySelector('.main-content');
            mainContent?.appendChild(container);
        }
    }
}
// --- END PAGINATION FUNCTIONS ---

// Check admin authentication status
async function checkAdminAuth() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        return data.isAuthenticated;
    } catch (error) {
        console.error('Error checking auth status:', error);
        return false;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    // --- Check authentication status (optional for public pages) ---
    const isAuthenticated = await checkStudentAuthentication();
    // Continue loading page regardless of authentication status
    // --- END NEW ---

    ensurePaginationContainer(); // Make sure the pagination div exists
    // Show loader immediately while data loads
    showLoader(true); 
    
    // Load tags then lessons
    await loadTags();
    await loadLessons();
    
    // Add event listener for search input with debounce
    const searchInput = document.getElementById('search-input');
    let debounceTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(filterAndRenderLessons, 2000);
    });
    
    // Add event listener for sort select
    document.getElementById('sort-select').addEventListener('change', filterAndRenderLessons);

    // Dark mode toggle
    const darkModeLink = document.querySelector('.dark-mode-link');
    if (darkModeLink) {
        darkModeLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.toggle('dark-mode');
            // Store preference
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDarkMode);
        });

        // Check for saved dark mode preference
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }
    }
    
    // Editor mode link protection
    const editorLink = document.querySelector('.editor-link');
    if (editorLink) {
        editorLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const isAuthenticated = await checkAdminAuth();
            if (!isAuthenticated) {
                window.location.href = '/admin/login';
            } else {
                window.location.href = '/admin';
            }
        });
    }
});
### claude:
Looking at your request for a more professional educational platform design, I'll redesign the UI to be more suitable for learning, taking inspiration from successful platforms like Brilliant, Khan Academy, and Skillshare. I'll implement a cleaner, more focused design that reduces distractions while maintaining modern appeal.
### 用户:
Continue
