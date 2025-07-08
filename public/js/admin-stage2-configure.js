// Stage 2: Configuration Script

let editingId = null;
let currentQuestions = []; // To store questions from Stage 1
let currentConfigData = {}; // To store config data being edited
let currentTags = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Retrieve data from sessionStorage
    const stage1DataString = sessionStorage.getItem('lessonStage1Data');
    if (!stage1DataString) {
        alert('Error: Could not find lesson content data. Please start from Stage 1.');
        // Optionally redirect back to stage 1 or admin list
        window.location.href = '/admin'; // Redirect to admin list for safety
        return;
    }

    try {
        const stage1Data = JSON.parse(stage1DataString);
        currentQuestions = stage1Data.questions || [];
        editingId = stage1Data.editingId || null;

        console.log("Stage 2 Loaded. Editing ID:", editingId, "Questions Count:", currentQuestions.length);

    } catch (error) {
        console.error("Error parsing Stage 1 data:", error);
        alert('Error processing lesson data. Please try again.');
        window.location.href = '/admin';
        return;
    }

    // 2. Load existing config data if editing
    if (editingId) {
        try {
            const response = await fetch(`/api/lessons/${editingId}`);
            if (!response.ok) throw new Error('Failed to load existing lesson configuration');
            const responseData = await response.json();
            const existingLesson = responseData.lesson;
            
            // Map snake_case database fields to camelCase for the form
            currentConfigData = {
                ...existingLesson,
                // Map all the snake_case fields to camelCase
                timeLimitEnabled: existingLesson.time_limit_enabled,
                timeLimitHours: existingLesson.time_limit_hours,
                timeLimitMinutes: existingLesson.time_limit_minutes,
                timeLimitSeconds: existingLesson.time_limit_seconds,
                showCountdown: existingLesson.show_countdown,
                autoSubmit: existingLesson.auto_submit,
                warningAlerts: existingLesson.warning_alerts,
                shuffleQuestions: existingLesson.shuffle_questions,
                shuffleAnswers: existingLesson.shuffle_answers,
                enableQuestionPool: existingLesson.enable_question_pool,
                questionPoolSize: existingLesson.question_pool_size,
                difficultyRatios: existingLesson.difficulty_ratios,
                randomizationSeed: existingLesson.randomization_seed,
                lessonImage: existingLesson.lesson_image,
                randomQuestions: existingLesson.random_questions
            };
            
            // Ensure questions aren't overwritten if they exist in fetched data (use Stage 1's)
            currentConfigData.questions = currentQuestions; 
            currentTags = new Set(currentConfigData.tags || []);
            console.log("Loaded existing config:", currentConfigData);
            console.log("Response data structure:", responseData);
        } catch (error) {
            console.error("Error loading existing lesson config:", error);
            alert(`Failed to load existing lesson configuration: ${error.message}`);
            // Continue with default/empty config but keep questions and ID
            currentConfigData = {
                id: editingId,
                questions: currentQuestions,
                tags: [],
                color: '#a4aeff',
                title: '',
                description: '',
                grade: '',
                subject: '',
                purpose: '',
                randomQuestions: 0,
                mode: 'test',
                timeLimitEnabled: false,
                timeLimitHours: 0,
                timeLimitMinutes: 30,
                timeLimitSeconds: 0,
                showCountdown: true,
                autoSubmit: true,
                warningAlerts: false,
                // Randomization settings
                shuffleQuestions: false,
                shuffleAnswers: false,
                enableQuestionPool: false,
                questionPoolSize: 5,
                difficultyRatios: {
                    easy: 30,
                    medium: 50,
                    hard: 20
                },
                randomizationSeed: ''
            };
            currentTags = new Set();
        }
    } else {
        // New lesson: Initialize empty config data but keep questions
        currentConfigData = {
            questions: currentQuestions,
            tags: [],
            color: '#a4aeff',
            title: '',
            description: '',
            grade: '',
            subject: '',
            purpose: '',
            randomQuestions: 0,
            mode: 'test',
            timeLimitEnabled: false,
            timeLimitHours: 0,
            timeLimitMinutes: 30,
            timeLimitSeconds: 0,
            showCountdown: true,
            autoSubmit: true,
            warningAlerts: false,
            // Randomization settings
            shuffleQuestions: false,
            shuffleAnswers: false,
            enableQuestionPool: false,
            questionPoolSize: 5,
            difficultyRatios: {
                easy: 30,
                medium: 50,
                hard: 20
            },
            randomizationSeed: ''
            // Initialize other fields as needed
        };
        currentTags = new Set();
        console.log("Initializing config for new lesson");
    }

    // 3. Populate the form
    populateForm();

    // 4. Add event listeners for this page
    setupEventListeners();
});

function populateForm() {
    // Populate standard fields
    document.getElementById('lesson-title').value = currentConfigData.title || '';
    document.getElementById('lesson-color').value = currentConfigData.color || '#a4aeff';
    document.getElementById('random-questions').value = currentConfigData.randomQuestions || 0;
    document.getElementById('lesson-description').value = currentConfigData.description || '';

    // Populate new fields (Grade, Subject, Purpose)
    document.getElementById('lesson-grade').value = currentConfigData.grade || '';
    document.getElementById('lesson-subject').value = currentConfigData.subject || '';
    document.getElementById('lesson-purpose').value = currentConfigData.purpose || '';
    
    // Populate mode selection
    const mode = currentConfigData.mode || 'test';
    const modeRadio = document.getElementById(mode + '-mode');
    if (modeRadio) {
        modeRadio.checked = true;
    }
    
    // Populate time limit settings
    document.getElementById('enable-time-limit').checked = currentConfigData.timeLimitEnabled || false;
    document.getElementById('time-hours').value = currentConfigData.timeLimitHours || 0;
    document.getElementById('time-minutes').value = currentConfigData.timeLimitMinutes || 30;
    document.getElementById('time-seconds').value = currentConfigData.timeLimitSeconds || 0;
    document.getElementById('show-countdown').checked = currentConfigData.showCountdown !== false;
    document.getElementById('auto-submit').checked = currentConfigData.autoSubmit !== false;
    document.getElementById('warning-alerts').checked = currentConfigData.warningAlerts || false;
    
    // Show/hide time limit controls based on checkbox
    const timeLimitControls = document.getElementById('time-limit-controls');
    if (timeLimitControls) {
        timeLimitControls.style.display = currentConfigData.timeLimitEnabled ? 'block' : 'none';
    }
    
    // Update time preview
    updateTimePreview();
    
    // Populate randomization settings
    document.getElementById('shuffle-questions').checked = currentConfigData.shuffleQuestions || false;
    document.getElementById('shuffle-answers').checked = currentConfigData.shuffleAnswers || false;
    document.getElementById('enable-question-pool').checked = currentConfigData.enableQuestionPool || false;
    document.getElementById('pool-size').value = currentConfigData.questionPoolSize || 5;
    document.getElementById('randomization-seed').value = currentConfigData.randomizationSeed || '';
    
    // Populate difficulty ratios
    if (currentConfigData.difficultyRatios) {
        document.getElementById('easy-ratio').value = currentConfigData.difficultyRatios.easy || 30;
        document.getElementById('medium-ratio').value = currentConfigData.difficultyRatios.medium || 50;
        document.getElementById('hard-ratio').value = currentConfigData.difficultyRatios.hard || 20;
    }
    
    // Show/hide question pool controls
    const questionPoolControls = document.getElementById('question-pool-controls');
    if (questionPoolControls) {
        questionPoolControls.style.display = currentConfigData.enableQuestionPool ? 'block' : 'none';
    }
    
    // Update pool max display and difficulty total
    updatePoolMaxDisplay();
    updateDifficultyTotal();

    // Populate Image
    if (currentConfigData.lessonImage) {
        const imagePreview = document.getElementById('lesson-image-preview');
        const removeButton = document.querySelector('#lesson-image')?.nextElementSibling;
         if (imagePreview && removeButton) {
            imagePreview.src = currentConfigData.lessonImage;
            imagePreview.style.display = 'block';
            removeButton.style.display = 'inline-block';
        }
    }

    // Populate Tags
    renderTags();
}

function setupEventListeners() {
    // Add listeners for all configurable fields on this page
    document.getElementById('lesson-title')?.addEventListener('input', (e) => {
        currentConfigData.title = e.target.value;
    });
    document.getElementById('lesson-color')?.addEventListener('input', (e) => { currentConfigData.color = e.target.value; });
    document.getElementById('random-questions')?.addEventListener('input', (e) => { currentConfigData.randomQuestions = parseInt(e.target.value) || 0; });
    document.getElementById('lesson-description')?.addEventListener('input', (e) => { currentConfigData.description = e.target.value; });
    document.getElementById('lesson-grade')?.addEventListener('change', (e) => { currentConfigData.grade = e.target.value; });
    document.getElementById('lesson-subject')?.addEventListener('change', (e) => { currentConfigData.subject = e.target.value; });
    document.getElementById('lesson-purpose')?.addEventListener('change', (e) => { currentConfigData.purpose = e.target.value; });
    
    // Add mode toggle listeners
    document.querySelectorAll('input[name="lesson-mode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                currentConfigData.mode = e.target.value;
                console.log('Mode changed to:', currentConfigData.mode);
            }
        });
    });
    
    // Add time limit toggle listener
    document.getElementById('enable-time-limit')?.addEventListener('change', (e) => {
        currentConfigData.timeLimitEnabled = e.target.checked;
        const timeLimitControls = document.getElementById('time-limit-controls');
        if (timeLimitControls) {
            timeLimitControls.style.display = e.target.checked ? 'block' : 'none';
        }
    });
    
    // Add time input listeners
    document.getElementById('time-hours')?.addEventListener('input', (e) => {
        currentConfigData.timeLimitHours = parseInt(e.target.value) || 0;
        updateTimePreview();
    });
    document.getElementById('time-minutes')?.addEventListener('input', (e) => {
        currentConfigData.timeLimitMinutes = parseInt(e.target.value) || 0;
        updateTimePreview();
    });
    document.getElementById('time-seconds')?.addEventListener('input', (e) => {
        currentConfigData.timeLimitSeconds = parseInt(e.target.value) || 0;
        updateTimePreview();
    });
    
    // Add time limit option listeners
    document.getElementById('show-countdown')?.addEventListener('change', (e) => {
        currentConfigData.showCountdown = e.target.checked;
    });
    document.getElementById('auto-submit')?.addEventListener('change', (e) => {
        currentConfigData.autoSubmit = e.target.checked;
    });
    document.getElementById('warning-alerts')?.addEventListener('change', (e) => {
        currentConfigData.warningAlerts = e.target.checked;
    });
    
    // Add randomization toggle listeners
    document.getElementById('shuffle-questions')?.addEventListener('change', (e) => {
        currentConfigData.shuffleQuestions = e.target.checked;
    });
    
    document.getElementById('shuffle-answers')?.addEventListener('change', (e) => {
        currentConfigData.shuffleAnswers = e.target.checked;
    });
    
    document.getElementById('enable-question-pool')?.addEventListener('change', (e) => {
        currentConfigData.enableQuestionPool = e.target.checked;
        const questionPoolControls = document.getElementById('question-pool-controls');
        if (questionPoolControls) {
            questionPoolControls.style.display = e.target.checked ? 'block' : 'none';
        }
    });
    
    document.getElementById('pool-size')?.addEventListener('input', (e) => {
        currentConfigData.questionPoolSize = parseInt(e.target.value) || 5;
        updatePoolMaxDisplay();
    });
    
    document.getElementById('randomization-seed')?.addEventListener('input', (e) => {
        currentConfigData.randomizationSeed = e.target.value;
    });
    
    // Add difficulty ratio listeners
    ['easy-ratio', 'medium-ratio', 'hard-ratio'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', (e) => {
            const difficulty = id.split('-')[0];
            if (!currentConfigData.difficultyRatios) {
                currentConfigData.difficultyRatios = { easy: 30, medium: 50, hard: 20 };
            }
            currentConfigData.difficultyRatios[difficulty] = parseInt(e.target.value) || 0;
            updateDifficultyTotal();
        });
    });
    
    document.getElementById('lesson-image')?.addEventListener('change', handleLessonImageUpload);
    document.querySelector('.remove-image-btn')?.addEventListener('click', removeLessonImage);
    document.getElementById('tag-input')?.addEventListener('keydown', handleTagInputKeydown);

     // Add save shortcut
     document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveLessonConfiguration();
        }
    });
}


// --- Tag Functions (Copied from previous script) --- 
function addTag(tagName) {
    if (!tagName) return;
    tagName = tagName.toLowerCase().trim();
    const tagInput = document.getElementById('tag-input');

    if (tagName && !currentTags.has(tagName)) {
        currentTags.add(tagName);
        renderTags(); // Update UI
        // Update the config data object
        if (currentConfigData) {
            currentConfigData.tags = Array.from(currentTags);
        }
    }
    if (tagInput) tagInput.value = ''; // Clear input
}

function removeTag(tagName) {
    currentTags.delete(tagName);
    renderTags(); // Update UI
    // Update the config data object
    if (currentConfigData) {
        currentConfigData.tags = Array.from(currentTags);
    }
}

function renderTags() {
    const tagsList = document.getElementById('tags-list');
    if (!tagsList) return;
    tagsList.innerHTML = ''; // Clear current tags
    currentTags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag-item';
        tagElement.innerHTML = `
            ${tag}
            <button type="button" class="tag-remove" onclick="removeTag('${tag}')" title="Remove tag">&times;</button>
        `;
        tagsList.appendChild(tagElement);
    });
}

function handleTagInputKeydown(e) {
    if (e.target.id !== 'tag-input') return;

    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const tagInput = e.target;
        const tagValue = tagInput.value.replace(',', '').trim();
        if (tagValue) {
            addTag(tagValue);
        } else {
            tagInput.value = '';
        }
    }
}

// --- Lesson Image Functions (Copied from previous script) ---
async function handleLessonImageUpload(event) {
     const input = event.target;
     if (!input || !input.files || input.files.length === 0) return;

    const file = input.files[0];
    const preview = document.getElementById('lesson-image-preview');
    const removeButton = input.closest('.image-upload-container')?.querySelector('.remove-image-btn');

    if (file && preview && removeButton) {
        try {
            const compressedDataUrl = await compressImage(file);
            preview.src = compressedDataUrl;
            preview.style.display = 'block';
            removeButton.style.display = 'inline-block';
            if (currentConfigData) {
                currentConfigData.lessonImage = compressedDataUrl;
            }
        } catch (error) {
            console.error('Error processing lesson image:', error);
            alert('Error processing lesson image. Please try again.');
            input.value = '';
        }
    }
}

function removeLessonImage() {
    const fileInput = document.getElementById('lesson-image');
    const preview = document.getElementById('lesson-image-preview');
    const removeButton = fileInput?.closest('.image-upload-container')?.querySelector('.remove-image-btn');

    if (fileInput) fileInput.value = '';
    if (preview) {
        preview.removeAttribute('src');
        preview.style.display = 'none';
    }
    if (removeButton) {
        removeButton.style.display = 'none';
    }
    if (currentConfigData) {
        currentConfigData.lessonImage = null;
    }
}

async function compressImage(file, maxSize = 800, quality = 0.7) {
     const img = new Image();
     const canvas = document.createElement('canvas');
     const ctx = canvas.getContext('2d');

     if (!window.URL || !window.URL.createObjectURL) {
         throw new Error('Browser does not support URL.createObjectURL');
     }
     const objectURL = URL.createObjectURL(file);

     try {
         await new Promise((resolve, reject) => {
             img.onload = resolve;
             img.onerror = (err) => reject(new Error(`Image loading failed: ${err.type}`));
             img.src = objectURL;
         });
         let { width, height } = img;
         if (width > maxSize || height > maxSize) {
             if (width > height) {
                 height = Math.round(height * (maxSize / width));
                 width = maxSize;
             } else {
                 width = Math.round(width * (maxSize / height));
                 height = maxSize;
             }
         }
         canvas.width = width;
         canvas.height = height;
         ctx.drawImage(img, 0, 0, width, height);
         const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
         const compressedDataUrl = canvas.toDataURL(mimeType, mimeType === 'image/png' ? undefined : quality);
         return compressedDataUrl;
     } finally {
         URL.revokeObjectURL(objectURL);
     }
}

// --- Question Transformation Function ---
function transformQuestionsForAPI(questions) {
    console.log('Transforming questions for API. Original questions:', questions);

    const transformedQuestions = questions.map((q, index) => {
        // Keep the original question type format that lesson display expects
        // DO NOT transform types - lesson display expects 'abcd', 'truefalse', 'number'
        let questionType = q.type;

        // Validate and normalize question type
        if (!['abcd', 'truefalse', 'number'].includes(questionType)) {
            console.warn(`Question ${index + 1}: Unknown type '${questionType}', defaulting to 'abcd'`);
            questionType = 'abcd';
        }

        // Transform correct answer format - handle both 'correct' and 'correctAnswer' properties
        let correctAnswer;
        const sourceCorrect = q.correct || q.correctAnswer || q.answer || '';
        
        if (q.type === 'abcd') {
            // For ABCD questions, correct is a letter (A, B, C, D)
            correctAnswer = sourceCorrect;
        } else if (q.type === 'truefalse') {
            // For true/false questions, keep the array format as the system expects it
            if (Array.isArray(sourceCorrect)) {
                correctAnswer = sourceCorrect;
            } else {
                // Fallback: if not an array, convert to string
                correctAnswer = String(sourceCorrect);
            }
        } else if (q.type === 'number') {
            // For number questions, correct is the answer string
            correctAnswer = String(sourceCorrect);
        } else {
            correctAnswer = sourceCorrect;
        }
        
        // Log if no correct answer found
        if (!correctAnswer) {
            console.warn(`Question ${index + 1}: No correct answer found. Properties checked: correct=${q.correct}, correctAnswer=${q.correctAnswer}, answer=${q.answer}`);
        }

        // Transform options format - keep as objects with text property for compatibility
        let options = [];
        if (q.options && Array.isArray(q.options)) {
            options = q.options.map(opt => {
                if (typeof opt === 'string') {
                    return { text: opt };
                } else if (opt && typeof opt === 'object' && opt.text) {
                    return { text: opt.text };
                } else {
                    return { text: '' };
                }
            });
        }

        const transformedQuestion = {
            question: q.question || '',
            type: questionType, // Keep original type format
            options: options, // Array of objects with text property
            correct: correctAnswer, // Use 'correct' property name
            points: q.points || 1,
            id: q.id || `q_${Math.random().toString(36).substr(2, 9)}`
        };

        console.log(`Question ${index + 1} transformed:`, {
            original: { type: q.type, correct: q.correct, options: q.options },
            transformed: { type: questionType, correct: correctAnswer, options: options }
        });

        return transformedQuestion;
    });

    console.log('All questions transformed:', transformedQuestions);
    return transformedQuestions;
}

// --- Final Save Function ---
async function saveLessonConfiguration() {
    if (!currentConfigData || !currentQuestions) {
        alert('Error: Lesson data is missing. Please start from Stage 1.');
        return;
    }

    try {
        // --- Validation ---
        const titleElement = document.getElementById('lesson-title');
        const titleValue = titleElement?.value.trim();

        // Update currentConfigData with current form values to ensure we have the latest data
        currentConfigData.title = titleValue || '';
        currentConfigData.description = document.getElementById('lesson-description')?.value.trim() || '';

        // Validate that title is not empty
        if (!currentConfigData.title || currentConfigData.title.length === 0) {
            alert('Please enter a lesson title.');
            if (titleElement) {
                titleElement.focus();
            }
            return;
        }

        const now = new Date().toISOString();

        // Transform questions to API format
        const transformedQuestions = transformQuestionsForAPI(currentQuestions);

        // Construct the final payload
        const lessonPayload = {
            // Core metadata from form
            title: currentConfigData.title,
            color: document.getElementById('lesson-color')?.value || '#a4aeff',
            random_questions: parseInt(document.getElementById('random-questions')?.value) || 0,
            description: currentConfigData.description,
            lesson_image: currentConfigData.lessonImage || null,
            tags: Array.from(currentTags),

            // New configuration fields
            grade: document.getElementById('lesson-grade')?.value || null,
            subject: document.getElementById('lesson-subject')?.value || null,
            purpose: document.getElementById('lesson-purpose')?.value || null,
            mode: currentConfigData.mode || 'test',
            
            // Time limit configuration (using snake_case field names to match database schema)
            time_limit_enabled: currentConfigData.timeLimitEnabled || false,
            time_limit_hours: currentConfigData.timeLimitHours || 0,
            time_limit_minutes: currentConfigData.timeLimitMinutes || 30,
            time_limit_seconds: currentConfigData.timeLimitSeconds || 0,
            show_countdown: currentConfigData.showCountdown !== false,
            auto_submit: currentConfigData.autoSubmit !== false,
            warning_alerts: currentConfigData.warningAlerts || false,

            // Randomization configuration (using snake_case field names to match database schema)
            shuffle_questions: currentConfigData.shuffleQuestions || false,
            shuffle_answers: currentConfigData.shuffleAnswers || false,
            enable_question_pool: currentConfigData.enableQuestionPool || false,
            question_pool_size: currentConfigData.questionPoolSize || 5,
            difficulty_ratios: currentConfigData.difficultyRatios || { easy: 30, medium: 50, hard: 20 },
            randomization_seed: currentConfigData.randomizationSeed || '',

            // Questions from Stage 1 (transformed to API format)
            // Database expects questions to be stored directly in questions column
            questions: transformedQuestions,

            last_updated: now // Use snake_case field name to match database schema
        };

        // Determine API endpoint and method
        let method = 'POST';
        let url = '/api/lessons';
        if (editingId) {
            method = 'PUT';
            url = `/api/lessons/${editingId}`;
        }

        console.log(`Saving lesson config. URL: ${url}, Method: ${method}`);

        const saveButton = document.querySelector('.save-btn');
        if (saveButton) saveButton.disabled = true;

        // Get CSRF token before making the request
        const csrfResponse = await fetch('/api/csrf-token');
        if (!csrfResponse.ok) {
            throw new Error('Failed to get CSRF token');
        }
        const csrfData = await csrfResponse.json();

        // Add CSRF token to the payload
        lessonPayload.csrfToken = csrfData.csrfToken;

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lessonPayload)
        });

        if (saveButton) saveButton.disabled = false;

        if (!response.ok) {
            let errorData = { error: `Request failed with status ${response.status}` };
            try {
                errorData = await response.json();
            } catch (e) { /* Ignore if response is not JSON */ }
            console.error("Save error response:", errorData);
            throw new Error(errorData.error || errorData.message || 'Failed to save lesson configuration');
        }

        // Success - clear sessionStorage and redirect
        sessionStorage.removeItem('lessonStage1Data');
        window.location.href = '/admin';

    } catch (error) {
        console.error('Error saving lesson configuration:', error);
        alert('Error saving lesson: ' + error.message);
        const saveButton = document.querySelector('.save-btn');
        if (saveButton) saveButton.disabled = false;
    }
}

// Function to update time preview
function updateTimePreview() {
    const hours = currentConfigData.timeLimitHours || 0;
    const minutes = currentConfigData.timeLimitMinutes || 0;
    const seconds = currentConfigData.timeLimitSeconds || 0;
    
    const previewElement = document.getElementById('time-preview');
    if (previewElement) {
        let timeText = '';
        if (hours > 0) {
            timeText += `${hours.toString().padStart(2, '0')}:`;
        }
        timeText += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        previewElement.textContent = timeText;
    }
}

// Function to update pool max display
function updatePoolMaxDisplay() {
    const poolMaxElement = document.getElementById('pool-max-display');
    if (poolMaxElement) {
        const totalQuestions = currentQuestions ? currentQuestions.length : 0;
        poolMaxElement.textContent = `/ ${totalQuestions} câu có sẵn`;
        
        // Update pool size max attribute
        const poolSizeInput = document.getElementById('pool-size');
        if (poolSizeInput) {
            poolSizeInput.max = totalQuestions;
            
            // Ensure pool size doesn't exceed total questions
            const currentPoolSize = parseInt(poolSizeInput.value) || 5;
            if (currentPoolSize > totalQuestions) {
                poolSizeInput.value = totalQuestions;
                currentConfigData.questionPoolSize = totalQuestions;
            }
        }
    }
}

// Function to update difficulty total display
function updateDifficultyTotal() {
    const easyRatio = parseInt(document.getElementById('easy-ratio')?.value) || 0;
    const mediumRatio = parseInt(document.getElementById('medium-ratio')?.value) || 0;
    const hardRatio = parseInt(document.getElementById('hard-ratio')?.value) || 0;
    
    const total = easyRatio + mediumRatio + hardRatio;
    const totalElement = document.getElementById('difficulty-total');
    
    if (totalElement) {
        totalElement.textContent = `Tổng: ${total}%`;
        
        // Update visual feedback
        if (total === 100) {
            totalElement.classList.remove('invalid');
        } else {
            totalElement.classList.add('invalid');
        }
    }
}

// AI Generation Functions
async function generateAIDescription() {
    const generateBtn = document.getElementById('generate-description-btn');
    const descriptionTextarea = document.getElementById('lesson-description');
    const aiStatus = document.getElementById('description-ai-status');
    
    // Disable button and show loading
    generateBtn.disabled = true;
    aiStatus.style.display = 'flex';
    aiStatus.className = 'ai-status';
    aiStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Đang tạo mô tả bằng AI...</span>';
    
    try {
        // Gather lesson data for AI
        const lessonData = {
            title: currentConfigData.title || document.getElementById('lesson-title').value,
            questions: currentQuestions,
            grade: currentConfigData.grade || document.getElementById('lesson-grade').value,
            subject: currentConfigData.subject || document.getElementById('lesson-subject').value || 'Vật lý',
            tags: Array.from(currentTags)
        };

        // Get CSRF token before making the request
        const csrfResponse = await fetch('/api/csrf-token');
        if (!csrfResponse.ok) {
            throw new Error('Failed to get CSRF token');
        }
        const csrfData = await csrfResponse.json();

        // Add CSRF token to the payload
        lessonData.csrfToken = csrfData.csrfToken;

        // Call API to generate AI summary
        const response = await fetch('/api/lessons/generate-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lessonData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate AI description');
        }
        
        const result = await response.json();
        
        // Update textarea with generated description
        descriptionTextarea.value = result.summary;
        currentConfigData.description = result.summary;
        
        // Show success status
        aiStatus.className = 'ai-status success';
        aiStatus.innerHTML = '<i class="fas fa-check-circle"></i><span>Mô tả đã được tạo thành công!</span>';
        
        // Hide status after 3 seconds
        setTimeout(() => {
            aiStatus.style.display = 'none';
        }, 3000);
        
    } catch (error) {
        console.error('Error generating AI description:', error);
        
        // Show error status
        aiStatus.className = 'ai-status error';
        aiStatus.innerHTML = `<i class="fas fa-times-circle"></i><span>Lỗi: ${error.message}</span>`;
        
        // Hide status after 5 seconds
        setTimeout(() => {
            aiStatus.style.display = 'none';
        }, 5000);
    } finally {
        generateBtn.disabled = false;
    }
}

async function generateAIImage() {
    const generateBtn = document.getElementById('generate-image-btn');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewImg = document.getElementById('lesson-image-preview');
    const aiStatus = document.getElementById('image-ai-status');
    
    // Disable button and show loading
    generateBtn.disabled = true;
    aiStatus.style.display = 'flex';
    aiStatus.className = 'ai-status';
    aiStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Đang tạo ảnh bằng AI...</span>';
    
    try {
        // Gather lesson data for AI
        const lessonData = {
            title: currentConfigData.title || document.getElementById('lesson-title').value,
            questions: currentQuestions,
            grade: currentConfigData.grade || document.getElementById('lesson-grade').value,
            subject: currentConfigData.subject || document.getElementById('lesson-subject').value || 'Vật lý',
            tags: Array.from(currentTags)
        };

        // Get CSRF token before making the request
        const csrfResponse = await fetch('/api/csrf-token');
        if (!csrfResponse.ok) {
            throw new Error('Failed to get CSRF token');
        }
        const csrfData = await csrfResponse.json();

        const payload = {
            lessonData,
            csrfToken: csrfData.csrfToken
        };

        // Call API to generate AI image
        const response = await fetch('/api/lessons/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to generate AI image');
        }
        
        const result = await response.json();
        
        // Update image preview
        imagePreviewImg.src = result.imageUrl;
        imagePreviewImg.style.display = 'block';
        imagePreview.style.display = 'block';
        
        // Store the AI generated image URL
        currentConfigData.ai_image_url = result.imageUrl;
        currentConfigData.ai_image_prompt = result.prompt;
        
        // Show success status
        aiStatus.className = 'ai-status success';
        aiStatus.innerHTML = '<i class="fas fa-check-circle"></i><span>Ảnh đã được tạo thành công!</span>';
        
        // Hide status after 3 seconds
        setTimeout(() => {
            aiStatus.style.display = 'none';
        }, 3000);
        
    } catch (error) {
        console.error('Error generating AI image:', error);
        
        // Show error status
        aiStatus.className = 'ai-status error';
        aiStatus.innerHTML = `<i class="fas fa-times-circle"></i><span>Lỗi: ${error.message}</span>`;
        
        // Hide status after 5 seconds
        setTimeout(() => {
            aiStatus.style.display = 'none';
        }, 5000);
    } finally {
        generateBtn.disabled = false;
    }
}

// Add AI button event listeners
function setupAIEventListeners() {
    const generateDescriptionBtn = document.getElementById('generate-description-btn');
    const generateImageBtn = document.getElementById('generate-image-btn');
    
    if (generateDescriptionBtn) {
        generateDescriptionBtn.addEventListener('click', generateAIDescription);
    }
    
    if (generateImageBtn) {
        generateImageBtn.addEventListener('click', generateAIImage);
    }
}

// Call this in setupEventListeners function
// Make sure to add this to the existing setupEventListeners function
const existingSetupEventListeners = setupEventListeners;
setupEventListeners = function() {
    existingSetupEventListeners();
    setupAIEventListeners();
};

// Optional: Clear sessionStorage if the user navigates away without saving
window.addEventListener('beforeunload', () => {
    // You might want to add a confirmation here if data is unsaved
    // For simplicity, just clear it. Be cautious if user might want to go back.
    // Consider clearing only if not navigating to stage 1?
    // sessionStorage.removeItem('lessonStage1Data'); 
}); 