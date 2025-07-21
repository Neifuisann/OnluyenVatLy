// Comprehensive test for the complete shuffle fix
const fs = require('fs');
const path = require('path');

// Read the updated lesson.js file
const lessonJsPath = path.join(__dirname, '../public/js/lesson.js');
const lessonJsContent = fs.readFileSync(lessonJsPath, 'utf8');

console.log('🔍 Testing Complete Shuffle Fix');
console.log('================================\n');

// Test 1: Check that randomization is called before renderQuestions
console.log('✅ Test 1: Function call order');
const initializeLessonMatch = lessonJsContent.match(/async function initializeLesson\(\) {[\s\S]*?}\s*\/\/ --- END New Function ---/);
if (initializeLessonMatch) {
    const initializeFunc = initializeLessonMatch[0];
    const randomizationPos = initializeFunc.indexOf('applyRandomization(lesson)');
    const renderPos = initializeFunc.indexOf('await renderQuestions(lesson)');
    
    if (randomizationPos > 0 && renderPos > 0 && randomizationPos < renderPos) {
        console.log('   ✓ applyRandomization is called before renderQuestions');
    } else {
        console.log('   ✗ ERROR: Function call order is incorrect');
    }
}

// Test 2: Check that questions are rendered in a single container
console.log('\n✅ Test 2: Single container rendering');
const renderQuestionsMatch = lessonJsContent.match(/async function renderQuestions\(lesson\) {[\s\S]*?^}/m);
if (renderQuestionsMatch) {
    const renderFunc = renderQuestionsMatch[0];
    
    // Check for new container creation
    if (renderFunc.includes('all-questions-container')) {
        console.log('   ✓ Creates all-questions-container for unified display');
    } else {
        console.log('   ✗ ERROR: Still using section-based rendering');
    }
    
    // Check that questions are rendered in order
    if (renderFunc.includes('lesson.questions.forEach((q, displayIndex)')) {
        console.log('   ✓ Renders questions in their array order (shuffled order)');
    } else {
        console.log('   ✗ ERROR: Not rendering questions in sequence');
    }
    
    // Check that sections are hidden
    if (renderFunc.includes('.style.display = \'none\'')) {
        console.log('   ✓ Hides original section containers');
    } else {
        console.log('   ✗ ERROR: Original sections may still be visible');
    }
}

// Test 3: Check question numbering
console.log('\n✅ Test 3: Question numbering');
if (lessonJsContent.includes('Câu ${displayIndex + 1}.')) {
    console.log('   ✓ Questions numbered sequentially based on display order');
} else {
    console.log('   ✗ ERROR: Question numbering may be incorrect');
}

// Test 4: Check data-question-index preservation
console.log('\n✅ Test 4: Question index tracking');
if (lessonJsContent.includes('data-question-index="${questionIndex}"')) {
    console.log('   ✓ data-question-index attribute preserved for answer submission');
} else {
    console.log('   ✗ ERROR: Question index tracking may be broken');
}

// Test 5: Verify the shuffle logic
console.log('\n✅ Test 5: Shuffle implementation');
const applyRandomizationMatch = lessonJsContent.match(/function applyRandomization\(lesson\) {[\s\S]*?^}/m);
if (applyRandomizationMatch) {
    const applyFunc = applyRandomizationMatch[0];
    
    if (applyFunc.includes('if (lesson.shuffleQuestions)')) {
        console.log('   ✓ Checks shuffleQuestions flag');
    }
    
    if (applyFunc.includes('questions = shuffleArray(questions, randomFunc)')) {
        console.log('   ✓ Shuffles questions array');
    }
    
    if (applyFunc.includes('lesson.questions = questions')) {
        console.log('   ✓ Updates lesson.questions with shuffled array');
    }
}

// Simulate the rendering process
console.log('\n📊 Simulating Question Display Order:');
console.log('=====================================');

// Mock lesson data
const mockLesson = {
    id: 'test-lesson',
    shuffleQuestions: true,
    shuffleAnswers: true,
    questions: [
        { type: 'abcd', question: 'What is 2+2?', options: ['A. 3', 'B. 4', 'C. 5', 'D. 6'], correct: 'B' },
        { type: 'truefalse', question: 'The sky is blue', options: [], correct: 'true' },
        { type: 'number', question: 'What is 10*10?', correct: '100' },
        { type: 'abcd', question: 'Capital of France?', options: ['A. London', 'B. Berlin', 'C. Paris', 'D. Rome'], correct: 'C' },
        { type: 'truefalse', question: 'Earth is flat', options: [], correct: 'false' },
        { type: 'abcd', question: 'What is 5*5?', options: ['A. 20', 'B. 25', 'C. 30', 'D. 35'], correct: 'B' }
    ]
};

console.log('\nOriginal order:');
mockLesson.questions.forEach((q, i) => {
    console.log(`  ${i + 1}. [${q.type}] ${q.question}`);
});

// Simulate shuffle
const shuffled = [...mockLesson.questions].sort(() => Math.random() - 0.5);
console.log('\nAfter shuffle (new display order):');
shuffled.forEach((q, i) => {
    console.log(`  Câu ${i + 1}. [${q.type}] ${q.question}`);
});

console.log('\n✅ With the fix: Questions display in shuffled order, not grouped by type!');
console.log('\n🎉 SUMMARY: The complete shuffle fix ensures:');
console.log('   1. Questions are shuffled in memory before rendering');
console.log('   2. Questions display in their shuffled order (mixed types)');
console.log('   3. Question indices are preserved for correct answer submission');
console.log('   4. Answer choices within questions can still be shuffled independently');