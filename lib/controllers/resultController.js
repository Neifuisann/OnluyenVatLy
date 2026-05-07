const databaseService = require('../services/databaseService');
const ratingService = require('../services/ratingService');
const sessionService = require('../services/sessionService');
const { asyncHandler, NotFoundError, ValidationError, AuthorizationError } = require('../middleware/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

class ResultController {
  // Submit lesson result
  submitResult = asyncHandler(async (req, res) => {
    const { lessonId, answers, timeTaken, studentInfo, mode = 'test' } = req.body;
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

    // Round score and totalPoints to 2 decimal places (.01 precision)
    score = Math.round(score * 100) / 100;
    totalPoints = Math.round(totalPoints * 100) / 100;

    // Debug logging for score calculation
    console.log('🔍 Result Controller - Score Calculation:', {
      score,
      totalPoints,
      answersCount: answers ? answers.length : 0,
      answers: answers ? answers.map(a => ({
        type: a.type,
        points: a.points,
        earnedPoints: a.earnedPoints,
        isCorrect: a.isCorrect
      })) : []
    });

    // Ensure all numeric values in answers are properly formatted
    const processedAnswers = answers ? answers.map(answer => ({
      ...answer,
      points: typeof answer.points === 'number' ? Math.round(answer.points * 100) / 100 : answer.points,
      earnedPoints: typeof answer.earnedPoints === 'number' ? Math.round(answer.earnedPoints * 100) / 100 : answer.earnedPoints
    })) : [];

    // Prepare result data matching the database schema with snake_case columns
    const resultData = {
      id: Date.now().toString(),
      lesson_id: lessonId, // Changed to snake_case
      student_id: sessionData.studentId,
      questions: processedAnswers, // Use 'questions' column name, not 'answers'
      score,
      total_points: totalPoints, // Changed to snake_case
      student_info: {
        ...studentInfo,
        examGuardFlags: req.body.examGuardFlags || [] // Store flags in student_info as fallback
      }, // Changed to snake_case
      timestamp: new Date().toISOString(),
      ip_address: req.ip || req.connection.remoteAddress || 'unknown', // Changed to snake_case
      time_taken: timeTaken ? Math.round(timeTaken) : null, // Round decimal time values to integers
      mode: mode,
      exam_guard_flags: req.body.examGuardFlags || [] // Record flags from exam guard
    };

    // Debug: Log the exact data being sent to database
    console.log('🔍 Result data being sent to database:', JSON.stringify(resultData, null, 2));

    let savedResult;
    try {
      savedResult = await databaseService.createResult(resultData);
      console.log('✅ Result saved successfully:', savedResult);
    } catch (dbError) {
      console.error('❌ Database save error:', dbError);
      console.error('❌ Error details:', {
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint
      });
      throw new Error(`Failed to save result: ${dbError.message}`);
    }

    // Update rating if student is authenticated
    let ratingUpdate = null;

    if (sessionData.studentId && score > 0) {
      // CRITICAL: Update rating independently
      try {
        ratingUpdate = await ratingService.updateStudentRating(
          sessionData.studentId,
          lessonId,
          score,
          totalPoints,
          timeTaken || 0,
          0 // Streak is removed, use 0 as fallback
        );
        console.log(`✅ Rating updated successfully: ${ratingUpdate.previousRating} -> ${ratingUpdate.newRating}`);
      } catch (ratingError) {
        console.error('❌ CRITICAL: Rating update failed:', {
          error: ratingError.message,
          studentId: sessionData.studentId,
          lessonId,
          score,
          totalPoints
        });
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

    // Get real results from database with pagination and filtering
    const filters = {};
    if (req.query.studentId) filters.studentId = req.query.studentId;
    if (req.query.lessonId) filters.lessonId = req.query.lessonId;
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) filters.dateTo = req.query.dateTo;

    const data = await databaseService.getAllResults(page, limit, filters);

    res.json({
      success: true,
      data
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

    // Get real results by student from database
    const data = await databaseService.getResultsByStudent(studentId, page, limit);

    res.json({
      success: true,
      data
    });
  });

  // Get result statistics
  getResultStatistics = asyncHandler(async (req, res) => {
    // Get real result statistics from database
    const filters = {};
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) filters.dateTo = req.query.dateTo;
    if (req.query.subject) filters.subject = req.query.subject;

    const statistics = await databaseService.calculateResultStatistics(filters);

    res.json({
      success: true,
      data: {
        statistics
      }
    });
  });
}

module.exports = new ResultController();