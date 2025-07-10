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
                questionTypeDistribution: existingLesson.question_type_distribution || existingLesson.difficulty_ratios || { abcd: 10, truefalse: 5, number: 3 },
                pointsDistribution: existingLesson.points_distribution || { abcd: 6, truefalse: 3, number: 1 },
                randomizationSeed: existingLesson.randomization_seed,
                lessonImage: existingLesson.lesson_image
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
                questionTypeDistribution: {
                    abcd: 10,
                    truefalse: 5,
                    number: 3
                },
                pointsDistribution: {
                    abcd: 6,
                    truefalse: 3,
                    number: 1
                },
                randomizationSeed: ''
            };
            currentTags = new Set();
        }
    } else {
        // New lesson: Initialize config based on actual questions
        const questionCounts = { abcd: 0, truefalse: 0, number: 0 };
        
        // Count actual question types
        if (currentQuestions) {
            currentQuestions.forEach(q => {
                const normalizedType = q.type === 'multiple_choice' ? 'abcd' :
                                     q.type === 'true_false' ? 'truefalse' :
                                     q.type === 'fill_blank' ? 'number' : q.type;
                
                if (questionCounts.hasOwnProperty(normalizedType)) {
                    questionCounts[normalizedType]++;
                }
            });
        }
        
        // Set initial distribution based on what exists, default to all questions
        const questionTypeDistribution = {
            abcd: questionCounts.abcd,
            truefalse: questionCounts.truefalse,
            number: questionCounts.number
        };
        
        // Calculate default points distribution (aim for 10 total points)
        const totalQuestions = questionCounts.abcd + questionCounts.truefalse + questionCounts.number;
        const pointsDistribution = {
            abcd: questionCounts.abcd > 0 ? parseFloat((10 * questionCounts.abcd / totalQuestions).toFixed(1)) : 0,
            truefalse: questionCounts.truefalse > 0 ? parseFloat((10 * questionCounts.truefalse / totalQuestions).toFixed(1)) : 0,
            number: questionCounts.number > 0 ? parseFloat((10 * questionCounts.number / totalQuestions).toFixed(1)) : 0
        };
        
        currentConfigData = {
            questions: currentQuestions,
            tags: [],
            color: '#a4aeff',
            title: '',
            description: '',
            grade: '',
            subject: '',
            purpose: '',
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
            questionPoolSize: totalQuestions,
            questionTypeDistribution: questionTypeDistribution,
            pointsDistribution: pointsDistribution,
            randomizationSeed: ''
            // Initialize other fields as needed
        };
        currentTags = new Set();
        console.log("Initializing config for new lesson with question counts:", questionCounts);
    }

    // 3. Populate the form
    populateForm();

    // 4. Add event listeners for this page
    setupEventListeners();
});

function populateForm() {
    // Populate standard fields with null checks
    const titleElement = document.getElementById('lesson-title');
    if (titleElement) titleElement.value = currentConfigData.title || '';
    
    const colorElement = document.getElementById('lesson-color');
    if (colorElement) colorElement.value = currentConfigData.color || '#a4aeff';
    
    const descriptionElement = document.getElementById('lesson-description');
    if (descriptionElement) descriptionElement.value = currentConfigData.description || '';

    // Populate new fields (Grade, Subject, Purpose)
    const gradeElement = document.getElementById('lesson-grade');
    if (gradeElement) gradeElement.value = currentConfigData.grade || '';
    
    const subjectElement = document.getElementById('lesson-subject');
    if (subjectElement) subjectElement.value = currentConfigData.subject || '';
    
    const purposeElement = document.getElementById('lesson-purpose');
    if (purposeElement) purposeElement.value = currentConfigData.purpose || '';
    
    // Populate mode selection
    const mode = currentConfigData.mode || 'test';
    const modeRadio = document.getElementById(mode + '-mode');
    if (modeRadio) {
        modeRadio.checked = true;
    }
    
    // Populate time limit settings with null checks
    const enableTimeLimitElement = document.getElementById('enable-time-limit');
    if (enableTimeLimitElement) enableTimeLimitElement.checked = currentConfigData.timeLimitEnabled || false;
    
    const timeHoursElement = document.getElementById('time-hours');
    if (timeHoursElement) timeHoursElement.value = currentConfigData.timeLimitHours || 0;
    
    const timeMinutesElement = document.getElementById('time-minutes');
    if (timeMinutesElement) timeMinutesElement.value = currentConfigData.timeLimitMinutes || 30;
    
    const timeSecondsElement = document.getElementById('time-seconds');
    if (timeSecondsElement) timeSecondsElement.value = currentConfigData.timeLimitSeconds || 0;
    
    const showCountdownElement = document.getElementById('show-countdown');
    if (showCountdownElement) showCountdownElement.checked = currentConfigData.showCountdown !== false;
    
    const autoSubmitElement = document.getElementById('auto-submit');
    if (autoSubmitElement) autoSubmitElement.checked = currentConfigData.autoSubmit !== false;
    
    const warningAlertsElement = document.getElementById('warning-alerts');
    if (warningAlertsElement) warningAlertsElement.checked = currentConfigData.warningAlerts || false;
    
    // Show/hide time limit controls based on checkbox
    const timeLimitControls = document.getElementById('time-limit-controls');
    if (timeLimitControls) {
        timeLimitControls.style.display = currentConfigData.timeLimitEnabled ? 'block' : 'none';
    }
    
    // Update time preview
    updateTimePreview();
    
    // Populate randomization settings with null checks
    const shuffleQuestionsElement = document.getElementById('shuffle-questions');
    if (shuffleQuestionsElement) shuffleQuestionsElement.checked = currentConfigData.shuffleQuestions || false;
    
    const shuffleAnswersElement = document.getElementById('shuffle-answers');
    if (shuffleAnswersElement) shuffleAnswersElement.checked = currentConfigData.shuffleAnswers || false;
    
    const enableQuestionPoolElement = document.getElementById('enable-question-pool');
    if (enableQuestionPoolElement) enableQuestionPoolElement.checked = currentConfigData.enableQuestionPool || false;
    
    const poolSizeElement = document.getElementById('pool-size');
    if (poolSizeElement) poolSizeElement.value = currentConfigData.questionPoolSize || 5;
    
    const randomizationSeedElement = document.getElementById('randomization-seed');
    if (randomizationSeedElement) randomizationSeedElement.value = currentConfigData.randomizationSeed || '';
    
    // Count actual question types first
    const actualQuestionCounts = { abcd: 0, truefalse: 0, number: 0 };
    if (currentQuestions) {
        currentQuestions.forEach(q => {
            const normalizedType = q.type === 'multiple_choice' ? 'abcd' :
                                 q.type === 'true_false' ? 'truefalse' :
                                 q.type === 'fill_blank' ? 'number' : q.type;
            
            if (actualQuestionCounts.hasOwnProperty(normalizedType)) {
                actualQuestionCounts[normalizedType]++;
            }
        });
    }
    
    // Populate question type distribution
    if (currentConfigData.questionTypeDistribution) {
        const abcdCount = document.getElementById('abcd-count');
        const truefalseCount = document.getElementById('truefalse-count');
        const numberCount = document.getElementById('number-count');
        
        // Use actual counts as maximum, don't exceed available questions
        if (abcdCount) {
            const value = currentConfigData.questionTypeDistribution.abcd || 0;
            abcdCount.value = actualQuestionCounts.abcd > 0 ? Math.min(value, actualQuestionCounts.abcd) : 0;
        }
        if (truefalseCount) {
            const value = currentConfigData.questionTypeDistribution.truefalse || 0;
            truefalseCount.value = actualQuestionCounts.truefalse > 0 ? Math.min(value, actualQuestionCounts.truefalse) : 0;
        }
        if (numberCount) {
            const value = currentConfigData.questionTypeDistribution.number || 0;
            numberCount.value = actualQuestionCounts.number > 0 ? Math.min(value, actualQuestionCounts.number) : 0;
        }
    }
    
    // Populate points distribution
    if (currentConfigData.pointsDistribution) {
        const abcdPoints = document.getElementById('abcd-points');
        const truefalsePoints = document.getElementById('truefalse-points');
        const numberPoints = document.getElementById('number-points');
        
        // Only set points for question types that exist
        if (abcdPoints) abcdPoints.value = actualQuestionCounts.abcd > 0 ? (currentConfigData.pointsDistribution.abcd || 0) : 0;
        if (truefalsePoints) truefalsePoints.value = actualQuestionCounts.truefalse > 0 ? (currentConfigData.pointsDistribution.truefalse || 0) : 0;
        if (numberPoints) numberPoints.value = actualQuestionCounts.number > 0 ? (currentConfigData.pointsDistribution.number || 0) : 0;
    }
    
    // Show/hide question pool controls
    const questionPoolControls = document.getElementById('question-pool-controls');
    if (questionPoolControls) {
        questionPoolControls.style.display = currentConfigData.enableQuestionPool ? 'block' : 'none';
    }
    
    // Update pool max display, question type totals, and points calculations
    updatePoolMaxDisplay();
    updateQuestionTypeDisplay();
    updatePointsCalculations();

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
    
    // Add question type distribution listeners
    ['abcd-count', 'truefalse-count', 'number-count'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', (e) => {
            const type = id.split('-')[0];
            if (!currentConfigData.questionTypeDistribution) {
                currentConfigData.questionTypeDistribution = { abcd: 10, truefalse: 5, number: 3 };
            }
            currentConfigData.questionTypeDistribution[type] = parseInt(e.target.value) || 0;
            updateQuestionTypeDisplay();
            updatePointsCalculations();
        });
    });
    
    // Add points distribution listeners
    ['abcd-points', 'truefalse-points', 'number-points'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', (e) => {
            const type = id.split('-')[0];
            if (!currentConfigData.pointsDistribution) {
                currentConfigData.pointsDistribution = { abcd: 6, truefalse: 3, number: 1 };
            }
            currentConfigData.pointsDistribution[type] = parseFloat(e.target.value) || 0;
            updatePointsCalculations();
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
    
    // Get current distribution settings
    const questionDist = currentConfigData.questionTypeDistribution || { abcd: 10, truefalse: 5, number: 3 };
    const pointsDist = currentConfigData.pointsDistribution || { abcd: 6, truefalse: 3, number: 1 };
    
    // Calculate points per question for each type
    const pointsPerQuestion = {
        abcd: questionDist.abcd > 0 ? pointsDist.abcd / questionDist.abcd : 1,
        truefalse: questionDist.truefalse > 0 ? pointsDist.truefalse / questionDist.truefalse : 1,
        number: questionDist.number > 0 ? pointsDist.number / questionDist.number : 1
    };

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

        // Assign points based on question type
        const normalizedTypeForPoints = questionType === 'multiple_choice' ? 'abcd' :
                                      questionType === 'true_false' ? 'truefalse' :
                                      questionType === 'fill_blank' ? 'number' : questionType;
        
        const assignedPoints = pointsPerQuestion[normalizedTypeForPoints] || 1;

        const transformedQuestion = {
            question: q.question || '',
            type: questionType, // Keep original type format
            options: options, // Array of objects with text property
            correct: correctAnswer, // Use 'correct' property name
            points: assignedPoints, // Use calculated points based on type
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
            question_type_distribution: currentConfigData.questionTypeDistribution || { abcd: 10, truefalse: 5, number: 3 },
            points_distribution: currentConfigData.pointsDistribution || { abcd: 6, truefalse: 3, number: 1 },
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

// Function to update question type display
function updateQuestionTypeDisplay() {
    // Count questions by type
    const questionCounts = { abcd: 0, truefalse: 0, number: 0 };
    
    if (currentQuestions) {
        currentQuestions.forEach(q => {
            const normalizedType = q.type === 'multiple_choice' ? 'abcd' :
                                 q.type === 'true_false' ? 'truefalse' :
                                 q.type === 'fill_blank' ? 'number' : q.type;
            
            if (questionCounts.hasOwnProperty(normalizedType)) {
                questionCounts[normalizedType]++;
            }
        });
    }
    
    // Update available displays and set default values based on what exists
    const abcdAvailable = document.getElementById('abcd-available');
    const truefalseAvailable = document.getElementById('truefalse-available');
    const numberAvailable = document.getElementById('number-available');
    
    const abcdCountInput = document.getElementById('abcd-count');
    const truefalseCountInput = document.getElementById('truefalse-count');
    const numberCountInput = document.getElementById('number-count');
    
    // Only set values for question types that exist
    if (abcdAvailable) {
        abcdAvailable.textContent = `/ ${questionCounts.abcd} câu`;
        // If no ABCD questions exist, set count to 0
        if (questionCounts.abcd === 0 && abcdCountInput && abcdCountInput.value > 0) {
            abcdCountInput.value = 0;
            if (currentConfigData.questionTypeDistribution) {
                currentConfigData.questionTypeDistribution.abcd = 0;
            }
        }
    }
    
    if (truefalseAvailable) {
        truefalseAvailable.textContent = `/ ${questionCounts.truefalse} câu`;
        // If no True/False questions exist, set count to 0
        if (questionCounts.truefalse === 0 && truefalseCountInput && truefalseCountInput.value > 0) {
            truefalseCountInput.value = 0;
            if (currentConfigData.questionTypeDistribution) {
                currentConfigData.questionTypeDistribution.truefalse = 0;
            }
        }
    }
    
    if (numberAvailable) {
        numberAvailable.textContent = `/ ${questionCounts.number} câu`;
        // If no Number questions exist, set count to 0
        if (questionCounts.number === 0 && numberCountInput && numberCountInput.value > 0) {
            numberCountInput.value = 0;
            if (currentConfigData.questionTypeDistribution) {
                currentConfigData.questionTypeDistribution.number = 0;
            }
        }
    }
    
    // Update total
    const abcdCount = parseInt(abcdCountInput?.value) || 0;
    const truefalseCount = parseInt(truefalseCountInput?.value) || 0;
    const numberCount = parseInt(numberCountInput?.value) || 0;
    const total = abcdCount + truefalseCount + numberCount;
    
    const totalElement = document.getElementById('question-type-total');
    if (totalElement) {
        totalElement.textContent = `Tổng: ${total} câu`;
    }
    
    // Update pool size to match total
    const poolSizeInput = document.getElementById('pool-size');
    if (poolSizeInput) {
        poolSizeInput.value = total;
        currentConfigData.questionPoolSize = total;
    }
    
    // Update points calculations after adjusting counts
    updatePointsCalculations();
}

// Function to update points calculations
function updatePointsCalculations() {
    const questionDist = currentConfigData.questionTypeDistribution || { abcd: 0, truefalse: 0, number: 0 };
    const pointsDist = currentConfigData.pointsDistribution || { abcd: 0, truefalse: 0, number: 0 };
    
    // Calculate points per question for each type, handling division by zero
    const abcdPerQuestion = questionDist.abcd > 0 ? (pointsDist.abcd / questionDist.abcd).toFixed(2) : '0';
    const truefalsePerQuestion = questionDist.truefalse > 0 ? (pointsDist.truefalse / questionDist.truefalse).toFixed(2) : '0';
    const numberPerQuestion = questionDist.number > 0 ? (pointsDist.number / questionDist.number).toFixed(2) : '0';
    
    // Update displays
    const abcdPointsPer = document.getElementById('abcd-points-per');
    const truefalsePointsPer = document.getElementById('truefalse-points-per');
    const numberPointsPer = document.getElementById('number-points-per');
    
    if (abcdPointsPer) {
        if (questionDist.abcd > 0) {
            abcdPointsPer.textContent = `= ${abcdPerQuestion} điểm/câu`;
        } else {
            abcdPointsPer.textContent = `= N/A`;
        }
    }
    
    if (truefalsePointsPer) {
        if (questionDist.truefalse > 0) {
            truefalsePointsPer.textContent = `= ${truefalsePerQuestion} điểm/câu`;
        } else {
            truefalsePointsPer.textContent = `= N/A`;
        }
    }
    
    if (numberPointsPer) {
        if (questionDist.number > 0) {
            numberPointsPer.textContent = `= ${numberPerQuestion} điểm/câu`;
        } else {
            numberPointsPer.textContent = `= N/A`;
        }
    }
    
    // Update total points (ensure numeric addition)
    const totalPoints = parseFloat(pointsDist.abcd || 0) + parseFloat(pointsDist.truefalse || 0) + parseFloat(pointsDist.number || 0);
    const totalElement = document.getElementById('points-total');
    if (totalElement) {
        totalElement.textContent = `Tổng điểm: ${totalPoints}`;
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

        // Get custom prompt if provided
        const customPromptInput = document.getElementById('custom-image-prompt');
        const customPrompt = customPromptInput ? customPromptInput.value.trim() : '';

        // Get CSRF token before making the request
        const csrfResponse = await fetch('/api/csrf-token');
        if (!csrfResponse.ok) {
            throw new Error('Failed to get CSRF token');
        }
        const csrfData = await csrfResponse.json();

        const payload = {
            lessonData,
            customPrompt: customPrompt || null,
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

        // Store the AI generated image as base64 in lessonImage field (same as manual upload)
        currentConfigData.lessonImage = result.imageUrl;
        currentConfigData.ai_image_prompt = result.prompt;

        // Show success status with model and prompt type info
        const promptType = result.isCustomPrompt ? 'tùy chỉnh' : 'tự động';
        const modelUsed = result.model || 'AI';
        aiStatus.className = 'ai-status success';
        aiStatus.innerHTML = `<i class="fas fa-check-circle"></i><span>Ảnh đã được tạo thành công! (${modelUsed}, ${promptType})</span>`;
        
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