const fetch = require('node-fetch');

async function testLessonApiFixes() {
    const baseUrl = 'http://localhost:3003';
    
    // Store cookies to maintain session
    let cookies = '';
    
    // Test 1: Test image generation without ID
    console.log('\n=== Test 1: Image Generation API (without ID) ===');
    try {
        // First get CSRF token
        const csrfResponse = await fetch(`${baseUrl}/api/csrf-token`, {
            headers: cookies ? { 'Cookie': cookies } : {}
        });
        
        // Extract cookies from response
        const setCookies = csrfResponse.headers.raw()['set-cookie'];
        if (setCookies) {
            cookies = setCookies.map(cookie => cookie.split(';')[0]).join('; ');
        }
        
        const csrfData = await csrfResponse.json();
        
        const imageGenResponse = await fetch(`${baseUrl}/api/lessons/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies
            },
            body: JSON.stringify({
                lessonData: {
                    title: 'Test Physics Lesson',
                    questions: [
                        { question: 'What is velocity?', type: 'abcd' }
                    ],
                    grade: '10',
                    subject: 'Vật lý',
                    tags: ['kinematics']
                },
                csrfToken: csrfData.csrfToken
            })
        });
        
        console.log('Status:', imageGenResponse.status);
        const imageResult = await imageGenResponse.json();
        console.log('Response:', JSON.stringify(imageResult, null, 2));
    } catch (error) {
        console.error('Image generation test failed:', error.message);
    }
    
    // Test 2: Test lesson creation with new question format
    console.log('\n=== Test 2: Lesson Creation API (new question format) ===');
    try {
        // Get fresh CSRF token (reuse session)
        const csrfResponse = await fetch(`${baseUrl}/api/csrf-token`, {
            headers: { 'Cookie': cookies }
        });
        const csrfData = await csrfResponse.json();
        
        const lessonData = {
            title: 'Test Lesson with New Format',
            description: 'Testing new question format',
            questions: [
                {
                    question: 'What is Newton\'s first law?',
                    type: 'abcd',
                    options: [
                        { text: 'Law of inertia' },
                        { text: 'F = ma' },
                        { text: 'Action-reaction' },
                        { text: 'Universal gravitation' }
                    ],
                    correct: 'A',
                    points: 1,
                    id: 'q_test1'
                },
                {
                    question: 'Is velocity a vector?',
                    type: 'truefalse',
                    options: [],
                    correct: ['true'],
                    points: 1,
                    id: 'q_test2'
                },
                {
                    question: 'What is the speed of light in m/s?',
                    type: 'number',
                    options: [],
                    correct: '299792458',
                    points: 2,
                    id: 'q_test3'
                }
            ],
            color: '#a4aeff',
            grade: '10',
            subject: 'Physics',
            mode: 'test',
            csrfToken: csrfData.csrfToken
        };
        
        const createResponse = await fetch(`${baseUrl}/api/lessons`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies
            },
            body: JSON.stringify(lessonData)
        });
        
        console.log('Status:', createResponse.status);
        const createResult = await createResponse.json();
        console.log('Response:', JSON.stringify(createResult, null, 2));
        
        // If successful, delete the test lesson
        if (createResponse.status === 201 && createResult.lesson && createResult.lesson.id) {
            console.log('\nCleaning up test lesson...');
            const deleteResponse = await fetch(`${baseUrl}/api/lessons/${createResult.lesson.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookies
                },
                body: JSON.stringify({ csrfToken: csrfData.csrfToken })
            });
            console.log('Cleanup status:', deleteResponse.status);
        }
    } catch (error) {
        console.error('Lesson creation test failed:', error.message);
    }
}

// Run tests
console.log('Testing Lesson API Fixes...');
testLessonApiFixes().then(() => {
    console.log('\nTests completed!');
    process.exit(0);
}).catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});