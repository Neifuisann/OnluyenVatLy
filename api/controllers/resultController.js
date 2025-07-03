const databaseService = require('../services/databaseService');
const ratingService = require('../services/ratingService');
const sessionService = require('../services/sessionService');
const { asyncHandler, NotFoundError, ValidationError, AuthorizationError } = require('../middleware/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

class ResultController {
  // Submit lesson result
  submitResult = asyncHandler(async (req, res) => {
    const { lessonId, answers, timeTaken, studentInfo } = req.body;
    const sessionData = sessionService.getSessionData(req);

    // Get lesson to validate answers
    const lesson = await databaseService.getLessonById(lessonId);

    // Calculate score and process answers
    let score = 0;
    let totalPoints = 0;

    // Calculate score from the answers
    if (answers && Array.isArray(answers)) {
      answers.forEach(answer => {
        if (answer.earnedPoints) {
          score += answer.earnedPoints;
        }
        if (answer.points) {
          totalPoints += answer.points;
        }
      });
    }

    // Prepare result data matching the database schema
    const resultData = {
      id: Date.now().toString(),
      lessonId,
      student_id: sessionData.studentId, // Use student_id to match schema
      questions: answers, // Use 'questions' column name, not 'answers'
      score,
      totalPoints,
      studentInfo,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
    };

    // Debug: Log the exact data being sent to database
    console.log('🔍 Result data being sent to database:', JSON.stringify(resultData, null, 2));

    const savedResult = await databaseService.createResult(resultData);
    
    // Update rating if student is authenticated
    let ratingUpdate = null;
    if (sessionData.studentId && score > 0) {
      try {
        ratingUpdate = await ratingService.updateStudentRating(
          sessionData.studentId,
          lessonId,
          score,
          totalPoints,
          timeTaken,
          0 // streak would need to be calculated
        );
      } catch (error) {
        console.error('Rating update failed:', error);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Result submitted successfully',
      resultId: savedResult.id,
      score,
      totalPoints,
      rating: ratingUpdate
    });
  });

  // Custom middleware for result access control
  requireResultAccess = asyncHandler(async (req, res, next) => {
    const isAdmin = sessionService.isAdminAuthenticated(req);
    const isStudent = sessionService.isStudentAuthenticated(req);

    if (!isAdmin && !isStudent) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    // If admin, allow access
    if (isAdmin) {
      return next();
    }

    // If student, check if they own the result
    if (isStudent) {
      const { id } = req.params;
      const result = await databaseService.getResultById(id);
      const studentId = req.session.studentId;

      // Convert both to strings for comparison to handle type mismatches
      if (String(result.student_id) !== String(studentId)) {
        console.log(`Access denied: studentId ${studentId} trying to access result owned by ${result.student_id}`);
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Access denied: can only access own results'
        });
      }

      // Store the result in req for reuse in the main handler
      req.resultData = result;
    }

    next();
  });

  // Get result by ID
  getResultById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Use cached result from middleware if available, otherwise fetch
    const result = req.resultData || await databaseService.getResultById(id);

    res.json({
      success: true,
      data: {
        result
      }
    });
  });

  // Delete result (admin only)
  deleteResult = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    await databaseService.deleteResult(id);
    
    res.json({
      success: true,
      message: SUCCESS_MESSAGES.DELETE_SUCCESS
    });
  });

  // Get all results (admin only)
  getAllResults = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    
    // This would need to be implemented in databaseService
    // For now, return empty array
    const results = [];
    
    res.json({
      success: true,
      data: {
        results,
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0
      }
    });
  });

  // Get results by lesson (admin only)
  getResultsByLesson = asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const { limit = 100 } = req.query;
    
    const results = await databaseService.getLessonResults(lessonId);
    
    // Limit results if specified
    const limitedResults = limit ? results.slice(0, parseInt(limit)) : results;
    
    res.json({
      success: true,
      data: {
        results: limitedResults,
        total: results.length,
        lessonId
      }
    });
  });

  // Get results by student (admin or owner access)
  getResultsByStudent = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // This would need to be implemented in databaseService
    // For now, return empty array
    const results = [];
    
    res.json({
      success: true,
      data: {
        results,
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        studentId
      }
    });
  });

  // Get result statistics
  getResultStatistics = asyncHandler(async (req, res) => {
    // This would calculate overall result statistics
    const statistics = {
      totalResults: 0,
      averageScore: 0,
      completionRate: 0,
      averageTime: 0,
      topPerformingLessons: [],
      recentActivity: []
    };
    
    res.json({
      success: true,
      data: {
        statistics
      }
    });
  });
}

module.exports = new ResultController();