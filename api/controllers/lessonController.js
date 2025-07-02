const databaseService = require('../services/databaseService');
const sessionService = require('../services/sessionService');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

class LessonController {
  // Get all lessons with pagination and search
  getAllLessons = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', sort = 'order' } = req.query;
    let sessionData = null;

    try {
      sessionData = sessionService.getSessionData(req);
    } catch (error) {
      console.error('Error getting session data:', error);
      sessionData = { studentId: null, isAuthenticated: false };
    }

    const result = await databaseService.getLessons({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sort
    });

    // If student is authenticated, add progress information
    if (sessionData && sessionData.studentId) {
      try {
        const completedLessons = await databaseService.getStudentCompletedLessons(sessionData.studentId);
        if (completedLessons && Array.isArray(completedLessons)) {
          const completedIds = completedLessons.map(lesson => lesson.lessonId);

          // Add completion status to each lesson
          result.lessons = result.lessons.map(lesson => ({
            ...lesson,
            completed: completedIds.includes(lesson.id),
            completedAt: completedLessons.find(cl => cl.lessonId === lesson.id)?.timestamp || null
          }));
        }
      } catch (error) {
        console.error('Error adding progress info to lessons:', error);
        // Continue without progress info if there's an error
      }
    }

    res.json({
      success: true,
      ...result
    });
  });

  // Get lesson by ID
  getLessonById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    let sessionData = null;

    try {
      sessionData = sessionService.getSessionData(req);
    } catch (error) {
      console.error('Error getting session data:', error);
      sessionData = { studentId: null, isAuthenticated: false };
    }

    const lesson = await databaseService.getLessonById(id);

    // Increment view count
    await databaseService.incrementLessonViews(id, lesson.views || 0);

    let lessonWithProgress = {
      ...lesson,
      views: (lesson.views || 0) + 1
    };

    // If student is authenticated, add progress information
    if (sessionData && sessionData.studentId) {
      try {
        const completedLessons = await databaseService.getStudentCompletedLessons(sessionData.studentId);
        if (completedLessons && Array.isArray(completedLessons)) {
          const completedLesson = completedLessons.find(cl => cl.lessonId === id);

          lessonWithProgress.completed = !!completedLesson;
          lessonWithProgress.completedAt = completedLesson?.timestamp || null;
          lessonWithProgress.lastScore = completedLesson?.score || null;
          lessonWithProgress.lastTotalPoints = completedLesson?.totalPoints || null;
        }
      } catch (error) {
        console.error('Error adding progress info to lesson:', error);
        // Continue without progress info if there's an error
        lessonWithProgress.completed = false;
        lessonWithProgress.completedAt = null;
        lessonWithProgress.lastScore = null;
        lessonWithProgress.lastTotalPoints = null;
      }
    }

    res.json({
      success: true,
      lesson: lessonWithProgress
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

  // Get student rankings for a lesson (student-accessible)
  getStudentRankings = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Get lesson results with anonymized student data
    const results = await databaseService.getLessonResults(id);
    
    // Transform results to include only necessary data for rankings
    // Remove sensitive information but keep score data
    const transcripts = results.map(result => ({
      student_id: result.student_id || result.studentId,
      score: result.score !== undefined && result.totalPoints !== undefined
        ? `${Math.round((result.score / result.totalPoints) * 100)}%`
        : '0%',
      timestamp: result.timestamp || result.created_at
    }));
    
    res.json({
      success: true,
      transcripts
    });
  });
}

module.exports = new LessonController();
