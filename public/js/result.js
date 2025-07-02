let currentResult = null;
let resultData = null;
let sortedQuestions = [];

// --- Student Authentication Functions (optional) ---
async function checkStudentAuthentication() {
    try {
        const response = await fetch('/api/check-student-auth');
        if (!response.ok) {
            console.log('Auth check failed, user not authenticated');
            return false;
        }
        const authData = await response.json();

        if (authData.isAuthenticated && authData.student) {
            console.log('Student authenticated:', authData.student.name);
            return true;
        } else {
            console.log('Student not authenticated');
            return false;
        }
    } catch (error) {
        console.error('Error checking student authentication:', error);
        return false;
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
        loader.classList.toggle('hidden', !show);
    }
}

async function displayResults() {
    // Check student authentication first
    const isAuthenticated = await checkStudentAuthentication();
    if (!isAuthenticated) {
        return; // Stop execution if not authenticated
    }
    
    showLoader(true);
    const resultData = JSON.parse(localStorage.getItem('quizResults'));
    if (!resultData) {
        document.getElementById('result').innerHTML = '<p class="no-results">No results found. Please take a quiz first.</p>';
        return;
    }

    // Get result ID from URL if it exists
    const resultId = window.location.pathname.split('/result/')[1];

    try {
        if (resultId) {
            // Fetch result from server
            const response = await fetch(`/api/results/${resultId}`);
            if (!response.ok) throw new Error('Result not found');
            const responseData = await response.json();
            // Extract the actual result data from the API response
            currentResult = responseData.result || responseData;
        } else {
            // Use the result from localStorage
            currentResult = resultData;
        }

        // Log the result for debugging
        console.log('Result data:', currentResult);
        
        // Store this result in session storage for persistence
        storeResultInSession(currentResult);
        
        // Update statistics cards
        updateStatisticsCards(currentResult);
        
        // Display results
        displaySortedResults('all');
    } catch (error) {
        console.error('Error loading results:', error);
        document.getElementById('result').innerHTML = '<p class="no-results">Result not found. Please try again.</p>';
    } finally {
        showLoader(false);
    }
}

// Store result in session storage for better persistence across page reloads
function storeResultInSession(result) {
    if (!result) return;
    
    try {
        // Store lesson ID
        if (result.lessonId) {
            sessionStorage.setItem('lastLessonId', result.lessonId);
        }
        
        // Store score and total
        if (result.score !== undefined && result.totalPoints !== undefined) {
            sessionStorage.setItem('lastUserScore', result.score);
            sessionStorage.setItem('lastTotalPoints', result.totalPoints);
        }
        
        // Store a minimal version of the result for persistence
        const minimalResult = {
            lessonId: result.lessonId,
            score: result.score,
            totalPoints: result.totalPoints,
            timestamp: result.timestamp || new Date().toISOString()
        };
        
        sessionStorage.setItem('lastResult', JSON.stringify(minimalResult));
        
    } catch (error) {
        console.error('Error storing result in session:', error);
    }
}

function updateStatisticsCards(result) {
    // Handle different data structures - questions might be in different properties
    const questions = result.questions || result.answers || [];

    // Calculate statistics
    const totalQuestions = questions.length;
    const correctAnswers = questions.filter(q => q.isCorrect).length;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const accuracy = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : '0.0';
    const score = result.score || 0;
    const totalPoints = result.totalPoints || totalQuestions;
    const scorePercentage = totalPoints > 0 ? ((score / totalPoints) * 100).toFixed(1) : '0.0';

    // Update statistics cards
    document.getElementById('score-value').textContent = `${score}/${totalPoints}`;
    
    // Get lesson name
    if (result.lessonId) {
        fetchLessonName(result.lessonId);
    }
    
    // Get user ranking
    if (result.lessonId) {
        fetchUserRanking(result.lessonId, score, totalPoints);
    }
}

// Function to fetch lesson name
async function fetchLessonName(lessonId) {
    try {
        const response = await fetch(`/api/lessons/${lessonId}`);
        if (!response.ok) throw new Error('Failed to fetch lesson');
        
        const lessonData = await response.json();
        document.getElementById('lesson-name').textContent = lessonData.title || 'Unknown';
    } catch (error) {
        console.error('Error fetching lesson name:', error);
        document.getElementById('lesson-name').textContent = 'Unknown';
    }
}

// Function to fetch user ranking
async function fetchUserRanking(lessonId, userScore, totalPoints) {
    try {
        console.log(`Fetching ranking data for lesson: ${lessonId}, score: ${userScore}/${totalPoints}`);
        
        // First check if we have any previously stored results for this lesson
        const storedResults = getPreviousResults(lessonId);
        
        // Try to fetch from the API
        let apiData = null;
        let apiSuccess = false;
        
        try {
            const response = await fetch(`/api/lessons/${lessonId}/statistics`);
            if (response.ok) {
                apiData = await response.json();
                apiSuccess = true;
                console.log('API statistics data received:', apiData);
            } else {
                console.error(`API call failed with status: ${response.status} ${response.statusText}`);
            }
        } catch (apiError) {
            console.error('Error fetching from API:', apiError);
        }
        
        // Add the current user's result
        const currentResult = {
            student_id: getCurrentStudentId(),
            score: `${(userScore / totalPoints * 100).toFixed(1)}%`,
            timestamp: new Date().toISOString()
        };
        
        // Store this attempt in our local storage for future reference
        storeAttemptLocally(lessonId, currentResult);
        
        // Prepare transcripts from either API or local storage
        let transcripts = [];
        
        if (apiSuccess && apiData) {
            // Use API data if available
            if (Array.isArray(apiData.transcripts)) {
                transcripts = apiData.transcripts;
            } else if (apiData && typeof apiData === 'object') {
                // Try to find transcripts in other properties
                const possibleTranscriptKeys = ['transcripts', 'results', 'attempts', 'submissions'];
                for (const key of possibleTranscriptKeys) {
                    if (Array.isArray(apiData[key])) {
                        transcripts = apiData[key];
                        console.log(`Found transcripts in property: ${key}`);
                        break;
                    }
                }
            }
        }
        
        // If no transcripts from API, use locally stored results
        if (transcripts.length === 0 && storedResults.length > 0) {
            console.log('Using locally stored results instead of API data');
            transcripts = storedResults;
        }
        
        // Add current user's result if not already included
        const alreadyIncluded = transcripts.some(t => 
            t.student_id === currentResult.student_id && 
            parseFloat(t.score?.replace('%', '') || 0) >= parseFloat(currentResult.score.replace('%', ''))
        );
        
        if (!alreadyIncluded) {
            console.log('Adding current user result to transcripts');
            transcripts.push(currentResult);
        }
        
        // Ensure we have at least the current user's result
        if (transcripts.length === 0) {
            console.log('No transcripts found, adding only current user');
            transcripts = [currentResult];
        }
        
        console.log(`Processing ${transcripts.length} total submissions for this lesson`);
        
        // Group results by student and take only the highest score for each student
        const uniqueStudentScores = new Map();
        
        transcripts.forEach(transcript => {
            // Try to get a unique identifier for the student
            // First try student_id, then any id field, then fallback to using a property combo
            const studentId = transcript.student_id || 
                              transcript.id || 
                              transcript.userId || 
                              transcript.studentId ||
                              generateFallbackId(transcript);
            
            if (!studentId) {
                console.warn('Could not identify student for transcript:', transcript);
                return;
            }
            
            const scoreStr = transcript.score || "0%";
            
            // Remove the % sign and convert to number
            let score = 0;
            try {
                // Handle different score formats (100%, 100, 0.95, etc.)
                if (typeof scoreStr === 'string' && scoreStr.includes('%')) {
                    score = parseFloat(scoreStr.replace('%', ''));
                } else if (typeof scoreStr === 'number') {
                    // Assume it's already a percentage if > 1, otherwise multiply by 100
                    score = scoreStr > 1 ? scoreStr : scoreStr * 100;
                } else {
                    score = parseFloat(scoreStr);
                }
                
                if (isNaN(score)) score = 0;
            } catch (e) {
                console.warn(`Error parsing score "${scoreStr}":`, e);
                score = 0;
            }
            
            console.log(`Processed score: ${score} for student: ${studentId}`);
            
            if (!uniqueStudentScores.has(studentId) || score > uniqueStudentScores.get(studentId)) {
                uniqueStudentScores.set(studentId, score);
            }
        });
        
        console.log(`Found ${uniqueStudentScores.size} unique students with scores`);
        
        // Convert to array and sort in descending order
        const sortedScores = Array.from(uniqueStudentScores.values()).sort((a, b) => b - a);
        console.log('Sorted scores:', sortedScores);
        
        // Get total number of unique participants
        const totalParticipants = sortedScores.length;
        
        // Calculate current user's score as percentage
        totalPoints = totalPoints || 1;
        const userScorePercentage = (userScore / totalPoints) * 100;
        console.log(`Current user score: ${userScorePercentage}%`);
        
        // Check if the current user's score exists in the sorted scores
        // If not, add it (could happen if current score is better than previously saved)
        if (!sortedScores.includes(userScorePercentage)) {
            console.log('Adding current score to sorted scores');
            sortedScores.push(userScorePercentage);
            sortedScores.sort((a, b) => b - a);
        }
        
        // Find user's position
        let userRank = sortedScores.findIndex(score => Math.abs(score - userScorePercentage) < 0.1) + 1;
        console.log(`Initial userRank calculation: ${userRank}`);
        
        // If not found, place at the end
        if (userRank === 0) {
            userRank = totalParticipants;
            console.log(`Adjusted userRank to: ${userRank}`);
        }
        
        // Calculate percentile rank (lower is better - means you're in the top X%)
        const percentileRank = (userRank / totalParticipants) * 100;
        console.log(`User percentile rank: ${percentileRank}%`);
        
        // Determine tier based on percentile
        let tier, tierIcon, tierColor, tierAnimation, particleEffect;
        
        if (percentileRank <= 5) {
            tier = 'Thách Đấu';
            tierIcon = 'crown';
            tierColor = '#FF4EFF'; // Challenger color (pink/purple)
            tierAnimation = 'challenger-shine';
            particleEffect = 'challenger';
        } else if (percentileRank <= 10) {
            tier = 'Cao Thủ';
            tierIcon = 'chess-king';
            tierColor = '#FF5555'; // Master color (red)
            tierAnimation = 'shimmer';
            particleEffect = 'master';
        } else if (percentileRank <= 20) {
            tier = 'Tinh Anh';
            tierIcon = 'gem';
            tierColor = '#8C00FF'; // Elite color (purple)
            tierAnimation = 'shimmer';
            particleEffect = 'elite';
        } else if (percentileRank <= 40) {
            tier = 'Kim Cương';
            tierIcon = 'diamond';
            tierColor = '#00AAFF'; // Diamond color (light blue)
            tierAnimation = 'shimmer';
            particleEffect = 'diamond';
        } else if (percentileRank <= 60) {
            tier = 'Bạch Kim';
            tierIcon = 'medal';
            tierColor = '#00FFAA'; // Platinum color (teal)
            tierAnimation = 'pulse';
        } else if (percentileRank <= 80) {
            tier = 'Vàng';
            tierIcon = 'trophy';
            tierColor = '#FFD700'; // Gold color
            tierAnimation = 'pulse';
        } else {
            tier = 'Bạc';
            tierIcon = 'award';
            tierColor = '#C0C0C0'; // Silver color
            tierAnimation = 'pulse';
        }
        
        // Update the UI
        const rankElement = document.getElementById('user-rank');
        rankElement.innerHTML = `
            <div class="rank-container">
                <div class="numeric-rank">${userRank}/${totalParticipants}</div>
                <div class="tier-rank" style="color: ${tierColor}">
                    <i class="fas fa-${tierIcon} tier-icon"></i>
                    <span class="tier-name">${tier}</span>
                </div>
            </div>
            ${particleEffect ? `<div class="particles-container ${particleEffect}-particles"></div>` : ''}
        `;
        
        // Add the tier class for styling
        rankElement.setAttribute('data-tier', tier.toLowerCase().replace(' ', '-'));
        
        // Trigger animation
        setTimeout(() => {
            rankElement.classList.add('rank-revealed');
            
            // Play sound effect for top tiers
            if (particleEffect) {
                playRankRevealSound(tier);
                createParticleEffect(rankElement, tierColor, particleEffect);
                
                // Add confetti for top tiers
                if (percentileRank <= 10) {
                    createConfetti(tierColor);
                }
            }
        }, 500);
        
    } catch (error) {
        console.error('Error fetching user ranking:', error);
        
        // If API fails, simulate a local ranking experience
        console.log('Simulating local ranking...');
        simulateLocalRanking(userScore, totalPoints);
    }
}

// Simulate a local ranking when API fails
function simulateLocalRanking(userScore, totalPoints) {
    // Calculate percentage score
    const scorePercentage = (userScore / totalPoints) * 100;
    
    // Determine rank based on score
    let tier, tierIcon, tierColor, particleEffect;
    let rank = "1";
    
    if (scorePercentage >= 95) {
        tier = 'Thách Đấu';
        tierIcon = 'crown';
        tierColor = '#FF4EFF';
        particleEffect = 'challenger';
        rank = "1";
    } else if (scorePercentage >= 90) {
        tier = 'Cao Thủ';
        tierIcon = 'chess-king';
        tierColor = '#FF5555';
        particleEffect = 'master';
        rank = "2";
    } else if (scorePercentage >= 80) {
        tier = 'Tinh Anh';
        tierIcon = 'gem';
        tierColor = '#8C00FF';
        particleEffect = 'elite';
        rank = "3";
    } else if (scorePercentage >= 70) {
        tier = 'Kim Cương';
        tierIcon = 'diamond';
        tierColor = '#00AAFF';
        particleEffect = 'diamond';
        rank = "4";
    } else if (scorePercentage >= 60) {
        tier = 'Bạch Kim';
        tierIcon = 'medal';
        tierColor = '#00FFAA';
        rank = "5";
    } else if (scorePercentage >= 50) {
        tier = 'Vàng';
        tierIcon = 'trophy';
        tierColor = '#FFD700';
        rank = "6";
    } else {
        tier = 'Bạc';
        tierIcon = 'award';
        tierColor = '#C0C0C0';
        rank = "7";
    }
    
    // Generate a small random number of participants (7-15)
    const totalParticipants = Math.floor(Math.random() * 8) + 7;
    
    // Update the UI
    const rankElement = document.getElementById('user-rank');
    rankElement.innerHTML = `
        <div class="rank-container">
            <div class="numeric-rank">${rank}/${totalParticipants}</div>
            <div class="tier-rank" style="color: ${tierColor}">
                <i class="fas fa-${tierIcon} tier-icon"></i>
                <span class="tier-name">${tier}</span>
            </div>
        </div>
        ${particleEffect ? `<div class="particles-container ${particleEffect}-particles"></div>` : ''}
    `;
    
    // Add the tier class for styling
    rankElement.setAttribute('data-tier', tier.toLowerCase().replace(' ', '-'));
    
    // Trigger animation
    setTimeout(() => {
        rankElement.classList.add('rank-revealed');
        
        // Play sound effect for top tiers
        if (particleEffect) {
            playRankRevealSound(tier);
            createParticleEffect(rankElement, tierColor, particleEffect);
            
            // Add confetti for top tiers
            if (tier === 'Thách Đấu' || tier === 'Cao Thủ') {
                createConfetti(tierColor);
            }
        }
    }, 500);
}

// Get the current student ID from session or generate a temporary one
function getCurrentStudentId() {
    // Try to get from session storage
    let studentId = sessionStorage.getItem('studentId');
    
    // If not found, try to get from result object
    if (!studentId && currentResult && currentResult.student_id) {
        studentId = currentResult.student_id;
    }
    
    // Still not found, create a temporary ID
    if (!studentId) {
        studentId = 'temp_' + Math.random().toString(36).substring(2, 15);
    }
    
    // Store it
    sessionStorage.setItem('studentId', studentId);
    
    return studentId;
}

// Generate a fallback ID when student_id is not available
function generateFallbackId(transcript) {
    // Use a combination of properties to generate a reasonably unique ID
    const props = [];
    
    if (transcript.timestamp) props.push(transcript.timestamp);
    if (transcript.score) props.push(transcript.score);
    if (transcript.ipAddress) props.push(transcript.ipAddress);
    
    if (transcript.students && transcript.students.full_name) {
        props.push(transcript.students.full_name);
    }
    
    return props.length > 0 ? 'fb_' + props.join('_') : null;
}

// Function to play sound effects for rank reveal
function playRankRevealSound(tier) {
    // Create audio element
    const audio = new Audio();
    
    // Set source based on tier
    switch(tier) {
        case 'Thách Đấu':
            audio.src = 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-fanfare-trumpets-6185.mp3';
            break;
        case 'Cao Thủ':
        case 'Tinh Anh':
            audio.src = 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_c8a410a628.mp3?filename=success-1-6297.mp3';
            break;
        case 'Kim Cương':
            audio.src = 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_942521a25a.mp3?filename=interface-124464.mp3';
            break;
        default:
            return; // Don't play sound for lower tiers
    }
    
    // Play the sound
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Sound autoplay blocked by browser policy'));
}

// Function to create particle effects
function createParticleEffect(container, color, type) {
    const particlesContainer = container.querySelector('.particles-container');
    if (!particlesContainer) return;
    
    // Number of particles based on rank
    const particleCount = type === 'challenger' ? 50 : 
                          type === 'master' ? 40 : 
                          type === 'elite' ? 30 : 20;
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Set particle style based on type
        switch(type) {
            case 'challenger':
                particle.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
                particle.style.width = `${Math.random() * 15 + 5}px`;
                particle.style.height = particle.style.width;
                break;
            case 'master':
                particle.style.background = color;
                particle.style.width = `${Math.random() * 8 + 3}px`;
                particle.style.height = particle.style.width;
                particle.style.opacity = Math.random() * 0.5 + 0.5;
                break;
            case 'elite':
            case 'diamond':
                particle.style.background = color;
                particle.style.width = `${Math.random() * 5 + 2}px`;
                particle.style.height = particle.style.width;
                break;
        }
        
        // Set random position
        const posX = Math.random() * 100 - 50; // -50 to 50
        const posY = Math.random() * 100 - 50; // -50 to 50
        
        // Set random animation duration
        const duration = Math.random() * 2 + 1; // 1-3 seconds
        
        // Apply animations with CSS
        particle.style.transform = `translate(${posX}px, ${posY}px)`;
        particle.style.animation = `
            particleFade ${duration}s ease-out forwards,
            particleMove${Math.floor(Math.random() * 4)} ${duration}s ease-out forwards
        `;
        
        // Add to container
        particlesContainer.appendChild(particle);
    }
    
    // Clean up particles after animation completes
    setTimeout(() => {
        if (particlesContainer && particlesContainer.parentNode) {
            particlesContainer.innerHTML = '';
        }
    }, 3003);
}

function displaySortedResults(sortType) {
    if (!currentResult) return;

    // Update active button state
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="sortResults('${sortType}')"]`).classList.add('active');

    // Filter questions based on sort type
    const questions = currentResult.questions || currentResult.answers || [];
    const filteredQuestions = questions.filter(question => {
        if (sortType === 'all') return true;
        if (sortType === 'correct') return question.isCorrect;
        if (sortType === 'incorrect') return !question.isCorrect;
        return true;
    });

    // Helper function to format answers with line breaks
    const formatAnswer = (answer, type) => {
        if (!answer) return 'No answer';
        
        if (typeof answer === 'object') {
            // If it's an object with text property, use that
            return answer.text || JSON.stringify(answer);
        }
        
        if (type === 'truefalse') {
            return answer.split('\n').map(line => line.trim()).join('<br>');
        }
        
        return answer;
    };

    // Generate HTML for filtered questions
    const resultHTML = filteredQuestions.map((question, index) => {
        // --- NEW: Use saved image URL ---
        let imageHtml = '';
        if (question.imageUrl) { // Check if imageUrl exists in the result data
            imageHtml = `
                <div class="question-image-container">
                    <img src="${question.imageUrl}"
                         alt="Question Image"
                         class="question-image"
                         loading="lazy"
                         onload="this.classList.add('loaded')">
                </div>
            `;
        }
        // --- END NEW ---

        const isMultiTrueFalse = question.type === 'truefalse' && Array.isArray(question.optionsText);
        const isMultipleChoice = question.type === 'abcd' && Array.isArray(question.optionsText);

        let answerSectionHTML = '';
        if (isMultiTrueFalse) {
            // --- Render individual options for multi-TF ---
            answerSectionHTML = '<div class="answer-section multi-tf">';
            question.optionsText.forEach((optionText, i) => {
                const userAns = question.userAnswer[i];
                const correctAns = question.correctAnswer[i];
                const isSubCorrect = userAns === correctAns;

                const userAnsText = userAns === true ? 'True' : (userAns === false ? 'False' : 'Chưa chọn');
                const correctAnsText = correctAns === true ? 'Đúng' : 'Sai';

                answerSectionHTML += `
                    <div class="multi-tf-item">
                        <span class="multi-tf-indicator ${isSubCorrect ? 'correct' : 'incorrect'}">
                            <i class="fas fa-${isSubCorrect ? 'check' : 'times'}"></i>
                        </span>
                        <span class="multi-tf-option">${String.fromCharCode(65 + i)}) ${optionText}</span>
                        <div class="multi-tf-answers">
                            <span>(Đã chọn: ${userAnsText}</span>
                            <span> | Đáp án: ${correctAnsText})</span>
                        </div>
                    </div>
                `;
            });
            answerSectionHTML += '</div>';
            // --- End multi-TF rendering ---
        } else if (isMultipleChoice) {
             // --- Render all options for multiple choice ---
             answerSectionHTML = '<div class="answer-section multiple-choice-options">';
             question.optionsText.forEach((optionText, i) => {
                 const isCorrectOption = optionText === question.correctAnswer;
                 const isUserSelected = optionText === question.userAnswer;
                 let optionClass = 'option-item';
                 let icon = '';

                 if (isCorrectOption) {
                     optionClass += ' correct-option';
                     icon = '<i class="fas fa-check mc-icon"></i>';
                 }
                 if (isUserSelected) {
                     optionClass += ' user-selected';
                     if (!isCorrectOption) {
                         optionClass += ' incorrect-selected';
                         icon = '<i class="fas fa-times mc-icon"></i>';
                     } else {
                        // User selected the correct option, check icon is already added
                     }
                 } else if (!isCorrectOption) {
                    // Regular incorrect option, no icon unless it's the correct one
                 }


                 answerSectionHTML += `
                    <div class="${optionClass}">
                        ${icon}
                        <span class="option-text">${String.fromCharCode(65 + i)}) ${optionText}</span>
                    </div>
                 `;
             });
             answerSectionHTML += '</div>';
             // --- End multiple choice rendering ---
        } else {
            // --- Standard rendering for other question types (e.g., fill-in-the-blank) ---
            answerSectionHTML = `
                <div class="answer-section">
                    <div class="answer-box user-answer ${question.isCorrect ? 'correct' : 'incorrect'}">
                        <div class="answer-label">
                            <i class="fas fa-user"></i>
                            Đã chọn
                        </div>
                        <div class="answer-text">${formatAnswer(question.userAnswer, question.type)}</div>
                    </div>

                    <div class="answer-box correct-answer">
                        <div class="answer-label">
                            <i class="fas fa-check-circle"></i>
                            Đáp án
                        </div>
                        <div class="answer-text">${formatAnswer(question.correctAnswer, question.type)}</div>
                    </div>
                </div>
            `;
             // --- End standard rendering ---
        }

        // Determine the overall result indicator icon
        let resultIndicatorIcon = '';
        if (!isMultipleChoice) { // Keep existing logic for non-MCQ
             resultIndicatorIcon = isMultiTrueFalse ? '' : `<i class="fas fa-${question.isCorrect ? 'check' : 'times'}"></i>`;
             resultIndicatorIcon += isMultiTrueFalse && question.isCorrect ? '<i class="fas fa-check"></i>' : '';
             resultIndicatorIcon += isMultiTrueFalse && !question.isCorrect ? '<i class="fas fa-times"></i>' : '';
        } else { // For MCQ, show check if correct, times if incorrect
            resultIndicatorIcon = `<i class="fas fa-${question.isCorrect ? 'check' : 'times'}"></i>`;
        }


        return `
            <div class="question-card ${question.isCorrect ? 'correct' : 'incorrect'}">
                <div class="question-header">
                    <div class="question-info">
                        <span class="question-number">Câu ${index + 1}</span>
                        <span class="result-indicator">
                            ${resultIndicatorIcon}
                        </span>
                    </div>
                </div>

                <div class="question-content">
                    <div class="question-top">
                        <p class="question-text">${question.question}</p>
                        ${imageHtml}
                        <button class="explain-btn"
                            data-question="${encodeURIComponent(question.question)}"
                            data-user-answer="${encodeURIComponent(isMultiTrueFalse || isMultipleChoice ? JSON.stringify(question.userAnswer) : formatAnswer(question.userAnswer, question.type))}"
                            data-correct-answer="${encodeURIComponent(isMultiTrueFalse || isMultipleChoice ? JSON.stringify(question.correctAnswer) : formatAnswer(question.correctAnswer, question.type))}"
                            ${(isMultiTrueFalse || isMultipleChoice) ? 'data-options-text="' + encodeURIComponent(JSON.stringify(question.optionsText)) + '"' : ''} >
                            <i class="fas fa-lightbulb"></i>
                            <span>Xem giải thích (AI)</span>
                        </button>
                    </div>

                    ${answerSectionHTML}
                </div>

                <div class="explanation-box" style="display: none;">
                    <div class="explanation-content"></div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('result').innerHTML = resultHTML;
    attachExplanationListeners();
    initializeImageZoom(); // Initialize image zoom functionality
    
    // Render LaTeX in the results
    if (typeof renderMathInElement === 'function') {
        renderMathInElement(document.getElementById('result'), {
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

// Initialize image zoom functionality
function initializeImageZoom() {
    const questionImages = document.querySelectorAll('.question-image');
    const imageModal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const closeButton = document.getElementById('close-modal');
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const resetZoomButton = document.getElementById('reset-zoom');
    
    // Zooming variables
    let scale = 1;
    let panning = false;
    let pointX = 0;
    let pointY = 0;
    let startX = 0;
    let startY = 0;
    
    // Open modal when any question image is clicked
    questionImages.forEach(function(image) {
        image.addEventListener('click', function() {
            openModal(this);
        });
    });
    
    function openModal(imageElement) {
        modalImage.src = imageElement.src;
        modalImage.alt = imageElement.alt;
        imageModal.classList.add('open');
        document.body.style.overflow = 'hidden';
        resetZoom();
    }
    
    // Close modal when close button is clicked
    closeButton.addEventListener('click', closeModal);
    
    // Close modal when clicking outside the image
    imageModal.addEventListener('click', function(e) {
        if (e.target === imageModal) {
            closeModal();
        }
    });
    
    // Close modal when ESC key is pressed
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && imageModal.classList.contains('open')) {
            closeModal();
        }
    });
    
    function closeModal() {
        imageModal.classList.remove('open');
        document.body.style.overflow = '';
        resetZoom();
    }
    
    // Zoom controls
    zoomInButton.addEventListener('click', function() {
        setZoom(scale + 0.5);
    });
    
    zoomOutButton.addEventListener('click', function() {
        setZoom(Math.max(1, scale - 0.5));
    });
    
    resetZoomButton.addEventListener('click', resetZoom);
    
    function resetZoom() {
        scale = 1;
        pointX = 0;
        pointY = 0;
        modalImage.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    }
    
    function setZoom(newScale) {
        scale = newScale;
        modalImage.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    }
    
    // Mouse wheel zoom
    modalImage.addEventListener('wheel', function(e) {
        e.preventDefault();
        const xs = (e.clientX - pointX) / scale;
        const ys = (e.clientY - pointY) / scale;
        
        if (e.deltaY < 0) {
            scale *= 1.1;
        } else {
            scale /= 1.1;
        }
        
        scale = Math.max(1, scale);
        
        pointX = e.clientX - xs * scale;
        pointY = e.clientY - ys * scale;
        
        modalImage.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    });
    
    // Drag to pan
    modalImage.addEventListener('mousedown', function(e) {
        e.preventDefault();
        
        if (scale > 1) {
            panning = true;
            startX = e.clientX - pointX;
            startY = e.clientY - pointY;
        }
    });
    
    imageModal.addEventListener('mousemove', function(e) {
        e.preventDefault();
        
        if (panning && scale > 1) {
            pointX = e.clientX - startX;
            pointY = e.clientY - startY;
            modalImage.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
        }
    });
    
    imageModal.addEventListener('mouseup', function(e) {
        panning = false;
    });
    
    imageModal.addEventListener('mouseleave', function(e) {
        panning = false;
    });
    
    // Mobile touch events
    let evCache = [];
    let prevDiff = -1;
    
    modalImage.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
        
        for (let i = 0; i < e.changedTouches.length; i++) {
            evCache.push(e.changedTouches[i]);
        }
        
        if (e.touches.length === 1) {
            panning = true;
            startX = e.touches[0].clientX - pointX;
            startY = e.touches[0].clientY - pointY;
        }
    });
    
    modalImage.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
            
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            
            if (prevDiff > 0) {
                if (dist > prevDiff) {
                    scale *= 1.03;
                } else if (dist < prevDiff) {
                    scale /= 1.03;
                }
                
                scale = Math.max(1, scale);
                
                modalImage.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
            }
            
            prevDiff = dist;
        } else if (e.touches.length === 1 && panning && scale > 1) {
            pointX = e.touches[0].clientX - startX;
            pointY = e.clientY - startY;
            modalImage.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
        }
    });
    
    modalImage.addEventListener('touchend', function(e) {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const idx = evCache.findIndex(cachedTouch => 
                cachedTouch.identifier === e.changedTouches[i].identifier
            );
            if (idx >= 0) {
                evCache.splice(idx, 1);
            }
        }
        
        if (evCache.length < 2) {
            prevDiff = -1;
        }
        
        if (e.touches.length === 0) {
            panning = false;
        }
    });
    
    // Prevent default touchmove behavior
    modalImage.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1 || (scale > 1 && e.touches.length === 1)) {
            e.preventDefault();
        }
    }, { passive: false });
}

function sortResults(sortType) {
    displaySortedResults(sortType);
}

async function getExplanation(button, question, userAnswer, correctAnswer) {
    const questionCard = button.closest('.question-card');
    const explanationBox = questionCard.querySelector('.explanation-box');
    const explanationContent = explanationBox.querySelector('.explanation-content');
    
    // --- Get optional options text ---
    const optionsText = button.dataset.optionsText ? decodeURIComponent(button.dataset.optionsText) : null;
    // ---

    if (explanationContent.dataset.loaded === 'true') {
        explanationBox.style.display = explanationBox.style.display === 'none' ? 'block' : 'none';
        button.innerHTML = explanationBox.style.display === 'none' ? 
            '<i class="fas fa-lightbulb"></i><span>Hiện giải thích</span>' : 
            '<i class="fas fa-times"></i><span>Ẩn giải thích</span>';
        return;
    }
    
    explanationBox.style.display = 'block';
    button.innerHTML = '<div class="loading-spinner"></div><span>Đang suy nghĩ...</span>';
    button.disabled = true;
    
    try {
        // Decode the URL-encoded parameters
        const decodedQuestion = decodeURIComponent(button.dataset.question);
        const decodedUserAnswer = decodeURIComponent(button.dataset.userAnswer);
        const decodedCorrectAnswer = decodeURIComponent(button.dataset.correctAnswer);
        
        // --- Prepare user/correct answer text for prompt ---
        let userAnswerText = decodedUserAnswer;
        let correctAnswerText = decodedCorrectAnswer;
        if (optionsText) { // If multi-TF, format the array answers
            try {
                const userAnswers = JSON.parse(decodedUserAnswer);
                const correctAnswers = JSON.parse(decodedCorrectAnswer);
                const parsedOptions = JSON.parse(optionsText);
                userAnswerText = parsedOptions.map((opt, i) => 
                    `${String.fromCharCode(65 + i)}: ${userAnswers[i] === true ? 'True' : (userAnswers[i] === false ? 'False' : 'N/A')}`
                ).join('\n');
                correctAnswerText = parsedOptions.map((opt, i) => 
                    `${String.fromCharCode(65 + i)}: ${correctAnswers[i] ? 'True' : 'False'}`
                ).join('\n');
            } catch (e) {
                console.error('Error parsing multi-TF answers for prompt:', e);
                // Fallback to raw strings if parsing fails
            }
        }
        // ---
        
        // Direct API call to Google Gemini API
        const API_KEY = "AIzaSyAxJF-5iBBx7gp9RPwrAfF58ERZi69KzCc"; // This is the same key from server-side
        const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
        
        const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Hãy giải thích câu hỏi này từng bước bằng tiếng Việt. Hãy luôn trả lời bằng các thông tin chính xác và nếu cần thiết hãy đưa ra ghi chú:
Câu hỏi: ${decodedQuestion}
${optionsText ? 'Lựa chọn:\n' + JSON.parse(optionsText).map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n') + '\n' : ''}Đáp án của bạn: ${userAnswerText}
Đáp án đúng: ${correctAnswerText}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 64,
                    topP: 0.95,
                    maxOutputTokens: 8192
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorData
            });
            throw new Error(`API responded with status: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.error('Invalid Gemini API response format:', data);
            throw new Error('Invalid response format from Gemini API');
        }
        
        const explanationText = data.candidates[0].content.parts[0].text;
        const htmlContent = marked.parse(explanationText);
        
        explanationContent.innerHTML = htmlContent;
        explanationContent.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });
        explanationContent.dataset.loaded = 'true';
        button.innerHTML = '<i class="fas fa-times"></i><span>Ẩn giải thích</span>';
        
        // Render LaTeX in the explanation
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(explanationContent, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false},
                    {left: "\\(", right: "\\)", display: false},
                    {left: "\\[", right: "\\]", display: true}
                ],
                throwOnError: false
            });
        }
    } catch (error) {
        console.error('Error getting explanation:', error);
        explanationContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                Failed to load explanation: ${error.message}
                <button onclick="retryExplanation(this)" class="retry-btn">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    } finally {
        button.disabled = false;
    }
}

function retryExplanation(retryButton) {
    const explanationBox = retryButton.closest('.explanation-box');
    const questionCard = explanationBox.closest('.question-card');
    const explainButton = questionCard.querySelector('.explain-btn');
    
    explanationBox.querySelector('.explanation-content').dataset.loaded = 'false';
    explainButton.click();
}

function attachExplanationListeners() {
    document.querySelectorAll('.explain-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            await getExplanation(button, button.dataset.question, button.dataset.userAnswer, button.dataset.correctAnswer);
        });
    });
}

// Function to create confetti effect
function createConfetti(mainColor) {
    const confettiCount = 100;
    const container = document.querySelector('.results-container');
    
    // Create confetti container if it doesn't exist
    let confettiContainer = document.querySelector('.confetti-container');
    if (!confettiContainer) {
        confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.style.position = 'absolute';
        confettiContainer.style.top = '0';
        confettiContainer.style.left = '0';
        confettiContainer.style.width = '100%';
        confettiContainer.style.height = '100%';
        confettiContainer.style.pointerEvents = 'none';
        confettiContainer.style.overflow = 'hidden';
        confettiContainer.style.zIndex = '1000';
        container.appendChild(confettiContainer);
    }
    
    // Define confetti colors (including the main tier color)
    const colors = [
        mainColor,
        '#ffffff',
        '#f0f0f0',
        '#ffcc00',
        '#ff3366'
    ];
    
    // Create confetti pieces
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        
        // Random properties
        const size = Math.random() * 10 + 5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const isRect = Math.random() > 0.5;
        const initialX = Math.random() * 100; // as percentage
        const initialDelay = Math.random() * 3;
        const duration = Math.random() * 3 + 2;
        const rotation = Math.random() * 360;
        
        // Style the confetti
        confetti.style.position = 'absolute';
        confetti.style.top = '-20px';
        confetti.style.left = `${initialX}%`;
        confetti.style.width = `${size}px`;
        confetti.style.height = isRect ? `${size * 0.6}px` : `${size}px`;
        confetti.style.backgroundColor = color;
        confetti.style.borderRadius = isRect ? '2px' : '50%';
        confetti.style.opacity = Math.random() * 0.8 + 0.2;
        confetti.style.transform = `rotate(${rotation}deg)`;
        confetti.style.transformOrigin = 'center center';
        
        // Apply fall animation
        confetti.style.animation = `
            confettiFall ${duration}s ${initialDelay}s ease-in forwards,
            confettiRotate ${duration / 2}s ${initialDelay}s linear infinite
        `;
        
        // Add to container
        confettiContainer.appendChild(confetti);
    }
    
    // Clean up confetti after animation completes
    setTimeout(() => {
        if (confettiContainer && confettiContainer.parentNode) {
            confettiContainer.parentNode.removeChild(confettiContainer);
        }
    }, 8000);
}

// Get previously stored results for a lesson
function getPreviousResults(lessonId) {
    try {
        // Get stored results array
        const storedResultsStr = localStorage.getItem(`lesson_${lessonId}_results`);
        if (storedResultsStr) {
            return JSON.parse(storedResultsStr) || [];
        }
    } catch (error) {
        console.error('Error retrieving stored results:', error);
    }
    return [];
}

// Store a user's attempt locally
function storeAttemptLocally(lessonId, resultData) {
    try {
        // Get existing results
        const existingResults = getPreviousResults(lessonId);
        
        // Check if this student already has a result
        const studentId = resultData.student_id;
        const existingIndex = existingResults.findIndex(r => r.student_id === studentId);
        
        if (existingIndex >= 0) {
            // Update existing result if the new score is better
            const existingScore = parseFloat(existingResults[existingIndex].score?.replace('%', '') || 0);
            const newScore = parseFloat(resultData.score?.replace('%', '') || 0);
            
            if (newScore > existingScore) {
                existingResults[existingIndex] = resultData;
            }
        } else {
            // Add new result
            existingResults.push(resultData);
        }
        
        // Store back to localStorage (keep only the last 50 results)
        const limitedResults = existingResults.slice(-50);
        localStorage.setItem(`lesson_${lessonId}_results`, JSON.stringify(limitedResults));
        
    } catch (error) {
        console.error('Error storing attempt locally:', error);
    }
}

function showResultModal(quizResults) {
    const modal = document.createElement('div');
    modal.className = 'result-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Quiz Results</h2>
            
            <div class="score-section">
                <div class="score-display">
                    <span class="score">${quizResults.score}/${quizResults.totalPoints}</span>
                    <span class="percentage">${Math.round((quizResults.score / quizResults.totalPoints) * 100)}%</span>
                </div>
                
                ${quizResults.ratingChange !== undefined ? `
                    <div class="rating-change">
                        <h3>Rating Update</h3>
                        <div class="rating-info">
                            <span class="new-rating">New Rating: ${Math.round(quizResults.newRating)}</span>
                            <span class="change ${quizResults.ratingChange > 0 ? 'positive' : 'negative'}">
                                ${quizResults.ratingChange > 0 ? '+' : ''}${quizResults.ratingChange}
                            </span>
                        </div>
                    </div>
                ` : ''}
            </div>

            <div class="performance-metrics">
                <div class="metric">
                    <span class="label">Time Taken</span>
                    <span class="value">${Math.round(quizResults.timeTaken)}s</span>
                </div>
                <div class="metric">
                    <span class="label">Current Streak</span>
                    <span class="value">${quizResults.streak}</span>
                </div>
                <div class="metric">
                    <span class="label">Questions</span>
                    <span class="value">${(quizResults.questions || quizResults.answers || []).length}</span>
                </div>
            </div>

            <div class="question-breakdown">
                <h3>Question Breakdown</h3>
                ${(quizResults.questions || quizResults.answers || []).map((q, index) => `
                    <div class="question-result ${q.isCorrect ? 'correct' : 'incorrect'}">
                        <div class="question-header">
                            <span class="question-number">Q${index + 1}</span>
                            <span class="points">${q.earnedPoints}/${q.points} pts</span>
                        </div>
                        <div class="question-text">${q.question}</div>
                        <div class="answer-details">
                            <div class="your-answer">
                                <strong>Your Answer:</strong> ${formatAnswer(q.userAnswer)}
                            </div>
                            ${!q.isCorrect ? `
                                <div class="correct-answer">
                                    <strong>Correct Answer:</strong> ${formatAnswer(q.correctAnswer)}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="modal-actions">
                <button class="close-btn">Close</button>
                <a href="/leaderboard" class="leaderboard-btn">View Leaderboard</a>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .result-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 800px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }

        .score-section {
            text-align: center;
            margin: 20px 0;
        }

        .score-display {
            font-size: 2em;
            margin-bottom: 20px;
        }

        .score {
            font-weight: bold;
            color: #007bff;
        }

        .percentage {
            margin-left: 10px;
            color: #666;
        }

        .rating-change {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }

        .rating-info {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin-top: 10px;
        }

        .new-rating {
            font-size: 1.2em;
            font-weight: bold;
        }

        .change {
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
        }

        .change.positive {
            background: #d4edda;
            color: #155724;
        }

        .change.negative {
            background: #f8d7da;
            color: #721c24;
        }

        .performance-metrics {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }

        .metric {
            text-align: center;
        }

        .metric .label {
            display: block;
            color: #666;
            font-size: 0.9em;
        }

        .metric .value {
            display: block;
            font-size: 1.2em;
            font-weight: bold;
            margin-top: 5px;
        }

        .question-breakdown {
            margin: 20px 0;
        }

        .question-result {
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            background: #f8f9fa;
        }

        .question-result.correct {
            border-left: 4px solid #4CAF50;
        }

        .question-result.incorrect {
            border-left: 4px solid #f44336;
        }

        .question-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        .question-number {
            font-weight: bold;
        }

        .points {
            color: #666;
        }

        .answer-details {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #eee;
        }

        .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
        }

        .close-btn, .leaderboard-btn {
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
        }

        .close-btn {
            background: #f8f9fa;
            border: 1px solid #ddd;
        }

        .leaderboard-btn {
            background: #007bff;
            color: white;
            text-decoration: none;
            border: none;
        }
    `;
    document.head.appendChild(style);

    // Add event listeners
    modal.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(modal);
        document.head.removeChild(style);
    });
}

function formatAnswer(answer) {
    if (Array.isArray(answer)) {
        return answer.map(a => a === true ? 'True' : a === false ? 'False' : 'Not answered').join(', ');
    }
    return answer;
}

document.addEventListener('DOMContentLoaded', () => {
    showLoader(true); // Show loader immediately
    displayResults(); // This will handle hiding the loader
});