// Store shuffled options mapping globally
window.questionMappings = {};
let currentLessonData = null; // Variable to store loaded lesson data

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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function renderQuestions(lesson) {
    // Check if lesson has questions property
    if (!lesson || !lesson.questions || !Array.isArray(lesson.questions)) {
        console.warn('Lesson has no questions or questions is not an array:', lesson);
        // Hide question sections if no questions
        const questionSections = ['abcd-questions', 'truefalse-questions', 'number-questions'];
        questionSections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.style.display = 'none';
            }
        });
        // Hide submit button
        const submitBtn = document.getElementById('submit-quiz-btn');
        if (submitBtn) {
            submitBtn.style.display = 'none';
        }
        return;
    }

    const sections = {
        abcd: { element: document.getElementById('abcd-questions'), questions: [] },
        truefalse: { element: document.getElementById('truefalse-questions'), questions: [] },
        number: { element: document.getElementById('number-questions'), questions: [] }
    };

    // Group all questions by type
    // Handle both old format (multiple_choice) and new format (abcd)
    lesson.questions.forEach(q => {
        const normalizedType = q.type === 'multiple_choice' ? 'abcd' :
                             q.type === 'true_false' ? 'truefalse' :
                             q.type === 'fill_blank' ? 'number' : q.type;

        if (sections[normalizedType]) {
            sections[normalizedType].questions.push(q);
        } else {
            console.warn('Unknown question type:', q.type, 'for question:', q);
        }
    });
    
    // If randomQuestions is set, select random questions while maintaining proportions
    if (lesson.randomQuestions > 0 && lesson.randomQuestions < lesson.questions.length) {
        // Calculate the proportion of each question type
        const totalQuestions = lesson.questions.length;
        const proportions = {};
        Object.keys(sections).forEach(type => {
            proportions[type] = sections[type].questions.length / totalQuestions;
        });

        // Calculate how many questions of each type to include
        const randomCounts = {};
        let remainingCount = lesson.randomQuestions;
        Object.keys(proportions).forEach(type => {
            randomCounts[type] = Math.round(lesson.randomQuestions * proportions[type]);
            remainingCount -= randomCounts[type];
        });

        // Adjust for rounding errors
        if (remainingCount > 0) {
            // Add remaining to the type with the most questions
            const maxType = Object.keys(sections).reduce((a, b) => 
                sections[a].questions.length > sections[b].questions.length ? a : b
            );
            randomCounts[maxType] += remainingCount;
        }

        // Shuffle and select questions for each type
        Object.keys(sections).forEach(type => {
            if (sections[type].questions.length > 0) {
                sections[type].questions = shuffleArray([...sections[type].questions])
                    .slice(0, randomCounts[type]);
            }
        });
    } else {
        // If no random selection, just shuffle all questions within their types
        Object.values(sections).forEach(section => {
            if (section.element) {
                section.questions = shuffleArray([...section.questions]);
            }
        });
    }
    
    // Clear existing questions
    Object.values(sections).forEach(section => {
        if (section.element) {
            section.element.innerHTML = `<h3>${section.element.querySelector('h3')?.textContent || ''}</h3>`;
        }
    });

    // Render questions for each section
    Object.entries(sections).forEach(([type, section]) => {
        if (!section.element) return;
        
        section.questions.forEach((q, index) => {
            const questionIndex = lesson.questions.indexOf(q);
            let questionHtml = `
                <div class="question" data-question-index="${questionIndex}">
                    <p><strong>Câu ${index + 1}.</strong></p>
            `;

            // --- START IMAGE PARSING ---
            let imageUrl = null;
            const imgRegex = /\[img\s+src="([^"]+)"\]/i;
            const originalQuestionText = lesson.questions[questionIndex].question;
            const match = originalQuestionText.match(imgRegex);
            if (match && match[1]) {
                imageUrl = match[1];
            }
            // --- END IMAGE PARSING ---

            // --- NEW: Get the question text and remove the image tag if it exists for saving ---
            let questionTextForSaving = originalQuestionText; // Start with original
            if (imageUrl) {
                // If an image was found, remove the tag for the text we save
                questionTextForSaving = questionTextForSaving.replace(imgRegex, '').trim();
            }
            // --- END NEW ---

            questionHtml += `<p>${questionTextForSaving}</p>`;

            if (imageUrl) { // Check if we have an image URL from either source
                questionHtml += `
                    <div class="question-image-container">
                        <img src="${imageUrl}" 
                             alt="Question Image" 
                             style="max-width: 100%; margin: 10px 0;"
                             loading="lazy"
                             onload="this.classList.add('loaded')"
                             class="question-image">
                    </div>
                `;
            }

            // Handle both old format (multiple_choice) and new format (abcd)
            const normalizedType = q.type === 'multiple_choice' ? 'abcd' :
                                 q.type === 'true_false' ? 'truefalse' :
                                 q.type === 'fill_blank' ? 'number' : q.type;

            switch(normalizedType) {
                case 'abcd':
                    // Ensure options exist
                    if (!q.options || !Array.isArray(q.options)) {
                        console.warn('ABCD question missing options:', q);
                        questionHtml += '<div class="error-message">Error: No options available for this question</div>';
                        break;
                    }

                    // Create shuffled options with their original indices
                    const optionsWithIndices = q.options.map((option, idx) => ({
                        text: typeof option === 'string' ? option : (option.text || ''), // Handle both object and string format
                        originalIndex: idx,
                        letter: String.fromCharCode(65 + idx) // A, B, C, D
                    }));
                    const shuffledOptions = shuffleArray([...optionsWithIndices]);
                    
                    // Store the mapping for this question
                    window.questionMappings[questionIndex] = shuffledOptions.map(
                        (opt, newIndex) => ({
                            displayedLetter: String.fromCharCode(65 + newIndex),
                            originalLetter: opt.letter,
                            originalIndex: opt.originalIndex
                        })
                    );

                    // --- ADDED: Get all option texts for abcd --- 
                    if (Array.isArray(q.options)) {
                        optionsText = q.options.map(opt => opt.text || opt);
                    } else {
                        optionsText = []; // Default to empty array if options are missing
                    }
                    // --- END ADDED ---

                    questionHtml += shuffledOptions.map((option, idx) => `
                        <div class="option-row">
                            <input type="radio" 
                                   id="q${questionIndex}_${idx}"
                                   name="q${questionIndex}" 
                                   value="${String.fromCharCode(65 + idx)}">
                            <label for="q${questionIndex}_${idx}" class="option-label">
                                <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                                <span class="option-text">${option.text}</span>
                            </label>
                        </div>
                    `).join('');
                    break;

                case 'truefalse':
                    if (Array.isArray(q.options) && q.options.length > 0) {
                        // Multiple true/false options
                        questionHtml += `<div class="truefalse-options">`;
                        q.options.forEach((option, idx) => {
                            const optionText = typeof option === 'string' ? option : (option.text || ''); // Handle both formats
                            questionHtml += `
                                <div class="truefalse-option-box">
                                    <div class="option-text">${String.fromCharCode(65 + idx)}) ${optionText}</div>
                                    <div class="truefalse-buttons">
                                        <label class="option-button">
                                            <input type="radio"
                                                   name="q${questionIndex}_${idx}"
                                                   value="true">
                                            <span>Đúng</span>
                                        </label>
                                        <label class="option-button">
                                            <input type="radio"
                                                   name="q${questionIndex}_${idx}"
                                                   value="false">
                                            <span>Sai</span>
                                        </label>
                                    </div>
                                </div>
                            `;
                        });
                        questionHtml += `</div>`;
                    } else {
                        // Single true/false question or missing options
                        console.warn('True/false question missing options:', q);
                        questionHtml += `
                            <div class="form-group">
                                <select name="q${questionIndex}" required>
                                    <option value="">Select answer</option>
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                </select>
                            </div>
                        `;
                    }
                    break;

                case 'number':
                    questionHtml += `
                        <div class="number-input-container">
                            <input type="number" 
                                   name="q${questionIndex}" 
                                   class="modern-number-input"
                                   placeholder="Enter your answer..."
                                   required>
                        </div>
                    `;
                    break;
            }

            questionHtml += `</div>`;
            section.element.insertAdjacentHTML('beforeend', questionHtml);
        });

        if (section.questions.length === 0) {
            section.element.style.display = 'none';
        }
    });
    
    // Initialize KaTeX rendering after all questions are loaded
    if (typeof renderMathInElement === 'function') {
        // Target all sections that might contain math
        const mathContainers = document.querySelectorAll('#abcd-questions, #truefalse-questions, #number-questions');
        mathContainers.forEach(container => {
            renderMathInElement(container, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false},
                    {left: "\\(", right: "\\)", display: false},
                    {left: "\\[", right: "\\]", display: true}
                ],
                throwOnError: false
            });
        });
    }
}

async function initializeLesson() {
    // Check student authentication (optional for viewing lessons)
    const isAuthenticated = await checkStudentAuthentication();
    // Continue loading lesson regardless of authentication status
    
    showLoader(true);
    const lessonId = window.location.pathname.split('/')[2];
    document.title = 'Loading lesson...';
    
    try {
        const response = await fetch(`/api/lessons/${lessonId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch lesson: ${response.status}`);
        }
        
        const responseData = await response.json();

        // Extract lesson from API response
        const lesson = responseData.lesson || responseData;
        currentLessonData = lesson; // Store the lesson data

        if (lesson.error || responseData.error) {
            document.body.innerHTML = '<h1>Lesson not found</h1>';
            currentLessonData = null; // Clear data on error
            return;
        }
        
        document.title = lesson.title;
        const titleElement = document.getElementById('lesson-title');
        if (titleElement) {
            titleElement.textContent = lesson.title;
        }
        
        // Display lesson image if present
        if (lesson.lessonImage) {
            const imageContainer = document.getElementById('lesson-image-container');
            const imageElement = document.getElementById('lesson-image');
            
            // Set up responsive image with srcset if it's a modern image URL
            const isModernImageURL = lesson.lessonImage.includes('.webp') || 
                                    lesson.lessonImage.includes('supabase.co') || 
                                    lesson.lessonImage.includes('_storage/');
                                    
            if (isModernImageURL) {
                // Extract the base URL without extension if possible
                let baseUrl = lesson.lessonImage;
                let extension = '.jpg';
                
                if (baseUrl.includes('.webp')) {
                    baseUrl = baseUrl.replace('.webp', '');
                    extension = '.webp';
                } else if (baseUrl.match(/\.(jpe?g|png|gif)$/i)) {
                    const match = baseUrl.match(/\.(jpe?g|png|gif)$/i);
                    if (match) {
                        extension = match[0];
                        baseUrl = baseUrl.replace(extension, '');
                    }
                }
                
                // Preload the image in the background
                const preloadLink = document.createElement('link');
                preloadLink.rel = 'preload';
                preloadLink.as = 'image';
                preloadLink.href = lesson.lessonImage;
                document.head.appendChild(preloadLink);
                
                // Set the srcset attribute for responsive loading
                imageElement.srcset = `${lesson.lessonImage} 1x`;
            }
            
            // Always set the src as fallback
            imageElement.src = lesson.lessonImage;
            imageContainer.style.display = 'block';
        }
        
        // Add console log here to inspect the lesson object
        console.log('Lesson object before rendering:', JSON.stringify(lesson, null, 2)); 
        
        await renderQuestions(lesson);
        console.log('Lesson initialized successfully');
        
        // Handle mode-specific UI changes
        const lessonMode = lesson.mode || 'test';
        if (lessonMode === 'practice') {
            // Practice mode: Show mode indicator
            const modeIndicator = document.createElement('div');
            modeIndicator.className = 'practice-mode-indicator';
            modeIndicator.innerHTML = '<i class="fas fa-graduation-cap"></i> Chế độ luyện tập - Có thể làm lại nhiều lần';
            const titleElement = document.getElementById('lesson-title');
            if (titleElement && titleElement.parentNode) {
                titleElement.parentNode.insertBefore(modeIndicator, titleElement.nextSibling);
            }
            
            // Store mode in a global variable for use in submission
            window.lessonMode = 'practice';
        } else {
            // Test mode is default
            window.lessonMode = 'test';
        }
        
        // Check attempts and cooldown
        if (lesson.enableMultipleAttempts) {
            const attemptCheck = await checkAttemptPermission(lesson);
            if (!attemptCheck.allowed) {
                showAttemptDeniedMessage(attemptCheck);
                return;
            } else if (attemptCheck.previousAttempts) {
                // Show previous attempts summary if allowed
                showPreviousAttemptsSummary(lesson, attemptCheck.previousAttempts);
            }
        }
        
        // Apply randomization if enabled
        if (lesson.shuffleQuestions || lesson.shuffleAnswers || lesson.enableQuestionPool) {
            applyRandomization(lesson);
        }
        
        // Initialize countdown timer if enabled
        if (lesson.timeLimitEnabled && lesson.showCountdown !== false) {
            initializeCountdownTimer(lesson);
        }

        // --- HIDE LOADER ---
        showLoader(false); // Hide loader AFTER main content is rendered

        // Initialize auto-rendering for KaTeX and highlighting
        // These can run after the loader is hidden as well
        if (window.renderMathInElement) {
            renderMathInElement(document.body, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false},
                    {left: "\\(", right: "\\)", display: false},
                    {left: "\\[", right: "\\]", display: true}
                ],
                throwOnError: false
            });
        }
        if (window.hljs) {
            hljs.highlightAll();
        }

    } catch (error) {
        console.error('Error loading lesson:', error);
        document.body.innerHTML = `
            <h1>Error loading lesson</h1>
            <p>Error details: ${error.message}</p>
        `;
        showLoader(false); // Ensure loader is hidden on error
    }
}
// --- END New Function ---

// Remove the old submitQuiz function and replace with new event listener setup
document.addEventListener('DOMContentLoaded', () => {
    showLoader(true); // Show loader immediately
    const submitButton = document.getElementById('submit-quiz-btn');
    if (submitButton) {
        // REMOVED: Get student info from localStorage
        // REMOVED: const studentInfo = JSON.parse(localStorage.getItem('studentInfo'));
        // REMOVED: if (!studentInfo) {
        // REMOVED:     // If no student info, redirect back to home
        // REMOVED:     window.location.href = '/';
        // REMOVED:     return;
        // REMOVED: }

        // Rest of your initialization code...
        // This function already handles authentication checks and potential redirects
        initializeLesson(); 

        submitButton.addEventListener('click', async () => {
            // Check authentication before allowing quiz submission
            const isAuthenticated = await checkStudentAuthentication();
            if (!isAuthenticated) {
                promptForLogin();
                return;
            }

            // Disable the submit button and provide visual feedback
            submitButton.disabled = true;
            submitButton.textContent = 'Đang nộp bài...';
            submitButton.style.opacity = '0.7'; // Dim the button slightly

            // Check if lesson data is available
            if (!currentLessonData) {
                console.error("Lesson data not loaded, cannot submit.");
                alert("Lỗi: Dữ liệu bài học chưa được tải. Vui lòng tải lại trang.");
                // Revert button state
                submitButton.disabled = false;
                submitButton.textContent = 'Nộp bài';
                submitButton.style.opacity = '1';
                return;
            }
            
            try {
                // Get IP address
                const ipResponse = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipResponse.json();
                
                const lessonId = currentLessonData.id;
                const lesson = currentLessonData;
                
                let score = 0;
                let totalPossiblePoints = 0;
                const startTime = performance.now();

                const quizResults = {
                    lessonId: lessonId,
                    questions: [],
                    ipAddress: ipData.ip,
                    submittedAt: new Date().toISOString()
                };

                // Get all displayed questions
                const questionElements = document.querySelectorAll('.question');
                questionElements.forEach((questionElement) => {
                    const originalIndex = parseInt(questionElement.dataset.questionIndex);
                    const q = lesson.questions[originalIndex];
                    
                    const questionPoints = (typeof q.points === 'number' && q.points > 0) ? q.points : 1;
                    totalPossiblePoints += questionPoints;

                    let userAnswer, correctAnswer, isCorrect, optionsText = null;
                    
                    // --- NEW: Extract image URL if present ---
                    let imageUrl = null;
                    const imgRegex = /\[img\s+src="([^"]+)"\]/i;
                    // Use the ORIGINAL question text from the lesson data to find the image
                    const originalQuestionText = lesson.questions[originalIndex].question;
                    const match = originalQuestionText.match(imgRegex);
                    if (match && match[1]) {
                        imageUrl = match[1];
                    }
                    // --- END NEW ---

                    // --- NEW: Get the question text and remove the image tag if it exists for saving ---
                    let questionTextForSaving = originalQuestionText; // Start with original
                    if (imageUrl) {
                        // If an image was found, remove the tag for the text we save
                        questionTextForSaving = questionTextForSaving.replace(imgRegex, '').trim();
                    }
                    // --- END NEW ---

                    // Handle both old format (multiple_choice) and new format (abcd)
                    const normalizedType = q.type === 'multiple_choice' ? 'abcd' :
                                         q.type === 'true_false' ? 'truefalse' :
                                         q.type === 'fill_blank' ? 'number' : q.type;

                    // Get correct answer from either 'correct' or 'correctAnswer' property
                    const correctAnswerValue = q.correct !== undefined ? q.correct : q.correctAnswer;

                    if (normalizedType === 'truefalse' && Array.isArray(q.options)) {
                        // --- NEW: Handle multi-option true/false ---
                        const userAnswersArray = q.options.map((_, idx) => {
                            const selectedInput = document.querySelector(`input[name="q${originalIndex}_${idx}"]:checked`);
                            return selectedInput ? selectedInput.value === 'true' : null; // Store boolean or null
                        });

                        const correctAnswersArray = correctAnswerValue; // Should be an array of booleans
                        optionsText = q.options.map(opt => opt.text || opt); // Store option texts

                        // Determine overall correctness (all must be correct)
                        isCorrect = Array.isArray(correctAnswersArray) &&
                                    correctAnswersArray.every((correctAns, idx) =>
                                        userAnswersArray[idx] !== null && userAnswersArray[idx] === correctAns
                                    );

                        userAnswer = userAnswersArray; // Save array
                        correctAnswer = correctAnswersArray; // Save array
                        // --- END NEW ---

                    } else if (normalizedType === 'abcd') {
                        const selectedRadio = document.querySelector(`input[name="q${originalIndex}"]:checked`);
                        const selectedValue = selectedRadio ? selectedRadio.value : null;

                        // --- ADDED: Get all option texts for abcd --- 
                        if (Array.isArray(q.options)) {
                            optionsText = q.options.map(opt => opt.text || opt);
                        } else {
                            optionsText = []; // Default to empty array if options are missing
                        }
                        // --- END ADDED ---

                        if (selectedValue) {
                            const mapping = window.questionMappings[originalIndex];
                            // Ensure mapping exists before trying to find
                            const selectedMapping = mapping ? mapping.find(m => m.displayedLetter === selectedValue) : null; 
                            
                            if (selectedMapping && q.options[selectedMapping.originalIndex]) {
                                const option = q.options[selectedMapping.originalIndex];
                                userAnswer = option.text || option; // Handle both formats
                                
                                const correctIndex = correctAnswerValue.toUpperCase().charCodeAt(0) - 65;
                                // Check if correct index is valid
                                if (correctIndex >= 0 && correctIndex < q.options.length) {
                                    const correctOption = q.options[correctIndex];
                                    correctAnswer = correctOption.text || correctOption; // Handle both formats
                                    isCorrect = selectedMapping.originalIndex === correctIndex;
                                } else {
                                    // Handle case where correctAnswerValue is invalid
                                    console.warn(`Invalid correct answer letter '${correctAnswerValue}' for question index ${originalIndex}`);
                                    correctAnswer = 'Error: Invalid correct answer specified';
                                    isCorrect = false;
                                }
                            } else {
                                // Handle case where mapping or option doesn't exist (shouldn't happen often)
                                console.warn(`Could not find mapping or option for selected value '${selectedValue}' in question index ${originalIndex}`);
                                userAnswer = selectedValue ? `Selected: ${selectedValue}` : 'No answer';
                                correctAnswer = 'Error: Could not determine correct answer';
                                isCorrect = false;
                            }
                        } else {
                            userAnswer = 'No answer';
                            const correctIndex = correctAnswerValue.toUpperCase().charCodeAt(0) - 65;
                            // Check if correct index is valid before accessing
                             if (correctIndex >= 0 && correctIndex < q.options.length) {
                                const correctOption = q.options[correctIndex];
                                correctAnswer = correctOption.text || correctOption;
                             } else {
                                 correctAnswer = 'Error: Invalid correct answer specified';
                             }
                            isCorrect = false;
                        }
                    } else if (normalizedType === 'number') {
                        const inputElement = document.querySelector(`[name="q${originalIndex}"]`);
                        userAnswer = inputElement ? inputElement.value : 'No input found'; // Handle missing input
                        correctAnswer = correctAnswerValue.toString();
                        // Strict comparison, ensure userAnswer is not empty
                        isCorrect = userAnswer !== '' && userAnswer === correctAnswer;
                    } else if (normalizedType === 'truefalse' && !Array.isArray(q.options)) {
                         // --- Handle single true/false ---
                         const selectElement = document.querySelector(`select[name="q${originalIndex}"]`);
                         userAnswer = selectElement ? selectElement.value : 'No selection';
                         correctAnswer = correctAnswerValue.toString(); // correctAnswerValue should be true or false
                         isCorrect = userAnswer === correctAnswer;
                         // --- End single true/false ---
                    }

                    quizResults.questions.push({
                        type: q.type,
                        question: questionTextForSaving, // Use the cleaned text for saving
                        imageUrl: imageUrl, // Add the extracted image URL
                        userAnswer: userAnswer,
                        correctAnswer: correctAnswer,
                        isCorrect: isCorrect,
                        points: questionPoints,
                        earnedPoints: isCorrect ? questionPoints : 0,
                        optionsText: optionsText
                    });

                    if (isCorrect) {
                        score += questionPoints;
                    }
                });
                
                // Update final scores, time, and streak in the payload
                quizResults.totalPoints = totalPossiblePoints;
                quizResults.score = score;
                quizResults.timeTaken = (performance.now() - startTime) / 1000;
                quizResults.streak = getCurrentStreak(lessonId);

                // --- REVERTED: Call /api/results to save and trigger rating update server-side ---
                try {
                    // Get student info from authentication
                    let studentInfo = { name: 'Anonymous Student' }; // Default fallback

                    try {
                        const authResponse = await fetch('/api/auth/student/check');
                        if (authResponse.ok) {
                            const authData = await authResponse.json();
                            if (authData.success && authData.data) {
                                if (authData.data.isAuthenticated && authData.data.student) {
                                    studentInfo = {
                                        name: authData.data.student.name,
                                        id: authData.data.student.id
                                    };
                                }
                            }
                        }
                    } catch (authError) {
                        console.warn('Could not get student info:', authError);
                    }

                    // Debug: Log the data we're about to send
                    console.log('Debug - quizResults:', quizResults);
                    console.log('Debug - quizResults.questions:', quizResults.questions);
                    console.log('Debug - studentInfo:', studentInfo);

                    // Ensure answers is a valid array
                    const answers = Array.isArray(quizResults.questions) ? quizResults.questions : [];

                    // Prepare data in the format expected by the server
                    const resultPayload = {
                        lessonId: quizResults.lessonId,
                        answers: answers, // Server expects 'answers' not 'questions'
                        timeTaken: Number(quizResults.timeTaken) || 0, // Ensure it's a number, default to 0
                        studentInfo: studentInfo,
                        mode: window.lessonMode || 'test' // Add mode to payload
                    };

                    console.log('Debug - resultPayload:', resultPayload);

                    const saveResponse = await fetch('/api/results', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(resultPayload)
                    });

                    if (!saveResponse.ok) {
                        const errorData = await saveResponse.json();
                        throw new Error(errorData.message || 'Failed to save results');
                    }

                    const resultData = await saveResponse.json();
                    
                    // Store minimal result in localStorage for potential use on result page
                    localStorage.setItem('quizResults', JSON.stringify({
                        lessonId: quizResults.lessonId,
                        score: quizResults.score,
                        totalPoints: quizResults.totalPoints,
                        resultId: resultData.resultId
                    })); 
                    
                    // Handle differently based on mode
                    if (window.lessonMode === 'practice') {
                        // Practice mode: Show immediate feedback
                        showPracticeFeedback(quizResults);
                    } else {
                        // Test mode: Redirect to the result page
                        window.location.href = `/result/${resultData.resultId}`;
                    } 

                } catch (saveError) {
                    console.error('Error saving results:', saveError);
                    alert('Lỗi khi lưu kết quả: ' + saveError.message);
                    // Revert button state on save error
                    submitButton.disabled = false;
                    submitButton.textContent = 'Nộp bài';
                    submitButton.style.opacity = '1'; 
                    return; // Stop execution if saving failed
                }
                // --- END REVERT --- 

            } catch (error) {
                console.error('Error submitting quiz:', error);
                alert('An error occurred while submitting your quiz. Please try again.');
            } finally {
                // Ensure button is re-enabled even if redirection happens
                // Although redirection might make this less critical
                submitButton.disabled = false;
                submitButton.textContent = 'Nộp bài'; // Revert text back to Vietnamese
                submitButton.style.opacity = '1';
            }
        });
    }
});

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
    startTime = performance.now(); // Reset start time when timer starts
    
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
    
    // Simple hash function for string seed
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // Use the hash as seed for a simple PRNG
    let state = Math.abs(hash);
    return function() {
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

function selectQuestionPool(questions, poolSize, difficultyRatios, randomFunc = Math.random) {
    if (poolSize >= questions.length) {
        return [...questions];
    }
    
    // Categorize questions by difficulty (if available)
    const categorized = {
        easy: [],
        medium: [],
        hard: [],
        unknown: []
    };
    
    questions.forEach(question => {
        const difficulty = question.difficulty || 'unknown';
        if (categorized[difficulty]) {
            categorized[difficulty].push(question);
        } else {
            categorized.unknown.push(question);
        }
    });
    
    // Calculate target counts for each difficulty
    const targets = {
        easy: Math.floor(poolSize * (difficultyRatios.easy / 100)),
        medium: Math.floor(poolSize * (difficultyRatios.medium / 100)),
        hard: Math.floor(poolSize * (difficultyRatios.hard / 100))
    };
    
    // Adjust for rounding errors
    const totalTargeted = targets.easy + targets.medium + targets.hard;
    if (totalTargeted < poolSize) {
        targets.medium += poolSize - totalTargeted;
    }
    
    const selected = [];
    
    // Select from each difficulty category
    ['easy', 'medium', 'hard'].forEach(difficulty => {
        const available = categorized[difficulty];
        const target = targets[difficulty];
        
        if (available.length > 0 && target > 0) {
            const shuffledAvailable = shuffleArray(available, randomFunc);
            const count = Math.min(target, available.length);
            selected.push(...shuffledAvailable.slice(0, count));
        }
    });
    
    // Fill remaining slots with unknown difficulty or any remaining questions
    if (selected.length < poolSize) {
        const remaining = questions.filter(q => !selected.includes(q));
        const shuffledRemaining = shuffleArray(remaining, randomFunc);
        const needed = poolSize - selected.length;
        selected.push(...shuffledRemaining.slice(0, needed));
    }
    
    return selected;
}

function applyRandomization(lesson) {
    const seed = lesson.randomizationSeed || `${lesson.id}-${Date.now()}`;
    const randomFunc = createSeededRandom(seed);
    
    console.log('Applying randomization with seed:', seed);
    
    let questions = [...lesson.questions];
    
    // Apply question pool selection first
    if (lesson.enableQuestionPool && lesson.questionPoolSize > 0) {
        const difficultyRatios = lesson.difficultyRatios || { easy: 30, medium: 50, hard: 20 };
        questions = selectQuestionPool(questions, lesson.questionPoolSize, difficultyRatios, randomFunc);
        console.log(`Selected ${questions.length} questions from pool of ${lesson.questions.length}`);
    }
    
    // Shuffle question order if enabled
    if (lesson.shuffleQuestions) {
        questions = shuffleArray(questions, randomFunc);
        console.log('Questions shuffled');
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