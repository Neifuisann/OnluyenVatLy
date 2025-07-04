const databaseService = require('../services/databaseService');
const sessionService = require('../services/sessionService');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { SUCCESS_MESSAGES } = require('../config/constants');

class LessonController {
  // Get all lessons with pagination and search
  getAllLessons = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', sort = 'order', includeStats = 'false' } = req.query;
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

    // If includeStats is true and user is admin, add statistics for each lesson
    if (includeStats === 'true' && sessionService.isAdminAuthenticated(req)) {
      try {
        // Get statistics for all lessons
        const lessonsWithStats = await Promise.all(
          result.lessons.map(async (lesson) => {
            try {
              // Get lesson results to calculate stats
              const results = await databaseService.getLessonResults(lesson.id);
              
              const studentCount = new Set(results.map(r => r.student_id)).size;
              const totalAttempts = results.length;
              const completionRate = totalAttempts > 0 && studentCount > 0 ? 
                Math.round((totalAttempts / studentCount) * 100) : 0;
              
              // Get last activity
              const lastActivity = results.length > 0 ? 
                new Date(Math.max(...results.map(r => new Date(r.timestamp)))).toLocaleString('vi-VN') : null;
              
              return {
                ...lesson,
                studentCount,
                completionRate,
                lastActivity: lastActivity || 'Chưa có hoạt động'
              };
            } catch (error) {
              console.error(`Error getting stats for lesson ${lesson.id}:`, error);
              return lesson;
            }
          })
        );
        
        result.lessons = lessonsWithStats;
      } catch (error) {
        console.error('Error adding statistics to lessons:', error);
        // Continue without stats if there's an error
      }
    }

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
    
    // Get comprehensive lesson statistics
    const statistics = await databaseService.getLessonDetailedStatistics(id);
    
    res.json(statistics);
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

  // Get last incomplete lesson for authenticated student
  getLastIncompleteLesson = asyncHandler(async (req, res) => {
    const sessionData = sessionService.getSessionData(req);
    if (!sessionData || !sessionData.studentId) {
      throw new ValidationError('Student authentication required');
    }

    // Validate student exists before querying for incomplete lessons
    const studentExists = await databaseService.getStudentById(sessionData.studentId);
    if (!studentExists) {
      throw new ValidationError('Student not found');
    }

    const lastIncompleteLesson = await databaseService.getLastIncompleteLesson(sessionData.studentId);
    
    res.json({
      success: true,
      lesson: lastIncompleteLesson,
      message: lastIncompleteLesson ? 'Last incomplete lesson found' : 'All lessons completed'
    });
  });

  // Get platform statistics for lessons page
  getPlatformStats = asyncHandler(async (req, res) => {
    try {
      const stats = await databaseService.calculatePlatformStats();
      
      // Format for lessons page display
      const formattedStats = {
        totalLessons: stats.totalLessons,
        totalStudents: stats.totalStudents,
        completionRate: stats.totalStudents > 0 ? Math.round((stats.recentActivity / stats.totalStudents) * 100) : 0,
        avgScore: stats.averageScore / 10, // Convert to 0-10 scale for display
        lastUpdated: stats.lastUpdated
      };

      res.json({
        success: true,
        data: formattedStats
      });
    } catch (error) {
      console.error('Error getting platform stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculating platform statistics'
      });
    }
  });
}

module.exports = new LessonController();
