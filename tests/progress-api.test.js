// Test file for progress tracking API
// Run with: node tests/progress-api.test.js

require('dotenv').config();
const { supabase } = require('../api/config/database');
const databaseService = require('../api/services/databaseService');

// Test data
const TEST_STUDENT_ID = '6cfb3de1-010c-47bf-85df-dac34ffbf722'; // Replace with actual student ID
const TEST_LESSON_ID = '1748074653639'; // Replace with actual lesson ID

async function testProgressTracking() {
  console.log('🧪 Testing Progress Tracking API...\n');

  try {
    // Test 1: Get student completed lessons
    console.log('1. Testing getStudentCompletedLessons...');
    const completedLessons = await databaseService.getStudentCompletedLessons(TEST_STUDENT_ID);
    console.log(`✅ Found ${completedLessons.length} completed lessons`);
    console.log('Sample:', completedLessons.slice(0, 2));
    console.log('');

    // Test 2: Get student streak
    console.log('2. Testing getStudentStreak...');
    const streak = await databaseService.getStudentStreak(TEST_STUDENT_ID);
    console.log(`✅ Current streak: ${streak} days`);
    console.log('');

    // Test 3: Get last incomplete lesson
    console.log('3. Testing getLastIncompleteLesson...');
    const lastIncomplete = await databaseService.getLastIncompleteLesson(TEST_STUDENT_ID);
    console.log('✅ Last incomplete lesson:', lastIncomplete);
    console.log('');

    // Test 4: Get mistakes count
    console.log('4. Testing getStudentMistakesCount...');
    const mistakesCount = await databaseService.getStudentMistakesCount(TEST_STUDENT_ID);
    console.log(`✅ Total mistakes: ${mistakesCount}`);
    console.log('');

    // Test 5: Get progress by topic
    console.log('5. Testing getProgressByTopic...');
    const progressByTopic = await databaseService.getProgressByTopic(TEST_STUDENT_ID);
    console.log('✅ Progress by topic:');
    Object.keys(progressByTopic).forEach(topic => {
      const data = progressByTopic[topic];
      console.log(`  ${topic}: ${data.completed}/${data.total} (${data.percentage}%)`);
    });
    console.log('');

    // Test 6: Get learning statistics
    console.log('6. Testing getStudentLearningStats...');
    const stats = await databaseService.getStudentLearningStats(TEST_STUDENT_ID, 'week');
    console.log('✅ Learning stats (week):', stats);
    console.log('');

    // Test 7: Get recommended lessons
    console.log('7. Testing getRecommendedLessons...');
    const recommendations = await databaseService.getRecommendedLessons(TEST_STUDENT_ID, 3);
    console.log(`✅ Found ${recommendations.length} recommendations`);
    recommendations.forEach(rec => {
      console.log(`  - ${rec.title} (Score: ${rec.recommendationScore})`);
    });
    console.log('');

    // Test 8: Get student mistakes
    console.log('8. Testing getStudentMistakes...');
    const mistakes = await databaseService.getStudentMistakes(TEST_STUDENT_ID, 5);
    console.log(`✅ Found ${mistakes.length} mistakes for review`);
    mistakes.forEach(mistake => {
      console.log(`  - ${mistake.lessonTitle}: ${mistake.question.substring(0, 50)}...`);
    });
    console.log('');

    // Test 9: Get student achievements
    console.log('9. Testing getStudentAchievements...');
    const achievements = await databaseService.getStudentAchievements(TEST_STUDENT_ID);
    console.log(`✅ Found ${achievements.length} achievements`);
    achievements.forEach(achievement => {
      console.log(`  ${achievement.icon} ${achievement.title}: ${achievement.description}`);
    });
    console.log('');

    // Test 10: Mark lesson completed
    console.log('10. Testing markLessonCompleted...');
    const completion = await databaseService.markLessonCompleted(TEST_STUDENT_ID, TEST_LESSON_ID, 8, 300);
    console.log('✅ Lesson completion:', completion);
    console.log('');

    console.log('🎉 All progress tracking tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

async function testProgressAPI() {
  console.log('🌐 Testing Progress API Endpoints...\n');

  // Mock request object for testing
  const mockReq = {
    session: {
      studentId: TEST_STUDENT_ID
    }
  };

  const mockRes = {
    json: (data) => {
      console.log('Response:', JSON.stringify(data, null, 2));
    },
    status: (code) => ({
      json: (data) => {
        console.log(`Status: ${code}`);
        console.log('Response:', JSON.stringify(data, null, 2));
      }
    })
  };

  try {
    const progressController = require('../api/controllers/progressController');

    // Test progress overview
    console.log('Testing getStudentProgress endpoint...');
    await progressController.getStudentProgress(mockReq, mockRes);
    console.log('');

    // Test detailed progress
    console.log('Testing getDetailedProgress endpoint...');
    await progressController.getDetailedProgress(mockReq, mockRes);
    console.log('');

    // Test learning stats
    console.log('Testing getLearningStats endpoint...');
    const mockReqWithQuery = {
      ...mockReq,
      query: { period: 'week' }
    };
    await progressController.getLearningStats(mockReqWithQuery, mockRes);
    console.log('');

    console.log('🎉 API endpoint tests completed!');

  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Progress Tracking Tests\n');
  console.log('='.repeat(50));
  
  await testProgressTracking();
  
  console.log('\n' + '='.repeat(50));
  
  await testProgressAPI();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().then(() => {
    console.log('\n🏁 Test execution finished');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testProgressTracking,
  testProgressAPI,
  runAllTests
};
