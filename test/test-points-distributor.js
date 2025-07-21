const { distributePoints, assignPointsToQuestions } = require('../lib/utils/pointsDistributor');

console.log('Testing Points Distributor');
console.log('==========================\n');

// Test 1: Distribute 1 point among 3 questions
console.log('Test 1: Distribute 1 point among 3 questions');
const points1 = distributePoints(1, 3);
console.log('Points:', points1);
console.log('Sum:', points1.reduce((a, b) => a + b, 0));
console.log('Expected: 1.00');
console.log('Pass:', Math.abs(points1.reduce((a, b) => a + b, 0) - 1) < 0.001 ? '✓' : '✗');
console.log('');

// Test 2: Distribute 10 points with the configuration from the user's image
console.log('Test 2: Real-world configuration');
const questionTypeDistribution = {
    abcd: 10,
    truefalse: 2,
    number: 3  // "number" is used for fill-in questions
};

const pointsDistribution = {
    abcd: 6,
    truefalse: 1.2,
    number: 1  // This should be distributed as 0.34, 0.33, 0.33
};

// Calculate expected total
const expectedTotal = pointsDistribution.abcd + pointsDistribution.truefalse + pointsDistribution.number;
console.log('Expected total before fix:', expectedTotal);

// Test each type separately
console.log('\nABCD Questions:');
const abcdPoints = distributePoints(pointsDistribution.abcd, questionTypeDistribution.abcd);
console.log('Points per question:', abcdPoints);
console.log('Total:', abcdPoints.reduce((a, b) => a + b, 0));

console.log('\nTrue/False Questions:');
const tfPoints = distributePoints(pointsDistribution.truefalse, questionTypeDistribution.truefalse);
console.log('Points per question:', tfPoints);
console.log('Total:', tfPoints.reduce((a, b) => a + b, 0));

console.log('\nFill-in (Number) Questions:');
const fillPoints = distributePoints(pointsDistribution.number, questionTypeDistribution.number);
console.log('Points per question:', fillPoints);
console.log('Total:', fillPoints.reduce((a, b) => a + b, 0));
console.log('Note: One question gets 0.34 to ensure total equals 1.00');

// Calculate grand total
const grandTotal = 
    abcdPoints.reduce((a, b) => a + b, 0) +
    tfPoints.reduce((a, b) => a + b, 0) +
    fillPoints.reduce((a, b) => a + b, 0);

console.log('\n' + '='.repeat(40));
console.log('GRAND TOTAL:', grandTotal.toFixed(2));
console.log('Expected:', expectedTotal.toFixed(2));
console.log('Difference:', (grandTotal - expectedTotal).toFixed(6));
console.log('Pass:', Math.abs(grandTotal - expectedTotal) < 0.001 ? '✓ Total is correct!' : '✗ Total mismatch');

// Test 3: Test assignPointsToQuestions function
console.log('\n\nTest 3: Assign points to actual questions');
const testQuestions = [
    ...Array(12).fill().map((_, i) => ({ id: `mc${i}`, type: 'abcd', question: `MC Question ${i+1}` })),
    ...Array(3).fill().map((_, i) => ({ id: `tf${i}`, type: 'truefalse', question: `TF Question ${i+1}` })),
    ...Array(5).fill().map((_, i) => ({ id: `fill${i}`, type: 'number', question: `Fill Question ${i+1}` }))
];

const processedQuestions = assignPointsToQuestions(
    testQuestions,
    questionTypeDistribution,
    pointsDistribution
);

console.log(`\nProcessed ${processedQuestions.length} questions:`);
const summary = {};
processedQuestions.forEach(q => {
    if (!summary[q.type]) summary[q.type] = { count: 0, total: 0, points: [] };
    summary[q.type].count++;
    summary[q.type].total += q.points;
    summary[q.type].points.push(q.points);
});

Object.entries(summary).forEach(([type, data]) => {
    console.log(`\n${type}:`);
    console.log(`  Count: ${data.count}`);
    console.log(`  Points: ${data.points.join(', ')}`);
    console.log(`  Total: ${data.total.toFixed(2)}`);
});

const finalTotal = processedQuestions.reduce((sum, q) => sum + q.points, 0);
console.log('\n' + '='.repeat(40));
console.log('FINAL TOTAL POINTS:', finalTotal.toFixed(2));
console.log('Expected:', expectedTotal.toFixed(2));
console.log(finalTotal === expectedTotal ? '✓ SUCCESS: Total points match exactly!' : 
    Math.abs(finalTotal - expectedTotal) < 0.001 ? '✓ SUCCESS: Total points match (within precision)!' : 
    '✗ FAIL: Total points do not match');