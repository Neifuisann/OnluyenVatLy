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
