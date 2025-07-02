// Add this to /api/routes/views.js

// Share lesson route (public - no auth required)
router.get('/share/lesson/:lessonId', async (req, res) => {
    const lessonId = req.params.lessonId;
    const loggedInStudentId = req.session.studentId; // Check if student is logged in
    console.log(`Attempting to serve share page for lesson ID: ${lessonId}. Logged in student: ${loggedInStudentId || 'None'}`);

    try {
        // Import required modules at the top of the file
        const { supabase } = require('../config/database');
        const fs = require('fs').promises;
        
        // 1. Fetch lesson details including randomQuestions
        const { data: lessonData, error: lessonError } = await supabase
            .from('lessons')
            .select('id, title, lessonImage, questions, randomQuestions')
            .eq('id', lessonId)
            .single();

        if (lessonError) throw new Error(`Database error fetching lesson: ${lessonError.message}`);
        if (!lessonData) throw new Error('Lesson not found');
        console.log(`Lesson found: ${lessonData.title}`);

        // 2. Fetch TOTAL submission count from 'results' table
        const { count: submissionCount, error: countError } = await supabase
            .from('results')
            .select('*', { count: 'exact', head: true })
            .eq('lessonId', lessonId);

        if (countError) {
            console.error(`Error fetching total submission count for lesson ${lessonId}:`, countError.message);
        }
        const totalSubmissions = submissionCount || 0;
        console.log(`Total submission count: ${totalSubmissions}`);

        // 3. Determine the question count to display
        const totalQuestionsAvailable = Array.isArray(lessonData.questions) ? lessonData.questions.length : 0;
        const questionsPerAttempt = (typeof lessonData.randomQuestions === 'number' && lessonData.randomQuestions > 0)
            ? lessonData.randomQuestions
            : totalQuestionsAvailable;
        console.log(`Questions per attempt: ${questionsPerAttempt}`);

        // 4. Fetch USER'S past results (if logged in)
        let userHistoryHtml = '';
        if (loggedInStudentId) {
            console.log(`Fetching history for student ${loggedInStudentId} and lesson ${lessonId}`);
            const { data: historyData, error: historyError } = await supabase
                .from('results')
                .select('id, score, totalPoints, timestamp, questions')
                .eq('student_id', loggedInStudentId)
                .eq('lessonId', lessonId)
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
                    const totalPoints = result.totalPoints ?? 0;
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
        
        // Use the URL directly from the database
        let imageUrl = lessonData.lessonImage || '';
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

// =====================================
// Also ensure share-lesson.html exists in views folder
// =====================================
// Create /views/share-lesson.html with these placeholders:
/*
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{LESSON_NAME}} - Chia sẻ bài học</title>
    <meta property="og:title" content="{{LESSON_NAME}}">
    <meta property="og:description" content="Làm bài tập với {{QUESTION_COUNT}} câu hỏi. Đã có {{SUBMISSION_COUNT}} lượt nộp bài.">
    <meta property="og:image" content="{{LESSON_IMAGE_URL}}">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .lesson-image {
            width: 100%;
            max-height: 300px;
            object-fit: cover;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .stats {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            padding: 20px 0;
            border-top: 1px solid #eee;
            border-bottom: 1px solid #eee;
        }
        .stat {
            text-align: center;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #1877f2;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
        .cta-button {
            display: block;
            width: 100%;
            padding: 15px;
            background-color: #1877f2;
            color: white;
            text-align: center;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            margin-top: 20px;
        }
        .cta-button:hover {
            background-color: #166fe5;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>{{LESSON_NAME}}</h1>
        {{LESSON_IMAGE_URL}} ? '<img src="{{LESSON_IMAGE_URL}}" alt="{{LESSON_NAME}}" class="lesson-image">' : ''
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">{{QUESTION_COUNT}}</div>
                <div class="stat-label">Câu hỏi</div>
            </div>
            <div class="stat">
                <div class="stat-value">{{SUBMISSION_COUNT}}</div>
                <div class="stat-label">Lượt làm bài</div>
            </div>
        </div>
        
        {{USER_HISTORY_HTML}}
        
        <a href="/lesson/{{LESSON_ID}}" class="cta-button">Bắt đầu làm bài</a>
    </div>
</body>
</html>
*/