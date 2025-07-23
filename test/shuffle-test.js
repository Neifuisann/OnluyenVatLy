const fetch = require('node-fetch');

async function testShuffleFeature() {
    const baseUrl = 'http://localhost:3000';
    
    // Test lesson ID with shuffle enabled
    const lessonId = '1748074653639'; // This lesson has shuffle_questions and shuffle_answers enabled
    
    console.log('=== Testing Shuffle Feature ===');
    console.log(`Testing lesson: ${lessonId}`);
    
    try {
        // Make multiple requests to see if questions are shuffled differently
        const requests = 3;
        const responses = [];
        
        for (let i = 0; i < requests; i++) {
            console.log(`\nRequest ${i + 1}:`);
            
            const response = await fetch(`${baseUrl}/api/lessons/${lessonId}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.lesson) {
                const lesson = data.lesson;
                console.log(`- Title: ${lesson.title}`);
                console.log(`- Shuffle Questions: ${lesson.shuffleQuestions}`);
                console.log(`- Shuffle Answers: ${lesson.shuffleAnswers}`);
                console.log(`- Enable Question Pool: ${lesson.enableQuestionPool}`);
                console.log(`- Question Pool Size: ${lesson.questionPoolSize}`);
                console.log(`- Total Questions: ${lesson.questions ? lesson.questions.length : 0}`);
                
                if (lesson.questions && lesson.questions.length > 0) {
                    console.log(`- First 3 questions:`);
                    lesson.questions.slice(0, 3).forEach((q, idx) => {
                        console.log(`  ${idx + 1}. ${q.question ? q.question.substring(0, 50) + '...' : 'No question text'}`);
                    });
                }
                
                responses.push(lesson);
            } else {
                console.log('Error: No lesson data in response');
            }
        }
        
        // Compare responses to see if questions are in different order
        if (responses.length >= 2) {
            console.log('\n=== Comparing Responses ===');
            
            for (let i = 1; i < responses.length; i++) {
                const firstQuestions = responses[0].questions || [];
                const currentQuestions = responses[i].questions || [];
                
                if (firstQuestions.length === 0 || currentQuestions.length === 0) {
                    console.log(`Response ${i + 1}: Cannot compare - no questions`);
                    continue;
                }
                
                // Check if the order is different
                let isDifferent = false;
                for (let j = 0; j < Math.min(firstQuestions.length, currentQuestions.length); j++) {
                    if (firstQuestions[j].question !== currentQuestions[j].question) {
                        isDifferent = true;
                        break;
                    }
                }
                
                console.log(`Response ${i + 1} vs Response 1: Questions are ${isDifferent ? 'DIFFERENT' : 'SAME'} order`);
            }
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Check if server is running
fetch('http://localhost:3000/api/health')
    .then(() => {
        console.log('Server is running, starting tests...\n');
        testShuffleFeature();
    })
    .catch(() => {
        console.error('Server is not running. Please start the server with: npm start');
    });