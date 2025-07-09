// Load environment variables
require('dotenv').config();

const { supabase } = require('../lib/config/database');
const databaseService = require('../lib/services/databaseService');

// Test the specific lesson that was showing empty questions
async function testSpecificLesson() {
    console.log('🔍 Testing Specific Lesson: "ĐỀ 22 - VỀ ĐÍCH"...\n');
    
    const lessonId = '1748074653639';
    
    try {
        // Test 1: Get lesson directly from database
        console.log('📖 Test 1: Getting lesson directly from database...');
        
        const { data: rawLesson, error: rawError } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', lessonId)
            .single();
            
        if (rawError) {
            throw new Error(`Failed to get raw lesson: ${rawError.message}`);
        }
        
        console.log(`✅ Raw lesson found: ${rawLesson.title}`);
        console.log(`📊 Raw questions count: ${Array.isArray(rawLesson.questions) ? rawLesson.questions.length : 'Not an array or null'}`);
        console.log(`🎯 Question pool enabled: ${rawLesson.enable_question_pool}`);
        console.log(`📏 Question pool size: ${rawLesson.question_pool_size}`);
        console.log(`📋 Question type distribution:`, rawLesson.question_type_distribution);
        
        if (Array.isArray(rawLesson.questions) && rawLesson.questions.length > 0) {
            console.log(`🔍 First few question types:`, rawLesson.questions.slice(0, 3).map(q => q.type));
            
            // Count questions by type
            const typeCounts = {};
            rawLesson.questions.forEach(q => {
                const type = q.type || 'unknown';
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            });
            console.log(`📊 Question type breakdown:`, typeCounts);
        } else {
            console.log('❌ No questions found in raw lesson data!');
            return;
        }
        
        // Test 2: Get lesson through databaseService
        console.log('\n📖 Test 2: Getting lesson through databaseService...');
        
        const filteredLesson = await databaseService.getLessonById(lessonId);
        
        console.log(`✅ Filtered lesson retrieved: ${filteredLesson.title}`);
        console.log(`📊 Filtered questions count: ${Array.isArray(filteredLesson.questions) ? filteredLesson.questions.length : 'Not an array or null'}`);
        
        if (Array.isArray(filteredLesson.questions) && filteredLesson.questions.length > 0) {
            console.log(`🔍 Filtered question types:`, filteredLesson.questions.slice(0, 3).map(q => q.type));
            
            // Count filtered questions by type
            const filteredTypeCounts = {};
            filteredLesson.questions.forEach(q => {
                const type = q.type || 'unknown';
                filteredTypeCounts[type] = (filteredTypeCounts[type] || 0) + 1;
            });
            console.log(`📊 Filtered question type breakdown:`, filteredTypeCounts);
        } else {
            console.log('❌ No questions found in filtered lesson data!');
            
            // Debug: Check if filtering logic is working
            console.log('\n🔧 Debug: Checking filtering logic...');
            console.log(`Pool enabled: ${rawLesson.enable_question_pool}`);
            console.log(`Pool size: ${rawLesson.question_pool_size}`);
            console.log(`Total questions: ${rawLesson.questions.length}`);
            console.log(`Should filter: ${rawLesson.enable_question_pool && rawLesson.question_pool_size > 0 && rawLesson.question_pool_size < rawLesson.questions.length}`);
            
            if (rawLesson.question_type_distribution) {
                console.log('Distribution method would be used');
                console.log('Distribution:', rawLesson.question_type_distribution);
            } else {
                console.log('Proportional method would be used');
            }
        }
        
        console.log('\n✨ Test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testSpecificLesson()
        .then(() => {
            console.log('\n🎉 Specific lesson test completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Test failed with error:', error);
            process.exit(1);
        });
}

module.exports = { testSpecificLesson };
