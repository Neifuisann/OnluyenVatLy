// Test to demonstrate the visual shuffle issue
const fs = require('fs');

// Simulate the question grouping logic from renderQuestions
function simulateQuestionGrouping(questions) {
    const sections = {
        abcd: { questions: [] },
        truefalse: { questions: [] },
        number: { questions: [] }
    };

    // Group questions by type (same logic as renderQuestions)
    questions.forEach(q => {
        const normalizedType = q.type === 'multiple_choice' ? 'abcd' :
                             q.type === 'true_false' ? 'truefalse' :
                             q.type === 'fill_blank' ? 'number' : q.type;

        if (sections[normalizedType]) {
            sections[normalizedType].questions.push(q);
        }
    });

    return sections;
}

// Create test questions
const testQuestions = [
    { id: 1, type: 'abcd', question: 'ABCD Question 1' },
    { id: 2, type: 'truefalse', question: 'True/False Question 1' },
    { id: 3, type: 'abcd', question: 'ABCD Question 2' },
    { id: 4, type: 'number', question: 'Number Question 1' },
    { id: 5, type: 'truefalse', question: 'True/False Question 2' },
    { id: 6, type: 'abcd', question: 'ABCD Question 3' }
];

console.log('Original question order:');
testQuestions.forEach((q, i) => console.log(`  ${i + 1}. [${q.type}] ${q.question}`));

// Simulate shuffling
const shuffledQuestions = [...testQuestions].sort(() => Math.random() - 0.5);
console.log('\nShuffled question order:');
shuffledQuestions.forEach((q, i) => console.log(`  ${i + 1}. [${q.type}] ${q.question}`));

// Simulate grouping (what happens in renderQuestions)
const grouped = simulateQuestionGrouping(shuffledQuestions);
console.log('\nQuestions after grouping by type (actual display order):');

let displayIndex = 1;
Object.entries(grouped).forEach(([type, section]) => {
    if (section.questions.length > 0) {
        console.log(`\n${type.toUpperCase()} Section:`);
        section.questions.forEach((q) => {
            console.log(`  Câu ${displayIndex}. [${q.type}] ${q.question}`);
            displayIndex++;
        });
    }
});

console.log('\n❌ PROBLEM: Questions are displayed grouped by type, not in shuffled order!');
console.log('   Even though questions are shuffled in memory, they appear grouped on screen.');