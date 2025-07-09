// Load environment variables
require('dotenv').config();

const databaseService = require('../lib/services/databaseService');

// Test bypassing cache by calling databaseService directly
async function testCacheBypass() {
    console.log('🔄 Testing Cache Bypass for Question Pool Fix...\n');
    
    const lessonId = '1748074653639'; // The lesson that was showing empty questions
    
    try {
        console.log('📖 Getting lesson directly from databaseService (bypasses cache)...');
        
        const lesson = await databaseService.getLessonById(lessonId);
        
        console.log(`✅ Lesson retrieved: ${lesson.title}`);
        console.log(`📊 Questions count: ${Array.isArray(lesson.questions) ? lesson.questions.length : 'Not an array'}`);
        console.log(`🎯 Question pool enabled: ${lesson.enableQuestionPool}`);
        console.log(`📏 Question pool size: ${lesson.questionPoolSize}`);
        console.log(`📋 Question type distribution:`, lesson.questionTypeDistribution);
        
        if (Array.isArray(lesson.questions) && lesson.questions.length > 0) {
            console.log(`🔍 Question types in filtered result:`, lesson.questions.slice(0, 5).map(q => q.type));
            
            // Count questions by type
            const typeCounts = {};
            lesson.questions.forEach(q => {
                const type = q.type || 'unknown';
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            });
            console.log(`📊 Filtered question type breakdown:`, typeCounts);
            
            // Verify the distribution matches expected
            const expectedDistribution = lesson.questionTypeDistribution;
            if (expectedDistribution) {
                console.log('\n🔍 Verifying distribution matches expected:');
                let allMatch = true;
                for (const [type, expectedCount] of Object.entries(expectedDistribution)) {
                    const actualCount = typeCounts[type] || 0;
                    if (actualCount === expectedCount) {
                        console.log(`✅ Type ${type}: Expected ${expectedCount}, Got ${actualCount} ✓`);
                    } else {
                        console.log(`❌ Type ${type}: Expected ${expectedCount}, Got ${actualCount} ✗`);
                        allMatch = false;
                    }
                }
                
                if (allMatch) {
                    console.log('\n🎉 All question types match the expected distribution!');
                    console.log('✅ Question pool filtering is working correctly!');
                } else {
                    console.log('\n⚠️  Some question types do not match expected distribution.');
                }
            }
        } else {
            console.log('❌ No questions found in the lesson!');
            console.log('This suggests there might be an issue with the filtering logic.');
        }
        
        console.log('\n📝 Summary:');
        console.log(`- Lesson has question pool enabled: ${lesson.enableQuestionPool}`);
        console.log(`- Pool size setting: ${lesson.questionPoolSize}`);
        console.log(`- Actual questions returned: ${lesson.questions.length}`);
        console.log(`- Question pool filtering is ${lesson.questions.length === lesson.questionPoolSize ? 'WORKING' : 'NOT WORKING'}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testCacheBypass()
        .then(() => {
            console.log('\n✨ Cache bypass test completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Test failed with error:', error);
            process.exit(1);
        });
}

module.exports = { testCacheBypass };
