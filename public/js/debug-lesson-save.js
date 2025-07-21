// Debug helper to log the exact data being sent to the API
window.debugLessonSave = function() {
    console.log('=== DEBUG: Lesson Save Data ===');
    
    // Get the data that would be sent
    const stage1DataString = sessionStorage.getItem('lessonStage1Data');
    if (stage1DataString) {
        const stage1Data = JSON.parse(stage1DataString);
        console.log('Stage 1 Questions:', stage1Data.questions);
    }
    
    // Log current config data if available
    if (window.currentConfigData) {
        console.log('Current Config Data:', window.currentConfigData);
    }
    
    // Log current questions if available
    if (window.currentQuestions) {
        console.log('Current Questions:', window.currentQuestions);
        
        // Show what transformQuestionsForAPI would produce
        if (window.transformQuestionsForAPI) {
            const transformed = window.transformQuestionsForAPI(window.currentQuestions);
            console.log('Transformed Questions:', transformed);
        }
    }
    
    // Create a test payload to see what would be sent
    const testPayload = {
        title: document.getElementById('lesson-title')?.value || 'Test Title',
        questions: window.currentQuestions || [],
        color: document.getElementById('lesson-color')?.value || '#a4aeff',
        description: document.getElementById('lesson-description')?.value || '',
        grade: document.getElementById('lesson-grade')?.value || '',
        subject: document.getElementById('lesson-subject')?.value || '',
        mode: 'test'
    };
    
    console.log('Test Payload:', JSON.stringify(testPayload, null, 2));
    console.log('=== END DEBUG ===');
};

// Auto-run on page load
setTimeout(() => {
    if (window.location.pathname.includes('configure')) {
        console.log('Debug script loaded. Run debugLessonSave() to see current data.');
    }
}, 1000);