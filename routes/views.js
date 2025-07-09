const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { supabase } = require('../lib/config/database');
const sessionService = require('../lib/services/sessionService');

// Import middleware
const {
  requireAdminAuth,
  requireStudentAuth,
  optionalAuth,
  addSessionInfo
} = require('../lib/middleware/auth');
const { longCacheMiddleware, noCacheMiddleware } = require('../lib/middleware/cache');

// Helper function to serve HTML files
const serveHTML = (filename) => {
  return (req, res) => {
    res.sendFile(path.join(__dirname, '../views', filename));
  };
};

// Middleware specifically for HTML pages that require student authentication (or admin with student privileges)
const requireStudentAuthForHTML = (req, res, next) => {
  const isStudentAuthenticated = sessionService.isStudentAuthenticated(req);
  const isAdminAuthenticated = sessionService.isAdminAuthenticated(req);
  const hasAccess = sessionService.isStudentOrAdminAuthenticated(req);

  console.log('🔐 requireStudentAuthForHTML check:', {
    url: req.originalUrl,
    sessionId: req.sessionID,
    userAgent: req.headers['user-agent'],
    isStudentAuthenticated,
    isAdminAuthenticated,
    hasAccess,
    studentId: req.session?.studentId,
    studentName: req.session?.studentName
  });

  if (!hasAccess) {
    console.log('❌ User not authenticated, redirecting to login');
    // For HTML requests, redirect to student login
    return res.redirect('/student/login?redirect=' + encodeURIComponent(req.originalUrl));
  }

  console.log('✅ User authenticated (student or admin), proceeding');
  next();
};

// Middleware specifically for HTML pages that require admin authentication
const requireAdminAuthForHTML = (req, res, next) => {
  if (!sessionService.isAdminAuthenticated(req)) {
    // For HTML requests, redirect to admin login
    return res.redirect('/admin/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  next();
};

// Public pages
router.get('/',
  optionalAuth,
  addSessionInfo,
  longCacheMiddleware(3600), // 1 hour cache
  serveHTML('landing.html')
);

router.get('/login',
  optionalAuth,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('login.html')
);

router.get('/register',
  optionalAuth,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('student-register.html')  // Fixed: register.html -> student-register.html
);

router.get('/student/login',
  optionalAuth,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('student-login.html')
);

router.get('/student/register',
  optionalAuth,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('student-register.html')
);

router.get('/lessons',
  requireStudentAuthForHTML,
  addSessionInfo,
  longCacheMiddleware(1800), // 30 minutes cache
  serveHTML('lessons.html')
);

router.get('/lesson/last-incomplete',
  requireStudentAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('lesson.html')
);

router.get('/review-mistakes',
  requireStudentAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('review-mistakes.html')
);

router.get('/practice',
  requireStudentAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('practice.html')
);

router.get('/lesson/:id',
  requireStudentAuthForHTML,
  addSessionInfo,
  longCacheMiddleware(1800), // 30 minutes cache
  serveHTML('lesson.html')
);

// Additional routes referenced in landing page
router.get('/gallery',
  optionalAuth,
  addSessionInfo,
  longCacheMiddleware(1800), // 30 minutes cache
  serveHTML('gallery.html') // Public gallery access for theory section
);

router.get('/multiplechoice',
  requireStudentAuthForHTML,
  addSessionInfo,
  longCacheMiddleware(1800), // 30 minutes cache
  serveHTML('lessons.html') // Redirect to lessons page for now
);

// Add missing truefalse route (referenced in original)
router.get('/truefalse',
  requireStudentAuthForHTML,
  addSessionInfo,
  longCacheMiddleware(1800), // 30 minutes cache
  serveHTML('lessons.html')
);

router.get('/leaderboard',
  requireStudentAuthForHTML,
  addSessionInfo,
  longCacheMiddleware(300), // 5 minutes cache
  serveHTML('leaderboard.html')
);

router.get('/history',
  requireAdminAuthForHTML,
  addSessionInfo,
  longCacheMiddleware(1800), // 30 minutes cache
  serveHTML('history.html')
);

router.get('/quizgame',
  requireStudentAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('quizgame.html')
);

router.get('/profile',
  requireStudentAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('profile.html')
);

// Add missing profile route with studentId parameter (from original server)
router.get('/profile/:studentId',
  requireStudentAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('profile.html')
);

router.get('/settings',
  requireStudentAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('settings.html')
);

// Student-only pages
router.get('/student/dashboard',
  requireStudentAuth,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('lessons.html')  // Fixed: student-dashboard.html -> lessons.html (main lessons page for students)
);

router.get('/student/profile',
  requireStudentAuth,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('profile.html')  // Fixed: student-profile.html -> profile.html
);

router.get('/student/results',
  requireStudentAuth,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('result.html')  // Fixed: student-results.html -> result.html
);

router.get('/student/rating',
  requireStudentAuth,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('leaderboard.html')  // Fixed: student-rating.html -> leaderboard.html
);

// Admin-only pages
router.get('/admin',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-list.html')  // Fixed: admin.html -> admin-list.html
);

router.get('/admin/login',
  optionalAuth,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-login.html')
);

router.get('/admin/lessons',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-list.html')  // Fixed: admin-lessons.html -> admin-list.html (lessons are managed in main admin page)
);

// Modern Split-Screen Editor (Default Interface)
router.get('/admin/new',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-new-v2.html')  // Route for creating new lessons - now uses modern interface
);

router.get('/admin/lessons/new',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-new-v2.html')  // Route for creating new lessons - now uses modern interface
);

router.get('/admin/lessons/:id/edit',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-new-v2.html')  // Route for editing lessons - now uses modern interface
);

router.get('/admin/edit/:id',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-new-v2.html')  // Route for editing lessons - now uses modern interface
);

// Legacy Interface (For Fallback)
router.get('/admin/new-legacy',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-edit.html')  // Legacy interface available as fallback
);

router.get('/admin/edit-legacy/:id',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-edit.html')  // Legacy edit interface available as fallback
);

// Admin configure page (for lesson configuration after editing)
router.get('/admin/configure',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-configure.html')
);

router.get('/admin/configure/:id',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-configure.html')
);

router.get('/admin/students',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-students.html')
);

router.get('/admin/results',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-list.html')  // Fixed: admin-results.html -> admin-list.html (results managed in main admin page)
);

router.get('/admin/ratings',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-list.html')  // Fixed: admin-ratings.html -> admin-list.html (ratings managed in main admin page)
);

router.get('/admin/uploads',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-list.html')  // Fixed: admin-uploads.html -> admin-list.html (uploads managed in main admin page)
);

router.get('/admin/statistics',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-list.html')  // Fixed: admin-statistics.html -> admin-list.html (statistics managed in main admin page)
);

// Add missing admin quiz route
router.get('/admin/quiz',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-quiz-edit.html')
);

router.get('/admin/lessons/:id/statistics',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('lesson-statistics.html')  // Individual lesson statistics page
);

// AI Tools admin page
router.get('/admin/ai-tools',
  requireAdminAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('admin-ai-tools.html')
);

// Result viewing pages
router.get('/result',
  requireStudentAuthForHTML,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('result.html')
);

router.get('/result/:id',
  requireStudentAuthForHTML,
  addSessionInfo,
  longCacheMiddleware(86400), // 24 hours cache
  serveHTML('result.html')
);

// Error pages
router.get('/404',
  optionalAuth,
  addSessionInfo,
  longCacheMiddleware(3600), // 1 hour cache
  serveHTML('404.html')
);

router.get('/500',
  optionalAuth,
  addSessionInfo,
  noCacheMiddleware,
  serveHTML('404.html')  // Fixed: 500.html -> 404.html (use 404 page for now)
);

// API documentation page
router.get('/docs',
  optionalAuth,
  addSessionInfo,
  longCacheMiddleware(3600), // 1 hour cache
  serveHTML('404.html')  // Fixed: api-docs.html -> 404.html (use 404 page for now)
);

// Share lesson route (public - no auth required)
router.get('/share/lesson/:lessonId', async (req, res) => {
    const lessonId = req.params.lessonId;
    const loggedInStudentId = req.session.studentId; // Check if student is logged in
    console.log(`Attempting to serve share page for lesson ID: ${lessonId}. Logged in student: ${loggedInStudentId || 'None'}`);

    try {
        // 1. Fetch lesson details including question pool settings
        const { data: lessonData, error: lessonError } = await supabase
            .from('lessons')
            .select('id, title, lesson_image, questions, enable_question_pool, question_pool_size, question_type_distribution')
            .eq('id', lessonId)
            .single();

        if (lessonError) throw new Error(`Database error fetching lesson: ${lessonError.message}`);
        if (!lessonData) throw new Error('Lesson not found');
        console.log(`Lesson found: ${lessonData.title}`);

        // 2. Fetch TOTAL submission count from 'results' table
        const { count: submissionCount, error: countError } = await supabase
            .from('results')
            .select('*', { count: 'exact', head: true })
            .eq('lesson_id', lessonId);

        if (countError) {
            console.error(`Error fetching total submission count for lesson ${lessonId}:`, countError.message);
        }
        const totalSubmissions = submissionCount || 0;
        console.log(`Total submission count: ${totalSubmissions}`);

        // 3. Determine the question count to display
        const totalQuestionsAvailable = Array.isArray(lessonData.questions) ? lessonData.questions.length : 0;
        let questionsPerAttempt = totalQuestionsAvailable;
        
        // Use question pool settings if enabled
        if (lessonData.enable_question_pool && lessonData.question_pool_size > 0) {
            questionsPerAttempt = lessonData.question_pool_size;
        }
        console.log(`Questions per attempt: ${questionsPerAttempt}`);

        // 4. Fetch USER'S past results (if logged in)
        let userHistoryHtml = '';
        if (loggedInStudentId) {
            console.log(`Fetching history for student ${loggedInStudentId} and lesson ${lessonId}`);
            const { data: historyData, error: historyError } = await supabase
                .from('results')
                .select('id, score, total_points, timestamp, questions')
                .eq('student_id', loggedInStudentId)
                .eq('lesson_id', lessonId)
                .order('timestamp', { ascending: false })
                .limit(3); // Limit to latest 3 attempts

            if (historyError) {
                console.error(`Error fetching user history:`, historyError.message);
            } else if (historyData && historyData.length > 0) {
                console.log(`Found ${historyData.length} history entries for the user.`);
                // Generate HTML for history cards
                userHistoryHtml = '<h2 style="text-align: left; margin-top: 30px; margin-bottom: 15px; font-size: 1.4em; color: #333;">Lịch sử làm bài của bạn</h2>';
                historyData.forEach(result => {
                    const score = result.score ?? 0;
                    const totalPoints = result.total_points ?? 0;
                    const scorePercent = totalPoints > 0 ? ((score / totalPoints) * 100).toFixed(2) : 'N/A';
                    const correctAnswers = Array.isArray(result.questions)
                        ? result.questions.filter(q => q.isCorrect).length
                        : 0;
                    const submissionTime = new Date(result.timestamp).toLocaleString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    });

                    userHistoryHtml += `
                        <div style="background-color: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 15px; margin-bottom: 10px; text-align: left;">
                            <p style="margin: 5px 0; font-size: 1.2em; font-weight: bold; color: #1877f2;">Điểm của bạn: ${scorePercent}</p>
                            <p style="margin: 5px 0;">Thời gian nộp bài: ${submissionTime}</p>
                            <p style="margin: 5px 0;">Số lượng đúng: <strong style="color: green;">${correctAnswers}</strong> / ${totalPoints}</p>
                            ${result.id ? `<a href="/result/${result.id}" style="display: inline-block; margin-top: 10px; font-size: 0.9em; color: #555; text-decoration: none;">Xem chi tiết ›</a>` : ''}
                        </div>
                    `;
                });
            } else {
                console.log(`No history found for student ${loggedInStudentId} on lesson ${lessonId}`);
            }
        }

        // 5. Read the HTML template
        const templatePath = path.join(process.cwd(), 'views', 'share-lesson.html');
        let htmlContent = await fs.readFile(templatePath, 'utf-8');

        // 6. Replace placeholders
        htmlContent = htmlContent.replace(/{{LESSON_NAME}}/g, lessonData.title || 'Không có tiêu đề');

        // Use the URL directly from the database (handle both field name formats)
        let imageUrl = lessonData.lesson_image || lessonData.lessonImage || '';
        htmlContent = htmlContent.replace(/{{LESSON_IMAGE_URL}}/g, imageUrl);
        htmlContent = htmlContent.replace(/{{QUESTION_COUNT}}/g, questionsPerAttempt);
        htmlContent = htmlContent.replace(/{{SUBMISSION_COUNT}}/g, totalSubmissions);
        htmlContent = htmlContent.replace(/{{LESSON_ID}}/g, lessonData.id);
        htmlContent = htmlContent.replace(/{{USER_HISTORY_HTML}}/g, userHistoryHtml);

        // 7. Send the response
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(htmlContent);
        console.log(`Successfully served share page for lesson ID: ${lessonId}`);

    } catch (error) {
        console.error(`Error generating share page for lesson ${lessonId}:`, error.message);
        // Send a user-friendly error page
        res.status(404).send(`
            <!DOCTYPE html>
            <html lang="vi">
            <head><meta charset="UTF-8"><title>Lỗi</title></head>
            <body style="font-family: sans-serif; padding: 20px;">
                <h1>Không tìm thấy bài học</h1>
                <p>Bài học bạn yêu cầu (${lessonId}) không tồn tại hoặc đã xảy ra lỗi khi tải.</p>
                <a href="/">Quay lại trang chủ</a>
            </body>
            </html>
        `);
    }
});

// Health check page
router.get('/health',
  longCacheMiddleware(60), // 1 minute cache
  (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  }
);

module.exports = router;
