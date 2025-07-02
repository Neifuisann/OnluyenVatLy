const databaseService = require('../services/databaseService');
const { asyncHandler } = require('../middleware/errorHandler');

class ProgressController {
    // Get student progress overview
    getStudentProgress = asyncHandler(async (req, res) => {
        const studentId = req.session.studentId;
        
        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: 'Student authentication required'
            });
        }

        try {
            // Get all lessons
            const { lessons, total: totalLessons } = await databaseService.getLessons({ limit: 1000 });
            
            // Get student's completed lessons
            const completedLessons = await databaseService.getStudentCompletedLessons(studentId);
            
            // Get student's current streak
            const streak = await databaseService.getStudentStreak(studentId);
            
            // Calculate progress percentage
            const completedCount = completedLessons.length;
            const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
            
            // Get last incomplete lesson
            const lastIncompleteLesson = await databaseService.getLastIncompleteLesson(studentId);
            
            // Get mistakes to review
            const mistakesCount = await databaseService.getStudentMistakesCount(studentId);
            
            res.json({
                success: true,
                progress: {
                    percentage,
                    completedCount,
                    totalLessons,
                    streak: streak || 0,
                    lastIncompleteLesson,
                    mistakesCount
                }
            });
        } catch (error) {
            console.error('Error getting student progress:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving progress data'
            });
        }
    });

    // Get detailed progress by chapter/topic
    getDetailedProgress = asyncHandler(async (req, res) => {
        const studentId = req.session.studentId;
        
        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: 'Student authentication required'
            });
        }

        try {
            // Get progress grouped by topic
            const progressByTopic = await databaseService.getProgressByTopic(studentId);
            
            res.json({
                success: true,
                progressByTopic
            });
        } catch (error) {
            console.error('Error getting detailed progress:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving detailed progress'
            });
        }
    });

    // Update student streak
    updateStreak = asyncHandler(async (req, res) => {
        const studentId = req.session.studentId;
        
        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: 'Student authentication required'
            });
        }

        try {
            const newStreak = await databaseService.updateStudentStreak(studentId);
            
            res.json({
                success: true,
                streak: newStreak
            });
        } catch (error) {
            console.error('Error updating streak:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating streak'
            });
        }
    });

    // Get learning statistics
    getLearningStats = asyncHandler(async (req, res) => {
        const studentId = req.session.studentId;
        const { period = 'week' } = req.query; // week, month, all
        
        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: 'Student authentication required'
            });
        }

        try {
            const stats = await databaseService.getStudentLearningStats(studentId, period);
            
            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Error getting learning stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving learning statistics'
            });
        }
    });

    // Get recommended lessons
    getRecommendedLessons = asyncHandler(async (req, res) => {
        const studentId = req.session.studentId;
        
        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: 'Student authentication required'
            });
        }

        try {
            // Get lessons based on:
            // 1. Not completed yet
            // 2. Similar to completed lessons (by tags)
            // 3. Appropriate difficulty level
            const recommendations = await databaseService.getRecommendedLessons(studentId);
            
            res.json({
                success: true,
                recommendations
            });
        } catch (error) {
            console.error('Error getting recommendations:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving recommendations'
            });
        }
    });

    // Get mistakes to review
    getMistakesToReview = asyncHandler(async (req, res) => {
        const studentId = req.session.studentId;
        const { limit = 20 } = req.query;
        
        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: 'Student authentication required'
            });
        }

        try {
            const mistakes = await databaseService.getStudentMistakes(studentId, parseInt(limit));
            
            res.json({
                success: true,
                mistakes
            });
        } catch (error) {
            console.error('Error getting mistakes:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving mistakes'
            });
        }
    });

    // Mark lesson as completed
    markLessonCompleted = asyncHandler(async (req, res) => {
        const studentId = req.session.studentId;
        const { lessonId } = req.params;
        const { score, timeTaken } = req.body;
        
        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: 'Student authentication required'
            });
        }

        try {
            await databaseService.markLessonCompleted(studentId, lessonId, score, timeTaken);
            
            // Update streak
            await databaseService.updateStudentStreak(studentId);
            
            res.json({
                success: true,
                message: 'Lesson marked as completed'
            });
        } catch (error) {
            console.error('Error marking lesson completed:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating lesson completion'
            });
        }
    });

    // Get achievement badges
    getAchievements = asyncHandler(async (req, res) => {
        const studentId = req.session.studentId;
        
        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: 'Student authentication required'
            });
        }

        try {
            const achievements = await databaseService.getStudentAchievements(studentId);
            
            res.json({
                success: true,
                achievements
            });
        } catch (error) {
            console.error('Error getting achievements:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving achievements'
            });
        }
    });
}

module.exports = new ProgressController();
