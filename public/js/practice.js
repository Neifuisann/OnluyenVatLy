// Practice Mode JavaScript
let currentQuestionIndex = 0;
let practiceQuestions = [];
let userAnswers = {};
let flaggedQuestions = new Set();
let startTime = Date.now();
let timerInterval = null;

// Timer function
function startTimer() {
    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// Authentication check (supports both students and admins)
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
            }
        }

        console.log('User not authenticated');
        return false;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

function promptForLogin() {
    const currentUrl = window.location.pathname + window.location.search;
    if (confirm('Bạn cần đăng nhập để luyện tập. Chuyển đến trang đăng nhập?')) {
        window.location.href = '/student/login?redirect=' + encodeURIComponent(currentUrl);
    }
}

// Utility functions
function showLoader(show) {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Load practice questions
async function loadPracticeQuestions() {
    try {
        // Get mistake IDs from sessionStorage
        const practiceData = sessionStorage.getItem('practiceMistakes');
        if (!practiceData) {
            alert('Không tìm thấy câu hỏi luyện tập. Vui lòng chọn lại từ trang ôn tập.');
            window.location.href = '/review-mistakes';
            return;
        }
        
        const { mistakeIds } = JSON.parse(practiceData);
        
        // Fetch practice questions
        const response = await fetch('/api/progress/practice/questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mistakeIds: mistakeIds,
                count: mistakeIds.length
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch practice questions: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.questions) {
            practiceQuestions = data.questions;
            
            // Shuffle questions for variety
            practiceQuestions = shuffleArray(practiceQuestions);
            
            // Shuffle options for each question
            practiceQuestions.forEach(question => {
                if (question.type === 'multiple_choice' && question.options) {
                    question.shuffledOptions = shuffleArray([...question.options]);
                }
            });
            
            renderQuestions();
            renderQuestionNavigation();
            updateStats();
            
            // Show first question
            navigateToQuestion(0);
        } else {
            throw new Error('Invalid response format');
        }
    } catch (error) {
        console.error('Error loading practice questions:', error);
        alert('Không thể tải câu hỏi luyện tập. Vui lòng thử lại.');
        window.location.href = '/review-mistakes';
    }
}

// Render all questions
function renderQuestions() {
    const contentContainer = document.getElementById('practice-content');
    
    contentContainer.innerHTML = practiceQuestions.map((question, index) => {
        let optionsHTML = '';
        
        if (question.type === 'multiple_choice') {
            const options = question.shuffledOptions || question.options || [];
            optionsHTML = `
                <div class="options-list">
                    ${options.map((option, optIndex) => `
                        <div class="option-item" 
                             data-question="${index}" 
                             data-option="${optIndex}"
                             onclick="selectOption(${index}, ${optIndex}, '${option}')">
                            <div class="option-radio"></div>
                            <div class="option-label">${option}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (question.type === 'true_false') {
            optionsHTML = `
                <div class="truefalse-options">
                    <div class="option-item truefalse-option" 
                         data-question="${index}" 
                         data-option="true"
                         onclick="selectOption(${index}, 'true', 'Đúng')">
                        <div class="option-radio"></div>
                        <div class="option-label">Đúng</div>
                    </div>
                    <div class="option-item truefalse-option" 
                         data-question="${index}" 
                         data-option="false"
                         onclick="selectOption(${index}, 'false', 'Sai')">
                        <div class="option-radio"></div>
                        <div class="option-label">Sai</div>
                    </div>
                </div>
            `;
        } else if (question.type === 'number') {
            optionsHTML = `
                <div class="number-input-container">
                    <input type="number" 
                           class="number-input" 
                           id="number-input-${index}"
                           placeholder="Nhập đáp án số"
                           onchange="saveNumberAnswer(${index})"
                           value="${userAnswers[index] || ''}">
                    <div class="number-hint">Nhập câu trả lời dạng số</div>
                </div>
            `;
        }
        
        return `
            <div class="question-card" id="question-${index}">
                <div class="question-header">
                    <div class="question-number">Câu ${index + 1}/${practiceQuestions.length}</div>
                    <div class="question-actions">
                        <button class="flag-btn ${flaggedQuestions.has(index) ? 'active' : ''}" 
                                onclick="toggleFlag(${index})">
                            <i class="fas fa-flag"></i>
                            ${flaggedQuestions.has(index) ? 'Đã đánh dấu' : 'Đánh dấu'}
                        </button>
                    </div>
                </div>
                
                <div class="question-text">${question.question}</div>
                
                ${optionsHTML}
                
                <div class="question-navigation">
                    <button class="nav-btn" onclick="navigateQuestion(-1)" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left"></i>
                        Câu trước
                    </button>
                    <button class="nav-btn" onclick="navigateQuestion(1)" 
                            ${index === practiceQuestions.length - 1 ? 'disabled' : ''}>
                        Câu sau
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Render math with KaTeX
    if (window.renderMathInElement) {
        renderMathInElement(contentContainer, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ]
        });
    }
}

// Render question navigation grid
function renderQuestionNavigation() {
    const gridContainer = document.getElementById('question-grid');
    
    gridContainer.innerHTML = practiceQuestions.map((_, index) => `
        <div class="question-nav-item ${index === 0 ? 'active' : ''}" 
             id="nav-item-${index}"
             onclick="navigateToQuestion(${index})">
            ${index + 1}
        </div>
    `).join('');
    
    // Update total count
    document.getElementById('total-count').textContent = practiceQuestions.length;
}

// Navigate to specific question
function navigateToQuestion(index) {
    if (index < 0 || index >= practiceQuestions.length) return;
    
    // Hide all questions
    document.querySelectorAll('.question-card').forEach(card => {
        card.style.display = 'none';
    });
    
    // Show selected question
    document.getElementById(`question-${index}`).style.display = 'block';
    
    // Update navigation
    document.querySelectorAll('.question-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.getElementById(`nav-item-${index}`).classList.add('active');
    
    currentQuestionIndex = index;
    
    // Scroll to top
    document.getElementById('practice-content').scrollTop = 0;
}

// Navigate questions
function navigateQuestion(direction) {
    navigateToQuestion(currentQuestionIndex + direction);
}

// Select option
function selectOption(questionIndex, optionIndex, optionValue) {
    // Clear previous selection
    document.querySelectorAll(`[data-question="${questionIndex}"]`).forEach(item => {
        item.classList.remove('selected');
    });
    
    // Mark selected option
    const selectedOption = document.querySelector(`[data-question="${questionIndex}"][data-option="${optionIndex}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
    
    // Save answer
    userAnswers[questionIndex] = optionValue;
    
    // Update navigation item
    updateNavigationItem(questionIndex);
    updateStats();
}

// Save number answer
function saveNumberAnswer(questionIndex) {
    const input = document.getElementById(`number-input-${questionIndex}`);
    userAnswers[questionIndex] = input.value;
    
    updateNavigationItem(questionIndex);
    updateStats();
}

// Toggle flag
function toggleFlag(questionIndex) {
    if (flaggedQuestions.has(questionIndex)) {
        flaggedQuestions.delete(questionIndex);
    } else {
        flaggedQuestions.add(questionIndex);
    }
    
    // Update flag button
    const flagBtn = document.querySelector(`#question-${questionIndex} .flag-btn`);
    if (flagBtn) {
        flagBtn.classList.toggle('active');
        flagBtn.innerHTML = flaggedQuestions.has(questionIndex) 
            ? '<i class="fas fa-flag"></i> Đã đánh dấu'
            : '<i class="fas fa-flag"></i> Đánh dấu';
    }
    
    updateNavigationItem(questionIndex);
}

// Update navigation item
function updateNavigationItem(questionIndex) {
    const navItem = document.getElementById(`nav-item-${questionIndex}`);
    if (!navItem) return;
    
    navItem.classList.remove('answered', 'flagged');
    
    if (userAnswers[questionIndex] !== undefined) {
        navItem.classList.add('answered');
    }
    
    if (flaggedQuestions.has(questionIndex)) {
        navItem.classList.add('flagged');
    }
}

// Update stats
function updateStats() {
    const answeredCount = Object.keys(userAnswers).length;
    document.getElementById('answered-count').textContent = answeredCount;
}

// Show confirmation modal
function showConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    const unansweredCount = practiceQuestions.length - Object.keys(userAnswers).length;
    
    if (unansweredCount > 0) {
        document.getElementById('unanswered-warning').style.display = 'block';
        document.getElementById('unanswered-count').textContent = unansweredCount;
    } else {
        document.getElementById('unanswered-warning').style.display = 'none';
    }
    
    modal.classList.add('show');
}

// Close confirmation modal
function closeConfirmationModal() {
    document.getElementById('confirmation-modal').classList.remove('show');
}

// Submit practice
async function submitPractice() {
    try {
        // Stop timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // Calculate results
        let score = 0;
        const results = practiceQuestions.map((question, index) => {
            const userAnswer = userAnswers[index] || '';
            const isCorrect = userAnswer.toString().toLowerCase() === 
                             question.correctAnswer.toString().toLowerCase();
            
            if (isCorrect) score++;
            
            return {
                questionIndex: index,
                question: question.question,
                userAnswer: userAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect: isCorrect,
                type: question.type
            };
        });
        
        const timeSpent = Math.floor((Date.now() - startTime) / 1000); // in seconds
        
        // Submit results
        const response = await fetch('/api/progress/practice/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                questions: results,
                score: score,
                totalQuestions: practiceQuestions.length,
                timeSpent: timeSpent
            })
        });
        
        if (response.ok) {
            // Store results in sessionStorage for results page
            sessionStorage.setItem('practiceResults', JSON.stringify({
                results: results,
                score: score,
                totalQuestions: practiceQuestions.length,
                timeSpent: timeSpent,
                timestamp: new Date().toISOString()
            }));
            
            // Clear practice data
            sessionStorage.removeItem('practiceMistakes');
            
            // Show results
            alert(`Hoàn thành luyện tập!\n\nĐiểm: ${score}/${practiceQuestions.length}\nThời gian: ${formatTime(timeSpent)}`);
            
            // Redirect to review mistakes page
            window.location.href = '/review-mistakes';
        } else {
            throw new Error('Failed to submit practice results');
        }
    } catch (error) {
        console.error('Error submitting practice:', error);
        alert('Có lỗi khi nộp bài. Vui lòng thử lại.');
    }
}

// Format time
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Toggle mobile sidebar
function toggleMobileSidebar() {
    const sidebar = document.getElementById('practice-sidebar');
    sidebar.classList.toggle('show');
}

// Initialize practice
async function initializePractice() {
    const isAuthenticated = await checkStudentAuthentication();
    
    if (!isAuthenticated) {
        promptForLogin();
        return;
    }
    
    showLoader(true);
    
    try {
        // Load practice questions
        await loadPracticeQuestions();
        
        // Start timer
        startTimer();
        
        // Set up event listeners
        document.getElementById('submit-practice-btn').addEventListener('click', showConfirmationModal);
        document.getElementById('mobile-sidebar-toggle').addEventListener('click', toggleMobileSidebar);
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && currentQuestionIndex > 0) {
                navigateQuestion(-1);
            } else if (e.key === 'ArrowRight' && currentQuestionIndex < practiceQuestions.length - 1) {
                navigateQuestion(1);
            }
        });
        
        showLoader(false);
        
    } catch (error) {
        console.error('Error initializing practice:', error);
        showLoader(false);
    }
}

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePractice);