// Store shuffled options mapping globally
window.questionMappings = {};
// currentLessonData is already declared in inline script in views/lesson.html

// --- Authentication Functions (supports both students and admins) ---
async function checkStudentAuthentication() {
    try {
        const response = await fetch('/api/auth/student/check');
        if (!response.ok) {
            console.log('Auth check failed, user not authenticated');
            return false;
        }
        const authData = await response.json();

        if (authData.success && authData.data) {
            if (authData.data.isAuthenticated && authData.data.student) {
                console.log('User authenticated:', authData.data.student.name,
                    authData.data.student.id === 'admin' ? '(Admin)' : '(Student)');
                return true;
            } else {
                console.log('User not authenticated');
                return false;
            }
        } else {
            console.log('User not authenticated');
            return false;
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

// Function to prompt for login when authentication is required
function promptForLogin() {
    const currentUrl = window.location.pathname + window.location.search;
    if (confirm('Bạn cần đăng nhập để làm bài tập. Chuyển đến trang đăng nhập?')) {
        window.location.href = '/student/login?redirect=' + encodeURIComponent(currentUrl);
    }
}

async function handleLogout() {
    try {
        const response = await fetch('/api/student/logout', { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            console.log('Logout successful');
            window.location.href = '/student/login';
        } else {
            alert('Đăng xuất thất bại: ' + (result.message || 'Lỗi không xác định'));
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Đã xảy ra lỗi trong quá trình đăng xuất.');
    }
}
// --- End Authentication Functions ---

// Function to show/hide loader
function showLoader(show) {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}



async function renderQuestions(lesson) {
    if (!lesson || !lesson.questions || !Array.isArray(lesson.questions)) {
        console.warn('Lesson has no questions');
        return;
    }

    const container = document.getElementById('questions-container');
    const navGrid = document.getElementById('question-nav-grid');
    if (!container || !navGrid) {
        console.error('Container or navGrid not found in DOM!');
        return;
    }
    container.innerHTML = '';
    navGrid.innerHTML = '';

    // Questions are already appropriately shuffled, grouped, and sliced in applyRandomization()
    // Do NOT re-shuffle here.
    const allQuestions = [...lesson.questions];

    allQuestions.forEach((q, displayIndex) => {
        const originalIndex = q._originalIndex !== undefined ? q._originalIndex : lesson.questions.indexOf(q);

        // Create navigation item
        const navItem = document.createElement('div');
        navItem.className = 'question-nav-item';
        navItem.textContent = displayIndex + 1;
        navItem.onclick = () => {
            if (typeof navigateToQuestion === 'function') navigateToQuestion(displayIndex);
        };
        navGrid.appendChild(navItem);

        // Create question card
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card question';
        questionCard.dataset.questionIndex = originalIndex;
        questionCard.style.display = displayIndex === 0 ? 'block' : 'none';

        // Extract points value from question text for display in header
        const pointsExtractRegex = /\[\s*([\d.]+)\s*pts?\s*\]/i;
        const pointsExtractMatch = q.question.match(pointsExtractRegex);
        let pointsBadge = '';
        if (pointsExtractMatch && pointsExtractMatch[1]) {
            const rawPts = parseFloat(pointsExtractMatch[1]);
            const roundedPts = parseFloat(rawPts.toFixed(4));
            pointsBadge = ` <span class="question-points-badge" style="font-size: 0.9em; font-weight: normal; color: var(--accent-primary); margin-left: 8px;">[${roundedPts} pts]</span>`;
        }

        // Extract image if present
        let imageUrl = null;
        const imgRegex = /\[img\s+src="([^"]+)"\]/i;
        const match = q.question.match(imgRegex);
        if (match && match[1]) {
            imageUrl = match[1];
        }
        
        let questionText = q.question;
        if (imageUrl) {
            questionText = questionText.replace(imgRegex, '').trim();
        }
        // Remove points marking pattern [X pts] from displayed question text
        const pointsRegex = /\s*\[\s*[\d.]+\s*pts?\s*\]\s*/gi;
        questionText = questionText.replace(pointsRegex, ' ').trim();

        let questionHtml = `
            <div class="question-header">
                <h3 class="question-number">Câu ${displayIndex + 1}${pointsBadge}</h3>
                <div class="question-actions">
                    <button class="btn-flag" type="button" onclick="if(typeof toggleFlag==='function') toggleFlag(${displayIndex})">
                        <i class="fas fa-flag"></i> Đánh dấu
                    </button>
                </div>
            </div>
        `;

        questionHtml += `<div class="question-text">${questionText}</div>`;

        if (imageUrl) {
            questionHtml += `
            <div class="question-image-container">
                <img src="${imageUrl}" alt="Question Image" class="question-image" loading="lazy" onload="this.classList.add('loaded')">
            </div>
            `;
        }

        const normalizedType = q.type === 'multiple_choice' ? 'abcd' :
                               q.type === 'true_false' ? 'truefalse' :
                               q.type === 'fill_blank' ? 'number' : q.type;

        switch(normalizedType) {
            case 'abcd':
                if (!q.options || !Array.isArray(q.options)) {
                    console.warn('ABCD question missing options:', q);
                    questionHtml += '<div class="error-message">Error: No options available for this question</div>';
                    break;
                }

                // Options are already shuffled by applyRandomization! Do not re-shuffle here.
                const optionsWithIndices = q.options.map((option, idx) => ({
                    text: typeof option === 'string' ? option : (option.text || ''),
                    originalIndex: idx, 
                    letter: String.fromCharCode(65 + idx)
                }));

                // Ensure mapping is stored for legacy functions
                if (typeof window.questionMappings === 'object') {
                    window.questionMappings[originalIndex] = optionsWithIndices.map((opt, newIndex) => ({
                        displayedLetter: String.fromCharCode(65 + newIndex),
                        originalLetter: opt.letter,
                        originalIndex: opt.originalIndex
                    }));
                }

                questionHtml += '<div class="options-container">';
                optionsWithIndices.forEach((option, idx) => {
                    const optionLetter = String.fromCharCode(65 + idx);
                    questionHtml += `
                    <div class="option-card" onclick="if(typeof selectOption==='function') selectOption(${originalIndex}, '${optionLetter}', this)">
                        <input type="radio" 
                               id="q${originalIndex}_${idx}"
                               name="q${originalIndex}" 
                               value="${optionLetter}">
                        <label for="q${originalIndex}_${idx}" class="option-label">
                            <span class="option-letter">${optionLetter}</span>
                            <span class="option-text">${option.text}</span>
                        </label>
                    </div>
                    `;
                });
                questionHtml += '</div>';
                break;

            case 'truefalse':
                if (Array.isArray(q.options) && q.options.length > 0) {
                    questionHtml += '<div class="truefalse-container">';
                    q.options.forEach((option, idx) => {
                        const optionText = typeof option === 'string' ? option : (option.text || '');
                        questionHtml += `
                        <div class="truefalse-item">
                            <div class="truefalse-text">${String.fromCharCode(65 + idx)}) ${optionText}</div>
                            <div class="truefalse-buttons">
                                <label class="truefalse-btn" onclick="if(typeof selectTrueFalse==='function') selectTrueFalse(${originalIndex}, ${idx}, true, this)">
                                    <input type="radio" name="q${originalIndex}_${idx}" value="true"> Đúng
                                </label>
                                <label class="truefalse-btn" onclick="if(typeof selectTrueFalse==='function') selectTrueFalse(${originalIndex}, ${idx}, false, this)">
                                    <input type="radio" name="q${originalIndex}_${idx}" value="false"> Sai
                                </label>
                            </div>
                        </div>
                        `;
                    });
                    questionHtml += '</div>';
                } else {
                    console.warn('True/false question missing options:', q);
                    questionHtml += '<div class="error-message">Error: No options available for this true/false question</div>';
                }
                break;

            case 'number':
                questionHtml += `
                <div class="number-input-container">
                    <input type="number" 
                           name="q${originalIndex}" 
                           class="modern-number-input"
                           placeholder="Nhập câu trả lời..."
                           onchange="if(typeof markQuestionAnswered==='function') markQuestionAnswered(${displayIndex})"
                           required>
                </div>
                `;
                break;
        }

        questionCard.innerHTML = questionHtml;
        container.appendChild(questionCard);
    });

    if (navGrid.firstChild) {
        navGrid.firstChild.classList.add('active');
    }

    if (typeof renderMathInElement === 'function') {
        renderMathInElement(container, {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false},
                {left: "\\(", right: "\\)", display: false},
                {left: "\\[", right: "\\]", display: true}
            ],
            throwOnError: false
        });
    }
}

// initializeLesson is defined in the HTML inline script (views/lesson.html)
// It handles encrypted fetch, exam guard overlay integration, and timer start.
// Do NOT redefine it here to avoid shadowing the HTML version.
// --- END Note ---

// Submit quiz event listener setup
// NOTE: initializeLesson() is called from the HTML inline DOMContentLoaded handler.
// Submit quiz event listener has been moved to views/lesson.html inline script
// to correctly support showing the confirmation modal and secure fetch.

function getCurrentStreak(lessonId) {
    try {
        const streakData = localStorage.getItem(`lesson_${lessonId}_streak`);
        if (streakData) {
            const { lastAttempt, streak } = JSON.parse(streakData);
            const now = new Date();
            const lastAttemptDate = new Date(lastAttempt);
            
            // Check if last attempt was yesterday or today
            const isConsecutiveDay = (
                (now.getDate() === lastAttemptDate.getDate() && now.getMonth() === lastAttemptDate.getMonth() && now.getFullYear() === lastAttemptDate.getFullYear()) ||
                (now.getDate() === lastAttemptDate.getDate() + 1 && now.getMonth() === lastAttemptDate.getMonth() && now.getFullYear() === lastAttemptDate.getFullYear())
            );
            
            return isConsecutiveDay ? streak + 1 : 1;
        }
    } catch (error) {
        console.error('Error getting streak:', error);
    }
    return 1;
}

function updateStreak(lessonId, score, totalPoints) {
    try {
        const currentStreak = getCurrentStreak(lessonId);
        const performance = score / totalPoints;
        
        // Only update streak if performance is good (e.g., > 70%)
        if (performance >= 0.7) {
            localStorage.setItem(`lesson_${lessonId}_streak`, JSON.stringify({
                lastAttempt: new Date().toISOString(),
                streak: currentStreak
            }));
        } else {
            // Reset streak if performance is poor
            localStorage.setItem(`lesson_${lessonId}_streak`, JSON.stringify({
                lastAttempt: new Date().toISOString(),
                streak: 1
            }));
        }
    } catch (error) {
        console.error('Error updating streak:', error);
    }
}

function showPracticeFeedback(quizResults) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'practice-feedback-modal';
    modal.innerHTML = `
        <div class="practice-feedback-content">
            <h2><i class="fas fa-check-circle"></i> Kết quả luyện tập</h2>
            <div class="score-display">
                <div class="score-circle">
                    <span class="score-number">${quizResults.score}</span>
                    <span class="score-divider">/</span>
                    <span class="total-number">${quizResults.totalPoints}</span>
                </div>
                <div class="score-percentage">${Math.round((quizResults.score / quizResults.totalPoints) * 100)}%</div>
            </div>
            
            <div class="feedback-details">
                <p><i class="fas fa-clock"></i> Thời gian: ${Math.floor(quizResults.timeTaken / 60)}:${String(Math.floor(quizResults.timeTaken % 60)).padStart(2, '0')}</p>
                <p><i class="fas fa-question-circle"></i> Số câu đúng: ${quizResults.questions.filter(q => q.isCorrect).length}/${quizResults.questions.length}</p>
            </div>
            
            <div class="feedback-actions">
                <button class="btn btn-secondary" onclick="reviewAnswers()">
                    <i class="fas fa-eye"></i> Xem đáp án
                </button>
                <button class="btn btn-primary" onclick="retryQuiz()">
                    <i class="fas fa-redo"></i> Làm lại
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .practice-feedback-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .practice-feedback-content {
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            max-width: 500px;
            width: 90%;
            text-align: center;
        }
        
        .score-display {
            margin: 2rem 0;
        }
        
        .score-circle {
            font-size: 3rem;
            font-weight: bold;
            color: #333;
        }
        
        .score-percentage {
            font-size: 1.5rem;
            color: #666;
            margin-top: 0.5rem;
        }
        
        .feedback-details {
            margin: 1.5rem 0;
            text-align: left;
        }
        
        .feedback-details p {
            margin: 0.5rem 0;
            color: #666;
        }
        
        .feedback-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
        }
        
        .feedback-actions .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .btn-primary {
            background: #6366f1;
            color: white;
        }
        
        .btn-secondary {
            background: #e5e7eb;
            color: #333;
        }
    `;
    document.head.appendChild(style);
}

function reviewAnswers() {
    // Show correct answers inline
    document.querySelectorAll('.question').forEach(questionEl => {
        const questionIndex = parseInt(questionEl.dataset.questionIndex);
        const question = currentLessonData.questions[questionIndex];
        
        // Add correct answer indicator
        const correctDiv = document.createElement('div');
        correctDiv.className = 'correct-answer-display';
        correctDiv.style.cssText = 'background: #d1fae5; padding: 0.5rem; margin-top: 0.5rem; border-radius: 0.25rem; color: #065f46;';
        
        if (question.type === 'abcd' || question.type === 'multiple_choice') {
            const correctIndex = question.correct.toUpperCase().charCodeAt(0) - 65;
            const correctOption = question.options[correctIndex];
            correctDiv.innerHTML = `<i class="fas fa-check"></i> Đáp án đúng: ${question.correct.toUpperCase()}. ${correctOption.text || correctOption}`;
        } else if (question.type === 'number') {
            correctDiv.innerHTML = `<i class="fas fa-check"></i> Đáp án đúng: ${question.correct}`;
        } else if (question.type === 'truefalse' || question.type === 'true_false') {
            correctDiv.innerHTML = `<i class="fas fa-check"></i> Đáp án đúng: ${question.correct}`;
        }
        
        questionEl.appendChild(correctDiv);
    });
    
    // Close modal
    document.querySelector('.practice-feedback-modal').remove();
}

function retryQuiz() {
    // Reload the page to retry
    window.location.reload();
}

function showResultModal(quizResults) {
    // Implementation of showResultModal function
}

function storeResultInSession(quizResults) {
    // Implementation of storeResultInSession function
}

// Global timer variables
let countdownTimer = null;
let timerElement = null;
let warningShown = false;

function initializeCountdownTimer(lesson) {
    // Calculate total time in seconds
    const hours = lesson.timeLimitHours || 0;
    const minutes = lesson.timeLimitMinutes || 30;
    const seconds = lesson.timeLimitSeconds || 0;
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    
    if (totalSeconds <= 0) {
        console.warn('Invalid time limit configuration');
        return;
    }
    
    // Create timer element
    createTimerElement();
    
    let remainingTime = totalSeconds;
    // Removed startTime = performance.now() to prevent overwriting global HTML timer
    
    // Update timer display
    updateTimerDisplay(remainingTime);
    
    // Start countdown
    countdownTimer = setInterval(() => {
        remainingTime--;
        updateTimerDisplay(remainingTime);
        
        // Show warning at 5 minutes if enabled
        if (lesson.warningAlerts && remainingTime === 300 && !warningShown) {
            warningShown = true;
            showTimeWarning();
        }
        
        // Auto-submit when time runs out
        if (remainingTime <= 0) {
            clearInterval(countdownTimer);
            if (lesson.autoSubmit !== false) {
                autoSubmitQuiz();
            } else {
                showTimeUpAlert();
            }
        }
    }, 1000);
}

function createTimerElement() {
    // Remove existing timer if present
    const existingTimer = document.getElementById('countdown-timer');
    if (existingTimer) {
        existingTimer.remove();
    }
    
    // Create timer container
    timerElement = document.createElement('div');
    timerElement.id = 'countdown-timer';
    timerElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--bg-card, #1e1e2a);
        border: 2px solid var(--accent-primary, #6366f1);
        border-radius: 12px;
        padding: 16px 20px;
        font-family: 'Courier New', monospace;
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--text-primary, #e4e4e7);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 160px;
        transition: all 0.3s ease;
    `;
    
    // Add icon
    const icon = document.createElement('i');
    icon.className = 'fas fa-clock';
    icon.style.color = 'var(--accent-primary, #6366f1)';
    
    // Add time display
    const timeDisplay = document.createElement('span');
    timeDisplay.id = 'timer-display';
    
    timerElement.appendChild(icon);
    timerElement.appendChild(timeDisplay);
    
    // Add to page
    document.body.appendChild(timerElement);
}

function updateTimerDisplay(remainingTime) {
    if (!timerElement) return;
    
    const timeDisplay = document.getElementById('timer-display');
    if (!timeDisplay) return;
    
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;
    
    let timeText = '';
    if (hours > 0) {
        timeText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        timeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    timeDisplay.textContent = timeText;
    
    // Change color as time runs out
    if (remainingTime <= 300) { // Last 5 minutes
        timerElement.style.borderColor = 'var(--accent-warning, #f59e0b)';
        timerElement.style.background = 'rgba(245, 158, 11, 0.1)';
    }
    if (remainingTime <= 60) { // Last minute
        timerElement.style.borderColor = 'var(--accent-danger, #ef4444)';
        timerElement.style.background = 'rgba(239, 68, 68, 0.1)';
        timerElement.style.animation = 'pulse 1s infinite';
    }
}

function showTimeWarning() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: var(--bg-card, #1e1e2a);
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        border: 2px solid var(--accent-warning, #f59e0b);
        max-width: 400px;
    `;
    
    content.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--accent-warning, #f59e0b); margin-bottom: 1rem;"></i>
        <h3 style="color: var(--text-primary, #e4e4e7); margin-bottom: 1rem;">Cảnh báo thời gian</h3>
        <p style="color: var(--text-secondary, #a1a1aa); margin-bottom: 1.5rem;">Còn lại 5 phút để hoàn thành bài tập!</p>
        <button onclick="this.closest('.time-warning-modal').remove()" style="
            background: var(--accent-warning, #f59e0b);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
        ">Đã hiểu</button>
    `;
    
    modal.className = 'time-warning-modal';
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Auto-close after 5 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 5000);
}

function showTimeUpAlert() {
    alert('Hết thời gian làm bài! Vui lòng nộp bài.');
}

function autoSubmitQuiz() {
    console.log('Auto-submitting quiz due to time limit');
    const submitButton = document.getElementById('submit-quiz-btn');
    if (submitButton && !submitButton.disabled) {
        submitButton.click();
    }
}

// Clean up timer when page unloads
window.addEventListener('beforeunload', () => {
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
});

// Randomization utilities
function createSeededRandom(seed) {
    if (!seed) {
        return Math.random;
    }
    
    // Improved hash function for string seed
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // Add more entropy by mixing in the string length and a magic number
    hash = Math.abs(hash + seed.length * 0x5bd1e995);
    
    // Use the hash as seed for an improved PRNG (Linear Congruential Generator)
    let state = hash || 1; // Ensure non-zero state
    return function() {
        // Better constants for the LCG (from Numerical Recipes)
        state = (state * 1664525 + 1013904223) % 4294967296;
        // Double application for better distribution
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

function shuffleArray(array, randomFunc = Math.random) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(randomFunc() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// selectQuestionPool function removed - question pool filtering is now handled on the server side

function applyRandomization(lesson) {
    // Use a combination of lesson ID and current timestamp for better randomization
    // If a seed is provided, use it; otherwise create one with timestamp
    const seed = lesson.randomizationSeed || `${lesson.id}-${Date.now()}-${Math.random()}`;
    const randomFunc = createSeededRandom(seed);

    console.log('Applying randomization with seed:', seed);

    // Question pool selection is now handled on the server side
    let questions = [...lesson.questions];

    // Shuffle question order if enabled
    console.log('🎲 Shuffle Debug - shuffleQuestions flag:', lesson.shuffleQuestions);
    console.log('🎲 Shuffle Debug - Questions before shuffle:', questions.map(q => q.question || q.id));
    
    // Check URL parameter for force shuffle (useful for debugging)
    const urlParams = new URLSearchParams(window.location.search);
    const forceShuffleQuestions = urlParams.get('shuffle') === 'true';
    
    if (lesson.shuffleQuestions || forceShuffleQuestions) {
        if (forceShuffleQuestions) {
            console.log('🔧 Force shuffle enabled via URL parameter');
        }
        
        // Group questions by type
        const questionGroups = {
            abcd: [],
            truefalse: [],
            number: []
        };
        
        // Log unique question types before grouping
        const uniqueTypes = [...new Set(questions.map(q => q.type))];
        console.log('🔍 Unique question types in lesson:', uniqueTypes);
        
        // Normalize type names and group questions
        questions.forEach((q, originalIndex) => {
            // Store original index to maintain reference
            q._originalIndex = originalIndex;
            
            const normalizedType = q.type === 'multiple_choice' ? 'abcd' :
                                 q.type === 'true_false' ? 'truefalse' :
                                 q.type === 'fill_blank' ? 'number' : q.type;
            
            if (questionGroups[normalizedType]) {
                questionGroups[normalizedType].push(q);
            } else {
                // If unknown type, add to abcd group as fallback
                console.warn(`Unknown question type: ${q.type}, adding to abcd group`);
                questionGroups.abcd.push(q);
            }
        });
        
        console.log('🎲 Question groups before shuffle:', {
            abcd: questionGroups.abcd.length,
            truefalse: questionGroups.truefalse.length,
            number: questionGroups.number.length
        });
        
        // Shuffle each group independently
        const shuffledAbcd = shuffleArray(questionGroups.abcd, randomFunc);
        const shuffledTrueFalse = shuffleArray(questionGroups.truefalse, randomFunc);
        const shuffledNumber = shuffleArray(questionGroups.number, randomFunc);
        
        // Combine groups in the desired order: ABCD → True/False → Short Answer
        questions = [...shuffledAbcd, ...shuffledTrueFalse, ...shuffledNumber];
        
        console.log('🎲 Shuffle Debug - Questions after group shuffle:', questions.map(q => ({
            question: q.question || q.id,
            type: q.type,
            originalIndex: q._originalIndex
        })));
        console.log('Questions shuffled within groups while maintaining type order');
    } else {
        console.warn('⚠️ Shuffle Debug - shuffleQuestions is false or undefined!');
        console.log('💡 Tip: Add ?shuffle=true to URL to force shuffling');
    }
    
    // Shuffle answer choices for multiple choice questions if enabled
    if (lesson.shuffleAnswers) {
        questions = questions.map(question => {
            if (question.type === 'abcd' && question.options && question.options.length > 1) {
                // Create array of indices to track original positions
                const indices = question.options.map((_, index) => index);
                const shuffledIndices = shuffleArray(indices, randomFunc);
                
                // Rearrange options according to shuffled indices
                const shuffledOptions = shuffledIndices.map(index => question.options[index]);
                
                // Update the correct answer to reflect new position
                const originalCorrectIndex = question.correct.toUpperCase().charCodeAt(0) - 65;
                const newCorrectIndex = shuffledIndices.indexOf(originalCorrectIndex);
                const newCorrectLetter = String.fromCharCode(65 + newCorrectIndex);
                
                return {
                    ...question,
                    options: shuffledOptions,
                    correct: newCorrectLetter,
                    _originalMapping: shuffledIndices // Store for debugging
                };
            }
            return question;
        });
        console.log('Answer choices shuffled for multiple choice questions');
    }
    
    // Update the lesson object with randomized questions
    lesson.questions = questions;
    

    console.log('Randomization complete. Final question count:', questions.length);
    console.log('🎯 Final question order:', questions.map((q, idx) => ({
        position: idx + 1,
        type: q.type,
        question: (q.question || '').substring(0, 30) + '...',
        originalIndex: q._originalIndex
    })));
    
    // Verify group order
    let groupOrder = [];
    let currentGroup = null;
    questions.forEach(q => {
        const normalizedType = q.type === 'multiple_choice' ? 'abcd' :
                             q.type === 'true_false' ? 'truefalse' :
                             q.type === 'fill_blank' ? 'number' : q.type;
        if (normalizedType !== currentGroup) {
            currentGroup = normalizedType;
            groupOrder.push(normalizedType);
        }
    });
    console.log('✅ Group order verification:', groupOrder.join(' → '));
    
    if (groupOrder.join('-') !== 'abcd-truefalse-number') {
        console.warn('⚠️ Warning: Groups are not in the expected order!');
        console.warn('Expected: abcd → truefalse → number');
        console.warn('Actual:', groupOrder.join(' → '));
    }
}

// Attempt management functions
async function checkAttemptPermission(lesson) {
    try {
        // Get student authentication first
        const authResponse = await fetch('/api/auth/student/check');
        if (!authResponse.ok) {
            return { allowed: false, reason: 'authentication', message: 'Vui lòng đăng nhập để làm bài' };
        }
        
        const authData = await authResponse.json();
        if (!authData.success || !authData.data?.isAuthenticated) {
            return { allowed: false, reason: 'authentication', message: 'Vui lòng đăng nhập để làm bài' };
        }
        
        const studentId = authData.data.student.id;
        
        // Check previous attempts
        const attemptsResponse = await fetch(`/api/results/lesson/${lesson.id}?studentId=${studentId}`);
        if (!attemptsResponse.ok) {
            // If no previous attempts found, allow
            return { allowed: true };
        }
        
        const attemptsData = await attemptsResponse.json();
        const previousAttempts = attemptsData.data || [];
        
        // Check if max attempts reached (if not unlimited)
        if (!lesson.isUnlimitedAttempts && lesson.maxAttempts > 0) {
            if (previousAttempts.length >= lesson.maxAttempts) {
                return { 
                    allowed: false, 
                    reason: 'maxAttempts', 
                    message: `Bạn đã hết số lần thử (${lesson.maxAttempts} lần)`,
                    attempts: previousAttempts.length,
                    maxAttempts: lesson.maxAttempts
                };
            }
        }
        
        // Check cooldown period
        if (previousAttempts.length > 0) {
            const lastAttempt = previousAttempts[previousAttempts.length - 1];
            const lastAttemptTime = new Date(lastAttempt.created_at || lastAttempt.completedAt);
            const now = new Date();
            
            const cooldownMs = (lesson.cooldownHours * 3600 + lesson.cooldownMinutes * 60 + lesson.cooldownSeconds) * 1000;
            const timeSinceLastAttempt = now - lastAttemptTime;
            
            if (timeSinceLastAttempt < cooldownMs) {
                const remainingTime = cooldownMs - timeSinceLastAttempt;
                const remainingHours = Math.floor(remainingTime / (1000 * 60 * 60));
                const remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                const remainingSeconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
                
                let timeText = '';
                if (remainingHours > 0) timeText += `${remainingHours} giờ `;
                if (remainingMinutes > 0) timeText += `${remainingMinutes} phút `;
                if (remainingSeconds > 0) timeText += `${remainingSeconds} giây`;
                
                return {
                    allowed: false,
                    reason: 'cooldown',
                    message: `Bạn cần chờ ${timeText.trim()} trước khi làm lại bài`,
                    remainingTime: remainingTime,
                    previousAttempts: previousAttempts
                };
            }
        }
        
        return { 
            allowed: true, 
            previousAttempts: previousAttempts,
            attemptNumber: previousAttempts.length + 1
        };
        
    } catch (error) {
        console.error('Error checking attempt permission:', error);
        return { allowed: true }; // Allow on error to avoid blocking students
    }
}

function showAttemptDeniedMessage(attemptCheck) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: var(--bg-card, #1e1e2a);
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        border: 2px solid var(--accent-danger, #ef4444);
        max-width: 500px;
        margin: 1rem;
    `;
    
    let iconClass = 'fa-ban';
    let iconColor = 'var(--accent-danger, #ef4444)';
    
    if (attemptCheck.reason === 'cooldown') {
        iconClass = 'fa-clock';
        iconColor = 'var(--accent-warning, #f59e0b)';
    } else if (attemptCheck.reason === 'maxAttempts') {
        iconClass = 'fa-exclamation-circle';
    }
    
    content.innerHTML = `
        <i class="fas ${iconClass}" style="font-size: 4rem; color: ${iconColor}; margin-bottom: 1.5rem;"></i>
        <h3 style="color: var(--text-primary, #e4e4e7); margin-bottom: 1rem;">Không thể làm bài</h3>
        <p style="color: var(--text-secondary, #a1a1aa); margin-bottom: 2rem; line-height: 1.5;">${attemptCheck.message}</p>
        
        ${attemptCheck.previousAttempts ? `
            <div style="background: var(--bg-secondary, #27272a); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h4 style="color: var(--text-primary, #e4e4e7); margin-bottom: 0.5rem;">Lịch sử làm bài</h4>
                <p style="color: var(--text-secondary, #a1a1aa); margin: 0;">
                    Đã làm: ${attemptCheck.previousAttempts.length} lần
                    ${attemptCheck.maxAttempts ? ` / ${attemptCheck.maxAttempts}` : ''}
                </p>
            </div>
        ` : ''}
        
        <div style="display: flex; gap: 1rem; justify-content: center;">
            <button onclick="window.location.href='/lessons'" style="
                background: var(--accent-primary, #6366f1);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
            ">Về danh sách bài học</button>
            
            ${attemptCheck.reason === 'cooldown' ? `
                <button onclick="this.closest('.attempt-denied-modal').remove()" style="
                    background: transparent;
                    color: var(--text-secondary, #a1a1aa);
                    border: 1px solid var(--border-color, #3f3f46);
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                ">Đóng</button>
            ` : ''}
        </div>
    `;
    
    modal.className = 'attempt-denied-modal';
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Auto-refresh if in cooldown to update remaining time
    if (attemptCheck.reason === 'cooldown' && attemptCheck.remainingTime < 300000) { // Less than 5 minutes
        setTimeout(() => {
            window.location.reload();
        }, Math.min(attemptCheck.remainingTime, 60000)); // Refresh in at most 1 minute
    }
}

function showPreviousAttemptsSummary(lesson, previousAttempts) {
    if (!lesson.showPreviousAttempts || !previousAttempts || previousAttempts.length === 0) {
        return;
    }
    
    // Create attempts summary element
    const summaryElement = document.createElement('div');
    summaryElement.className = 'previous-attempts-summary';
    summaryElement.style.cssText = `
        background: var(--bg-secondary, #27272a);
        border: 1px solid var(--border-color, #3f3f46);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1.5rem;
    `;
    
    const bestScore = Math.max(...previousAttempts.map(attempt => attempt.score || 0));
    const lastScore = previousAttempts[previousAttempts.length - 1].score || 0;
    const averageScore = previousAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / previousAttempts.length;
    
    summaryElement.innerHTML = `
        <h4 style="color: var(--text-primary, #e4e4e7); margin-bottom: 0.75rem;">
            <i class="fas fa-history"></i> Lịch sử làm bài (${previousAttempts.length} lần)
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem;">
            <div style="text-align: center;">
                <div style="color: var(--accent-success, #10b981); font-size: 1.25rem; font-weight: 600;">${bestScore}%</div>
                <div style="color: var(--text-secondary, #a1a1aa); font-size: 0.85rem;">Cao nhất</div>
            </div>
            <div style="text-align: center;">
                <div style="color: var(--accent-primary, #6366f1); font-size: 1.25rem; font-weight: 600;">${lastScore}%</div>
                <div style="color: var(--text-secondary, #a1a1aa); font-size: 0.85rem;">Lần cuối</div>
            </div>
            <div style="text-align: center;">
                <div style="color: var(--text-primary, #e4e4e7); font-size: 1.25rem; font-weight: 600;">${averageScore.toFixed(1)}%</div>
                <div style="color: var(--text-secondary, #a1a1aa); font-size: 0.85rem;">Trung bình</div>
            </div>
        </div>
    `;
    
    // Insert after lesson title
    const titleElement = document.getElementById('lesson-title');
    if (titleElement && titleElement.parentNode) {
        titleElement.parentNode.insertBefore(summaryElement, titleElement.nextSibling);
    }
}

// ============================================================
// EXAM GUARD MODULE
// Monitors tab switches, app switches, and focus loss.
// Escalating penalties:
//   Flag 1 → Warning
//   Flag 2 → Final warning
//   Flag 3 → Reset all answers
//   Flag 4 → Force submit
// ============================================================
const ExamGuard = (() => {
    let flagCount = 0;
    let flagLogs = [];
    let isActive = false;
    let isFullscreen = false;
    let statusBadge = null;
    let warningModalOpen = false;
    let guardStartTime = null;

    // Cooldown to prevent multiple rapid flags from the same event
    let lastFlagTime = 0;
    const FLAG_COOLDOWN_MS = 1500;

    // ---- Fullscreen helpers (cross-browser) ----
    function requestFullscreen() {
        const el = document.documentElement;
        const rfs = el.requestFullscreen
            || el.webkitRequestFullscreen
            || el.mozRequestFullScreen
            || el.msRequestFullscreen;
        if (rfs) {
            rfs.call(el).then(() => {
                isFullscreen = true;
                console.log('[ExamGuard] Fullscreen enabled');
            }).catch(err => {
                console.warn('[ExamGuard] Fullscreen request denied:', err.message);
                // On mobile browsers that deny fullscreen, still activate the guard
                isFullscreen = false;
            });
        } else {
            console.warn('[ExamGuard] Fullscreen API not supported');
            isFullscreen = false;
        }
    }

    function exitFullscreen() {
        const efs = document.exitFullscreen
            || document.webkitExitFullscreen
            || document.mozCancelFullScreen
            || document.msExitFullscreen;
        if (efs && getFullscreenElement()) {
            efs.call(document).catch(() => {});
        }
    }

    function getFullscreenElement() {
        return document.fullscreenElement
            || document.webkitFullscreenElement
            || document.mozFullScreenElement
            || document.msFullscreenElement;
    }

    // ---- Status badge (bottom-left) ----
    function createStatusBadge() {
        statusBadge = document.createElement('div');
        statusBadge.className = 'exam-guard-status';
        statusBadge.innerHTML = `
            <span class="guard-dot"></span>
            <span class="guard-status-text">Giám sát bài thi</span>
        `;
        document.body.appendChild(statusBadge);
        updateStatusBadge();
    }

    function updateStatusBadge() {
        if (!statusBadge) return;
        const textEl = statusBadge.querySelector('.guard-status-text');
        if (flagCount === 0) {
            statusBadge.className = 'exam-guard-status';
            textEl.textContent = 'Giám sát bài thi';
        } else if (flagCount <= 2) {
            statusBadge.className = 'exam-guard-status warning';
            textEl.textContent = `Cảnh báo: ${flagCount}/4`;
        } else {
            statusBadge.className = 'exam-guard-status danger';
            textEl.textContent = `Vi phạm: ${flagCount}/4`;
        }
    }

    // ---- Warning modal ----
    function showWarningModal(title, message, flagNum) {
        if (warningModalOpen) return; // Don't stack modals
        warningModalOpen = true;

        const modal = document.createElement('div');
        modal.className = 'exam-guard-warning-modal';
        modal.id = 'exam-guard-warning-modal';

        let iconClass = 'fa-exclamation-triangle';
        if (flagNum >= 3) iconClass = 'fa-skull-crossbones';

        modal.innerHTML = `
            <div class="exam-guard-warning-content">
                <div class="guard-warning-icon">
                    <i class="fas ${iconClass}"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="guard-flag-counter">
                    <i class="fas fa-flag"></i>
                    Vi phạm: ${flagNum} / 4
                </div>
                <br>
                <button class="guard-dismiss-btn" id="guard-dismiss-warning">
                    <i class="fas fa-check"></i>
                    Đã hiểu
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('guard-dismiss-warning').addEventListener('click', () => {
            modal.remove();
            warningModalOpen = false;
            // Re-request fullscreen when returning
            requestFullscreen();
        });
    }

    // ---- Reset all selections ----
    function resetAllSelections() {
        console.log('[ExamGuard] Resetting all user selections');

        // Reset radio buttons
        document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            radio.checked = false;
        });

        // Reset number inputs
        document.querySelectorAll('.modern-number-input').forEach(input => {
            input.value = '';
        });

        // Reset visual selection states (option cards)
        document.querySelectorAll('.option-card.selected').forEach(card => {
            card.classList.remove('selected');
        });

        // Reset true/false button states
        document.querySelectorAll('.truefalse-btn.selected-true, .truefalse-btn.selected-false').forEach(btn => {
            btn.classList.remove('selected-true', 'selected-false');
        });

        // Reset answered tracking
        if (typeof answeredQuestions !== 'undefined' && answeredQuestions instanceof Set) {
            answeredQuestions.clear();
        }

        // Reset nav items visual state
        document.querySelectorAll('.question-nav-item.answered').forEach(item => {
            item.classList.remove('answered');
        });

        // Update stats
        if (typeof updateStats === 'function') {
            updateStats();
        }
    }

    // ---- Force submit ----
    function forceSubmit() {
        console.log('[ExamGuard] Force submitting quiz');
        const submitBtn = document.getElementById('submit-quiz-btn');
        if (submitBtn && !submitBtn.disabled) {
            submitBtn.click();
        } else {
            // If there's a confirmation modal flow, try the confirm button
            const confirmBtn = document.querySelector('.btn-confirm');
            if (confirmBtn) {
                confirmBtn.click();
            }
        }
    }

    // ---- Core flag handler ----
    function triggerFlag(reason) {
        if (!isActive) return;
        if (warningModalOpen) return; // Don't flag while already showing warning

        // Cooldown check
        const now = Date.now();
        if (now - lastFlagTime < FLAG_COOLDOWN_MS) return;
        lastFlagTime = now;

        flagCount++;
        flagLogs.push({ time: new Date().toISOString(), reason: reason });
        console.log(`[ExamGuard] Flag #${flagCount} triggered (${reason})`);
        updateStatusBadge();

        switch (flagCount) {
            case 1:
                showWarningModal(
                    'Cảnh báo!',
                    'Bạn đã rời khỏi trang bài thi. Đây là cảnh báo lần 1. Vui lòng không chuyển tab hoặc rời khỏi trang.',
                    1
                );
                break;

            case 2:
                showWarningModal(
                    '⚠️ Cảnh báo lần cuối!',
                    'Đây là lần thứ 2 bạn rời trang. Lần tiếp theo, toàn bộ câu trả lời của bạn sẽ bị xóa!',
                    2
                );
                break;

            case 3:
                resetAllSelections();
                showWarningModal(
                    '🚨 Đã xóa câu trả lời!',
                    'Toàn bộ câu trả lời của bạn đã bị xóa do vi phạm lần 3. Nếu rời trang thêm lần nữa, bài thi sẽ được tự động nộp.',
                    3
                );
                break;

            case 4:
                // Remove any existing warning modals
                const existingModal = document.getElementById('exam-guard-warning-modal');
                if (existingModal) existingModal.remove();
                warningModalOpen = false;

                // Show brief notification then force submit
                showWarningModal(
                    '🛑 Tự động nộp bài!',
                    'Bài thi của bạn đang được nộp tự động do vi phạm 4 lần rời trang.',
                    4
                );

                // Force submit after short delay
                setTimeout(() => {
                    const modal = document.getElementById('exam-guard-warning-modal');
                    if (modal) modal.remove();
                    warningModalOpen = false;
                    exitFullscreen();
                    forceSubmit();
                }, 2000);
                break;

            default:
                // If somehow more than 4, just keep force submitting
                exitFullscreen();
                forceSubmit();
                break;
        }
    }

    // ---- Event listeners ----
    function setupListeners() {
        // 1. Visibility change (tab switch, minimize, app switch on mobile)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && isActive) {
                triggerFlag('visibilitychange');
            }
        });

        // 2. Window blur (covers some edge cases visibility doesn't catch)
        window.addEventListener('blur', () => {
            if (isActive) {
                // Small delay to avoid false positives from in-page interactions
                setTimeout(() => {
                    if (!document.hasFocus() && isActive) {
                        triggerFlag('window-blur');
                    }
                }, 300);
            }
        });

        // 3. Fullscreen exit (user presses Escape or exits fullscreen)
        const fsEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
        fsEvents.forEach(event => {
            document.addEventListener(event, () => {
                if (isActive && !getFullscreenElement()) {
                    // User exited fullscreen
                    console.log('[ExamGuard] Fullscreen exited');
                    isFullscreen = false;
                    triggerFlag('fullscreen-exit');
                }
            });
        });

        // 4. Page unload / beforeunload
        window.addEventListener('beforeunload', (e) => {
            if (isActive) {
                e.preventDefault();
                e.returnValue = 'Bạn đang làm bài thi. Bạn có chắc muốn rời trang?';
                return e.returnValue;
            }
        });

        // 5. Detect mobile-specific events: pagehide (iOS Safari)
        window.addEventListener('pagehide', () => {
            if (isActive) {
                triggerFlag('pagehide');
            }
        });
    }

    // ---- Public API ----
    function activate() {
        isActive = true;
        guardStartTime = Date.now();
        flagCount = 0;
        flagLogs = [];
        lastFlagTime = 0;
        warningModalOpen = false;
        requestFullscreen();
        createStatusBadge();
        setupListeners();
        console.log('[ExamGuard] Activated');
    }

    function deactivate() {
        isActive = false;
        exitFullscreen();
        if (statusBadge) {
            statusBadge.remove();
            statusBadge = null;
        }
        console.log('[ExamGuard] Deactivated');
    }

    function getFlagCount() {
        return flagCount;
    }

    function isGuardActive() {
        return isActive;
    }

    function getFlagLogs() {
        return flagLogs;
    }

    return { activate, deactivate, getFlagCount, isGuardActive, getFlagLogs };
})();

// Deactivate guard when quiz is submitted (hook into existing submit flow)
const _originalBeforeUnload = window.onbeforeunload;
window.addEventListener('beforeunload', () => {
    // If navigating away after submit, deactivate guard
    if (ExamGuard.isGuardActive()) {
        ExamGuard.deactivate();
    }
});