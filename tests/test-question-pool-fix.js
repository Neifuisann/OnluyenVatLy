// Load environment variables
require('dotenv').config();

const { supabase } = require('../lib/config/database');
const databaseService = require('../lib/services/databaseService');

// Test the question pool filtering fix
async function testQuestionPoolFiltering() {
    console.log('🧪 Testing Question Pool Filtering Fix...\n');
    
    try {
        // Test 1: Create a test lesson with question pool enabled
        console.log('📝 Test 1: Creating test lesson with question pool...');
        
        const testLesson = {
            id: `test_lesson_${Date.now()}`,
            title: 'Test Question Pool Lesson',
            subject: 'Vật lý',
            grade: 10,
            enable_question_pool: true,
            question_pool_size: 3,
            question_type_distribution: {
                'abcd': 2,
                'truefalse': 1
            },
            questions: [
                { id: 1, type: 'abcd', question: 'MC Question 1', options: ['A', 'B', 'C', 'D'], correct: 'A' },
                { id: 2, type: 'abcd', question: 'MC Question 2', options: ['A', 'B', 'C', 'D'], correct: 'B' },
                { id: 3, type: 'abcd', question: 'MC Question 3', options: ['A', 'B', 'C', 'D'], correct: 'C' },
                { id: 4, type: 'truefalse', question: 'TF Question 1', correct: true },
                { id: 5, type: 'truefalse', question: 'TF Question 2', correct: false },
                { id: 6, type: 'number', question: 'Number Question 1', correct: 42 }
            ]
        };
        
        const { data: createdLesson, error: createError } = await supabase
            .from('lessons')
            .insert(testLesson)
            .select()
            .single();
            
        if (createError) {
            throw new Error(`Failed to create test lesson: ${createError.message}`);
        }
        
        console.log(`✅ Test lesson created with ID: ${createdLesson.id}`);
        
        // Test 2: Retrieve lesson and verify question pool filtering
        console.log('\n📖 Test 2: Retrieving lesson and checking question filtering...');
        
        const retrievedLesson = await databaseService.getLessonById(createdLesson.id);
        
        console.log(`Original questions count: ${testLesson.questions.length}`);
        console.log(`Filtered questions count: ${retrievedLesson.questions.length}`);
        console.log(`Expected pool size: ${testLesson.question_pool_size}`);
        
        // Verify question count matches pool size
        if (retrievedLesson.questions.length !== testLesson.question_pool_size) {
            throw new Error(`Question count mismatch! Expected: ${testLesson.question_pool_size}, Got: ${retrievedLesson.questions.length}`);
        }
        
        console.log('✅ Question count matches pool size');
        
        // Test 3: Verify question type distribution
        console.log('\n🔍 Test 3: Verifying question type distribution...');
        
        const questionTypes = {};
        retrievedLesson.questions.forEach(q => {
            const type = q.type || 'multiple-choice';
            questionTypes[type] = (questionTypes[type] || 0) + 1;
        });
        
        console.log('Question type distribution:', questionTypes);
        console.log('Expected distribution:', testLesson.question_type_distribution);

        // Verify distribution matches expected
        const expectedDistribution = testLesson.question_type_distribution;
        for (const [type, expectedCount] of Object.entries(expectedDistribution)) {
            const actualCount = questionTypes[type] || 0;
            if (actualCount !== expectedCount) {
                console.warn(`⚠️  Type ${type}: Expected ${expectedCount}, Got ${actualCount}`);
            } else {
                console.log(`✅ Type ${type}: ${actualCount} questions (correct)`);
            }
        }
        
        // Test 4: Test lesson without question pool
        console.log('\n📝 Test 4: Testing lesson without question pool...');
        
        const testLessonNoPool = {
            id: `test_lesson_no_pool_${Date.now()}`,
            title: 'Test No Pool Lesson',
            subject: 'Vật lý',
            grade: 10,
            enable_question_pool: false,
            questions: testLesson.questions
        };
        
        const { data: createdLessonNoPool, error: createErrorNoPool } = await supabase
            .from('lessons')
            .insert(testLessonNoPool)
            .select()
            .single();
            
        if (createErrorNoPool) {
            throw new Error(`Failed to create no-pool test lesson: ${createErrorNoPool.message}`);
        }
        
        const retrievedLessonNoPool = await databaseService.getLessonById(createdLessonNoPool.id);
        
        if (retrievedLessonNoPool.questions.length !== testLessonNoPool.questions.length) {
            throw new Error(`No-pool lesson should have all questions! Expected: ${testLessonNoPool.questions.length}, Got: ${retrievedLessonNoPool.questions.length}`);
        }
        
        console.log('✅ No-pool lesson returns all questions correctly');
        
        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await supabase.from('lessons').delete().eq('id', createdLesson.id);
        await supabase.from('lessons').delete().eq('id', createdLessonNoPool.id);
        console.log('✅ Test data cleaned up');
        
        console.log('\n🎉 All tests passed! Question pool filtering is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testQuestionPoolFiltering()
        .then(() => {
            console.log('\n✨ Test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Test failed with error:', error);
            process.exit(1);
        });
}

module.exports = { testQuestionPoolFiltering };
