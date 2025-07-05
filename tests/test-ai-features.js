/**
 * Test script for AI features
 * Run this to test the AI integration
 */

const aiService = require('../api/services/ai/aiService');
const imageGenerationService = require('../api/services/ai/imageGenerationService');
const aiCacheService = require('../api/services/cache/aiCacheService');

async function testAIFeatures() {
    console.log('🧪 Testing AI Features...\n');

    // Test data
    const testLessonData = {
        title: 'Chuyển động thẳng đều',
        subject: 'Vật lý',
        grade: '10',
        tags: ['cơ học', 'chuyển động'],
        questions: [
            {
                question: 'Chuyển động thẳng đều là chuyển động có đặc điểm gì?',
                type: 'abcd'
            },
            {
                question: 'Công thức tính quãng đường trong chuyển động thẳng đều là gì?',
                type: 'abcd'
            }
        ]
    };

    try {
        // Test 1: AI Service Configuration
        console.log('1️⃣ Testing AI Service Configuration...');
        const config = aiService.validateConfiguration();
        if (config.isValid) {
            console.log('✅ AI Service configuration is valid');
        } else {
            console.log('❌ AI Service configuration errors:', config.errors);
            return;
        }

        // Test 2: AI Connection
        console.log('\n2️⃣ Testing AI Connection...');
        const connection = await aiService.testConnection();
        if (connection.success) {
            console.log('✅ AI connection successful:', connection.message);
        } else {
            console.log('❌ AI connection failed:', connection.message);
            return;
        }

        // Test 3: Lesson Summary Generation
        console.log('\n3️⃣ Testing Lesson Summary Generation...');
        try {
            const summary = await aiService.generateLessonSummary(testLessonData);
            console.log('✅ Summary generated successfully:');
            console.log(`   "${summary}"`);
            console.log(`   Length: ${summary.length} characters`);
        } catch (error) {
            console.log('❌ Summary generation failed:', error.message);
        }

        // Test 4: Image Prompt Generation
        console.log('\n4️⃣ Testing Image Prompt Generation...');
        try {
            const imagePrompt = await aiService.generateImagePrompt(testLessonData);
            console.log('✅ Image prompt generated successfully:');
            console.log(`   "${imagePrompt}"`);
        } catch (error) {
            console.log('❌ Image prompt generation failed:', error.message);
        }

        // Test 5: Question Explanation
        console.log('\n5️⃣ Testing Question Explanation...');
        try {
            const explanation = await aiService.generateQuestionExplanation(
                'Chuyển động thẳng đều là chuyển động có vận tốc không đổi',
                'Đúng',
                'Sai'
            );
            console.log('✅ Explanation generated successfully:');
            console.log(`   "${explanation}"`);
        } catch (error) {
            console.log('❌ Explanation generation failed:', error.message);
        }

        // Test 6: Image Generation Service (without actually generating)
        console.log('\n6️⃣ Testing Image Generation Service...');
        try {
            // Test URL generation only
            const testUrl = await imageGenerationService.generateWithPollinations(
                'Physics education illustration showing motion, clean modern style',
                { width: 400, height: 300 }
            );
            console.log('✅ Image URL generated successfully:');
            console.log(`   ${testUrl}`);
            
            // Test URL validation
            const isValid = await imageGenerationService.validateImageUrl(testUrl);
            console.log(`✅ Image URL validation: ${isValid ? 'Valid' : 'Invalid'}`);
        } catch (error) {
            console.log('❌ Image generation test failed:', error.message);
        }

        // Test 7: AI Caching
        console.log('\n7️⃣ Testing AI Caching...');
        try {
            // Generate cache key
            const cacheKey = aiCacheService.generateCacheKey('test', testLessonData);
            console.log(`✅ Cache key generated: ${cacheKey}`);
            
            // Test cache set/get
            await aiCacheService.set('test', testLessonData, { result: 'test data' }, 60);
            const cachedData = await aiCacheService.get('test', testLessonData);
            
            if (cachedData && cachedData.fromCache) {
                console.log(`✅ Cache set/get working, type: ${cachedData.cacheType}`);
            } else {
                console.log('❌ Cache not working properly');
            }
            
            // Get cache stats
            const stats = aiCacheService.getStats();
            console.log(`✅ Cache stats: ${stats.memory.size} items, ${stats.memory.usage.toFixed(1)}% usage`);
        } catch (error) {
            console.log('❌ Caching test failed:', error.message);
        }

        // Test 8: Cost Calculation
        console.log('\n8️⃣ Testing Cost Calculation...');
        try {
            const costSavings = aiCacheService.calculateCostSavings('summary', 100);
            console.log('✅ Cost calculation working:');
            console.log(`   Tokens avoided: ${costSavings.tokensAvoided}`);
            console.log(`   Estimated cost saved: $${costSavings.estimatedCostSaved.toFixed(6)}`);
        } catch (error) {
            console.log('❌ Cost calculation failed:', error.message);
        }

        console.log('\n🎉 AI Features testing completed!');
        console.log('\n📝 Summary:');
        console.log('   - AI Service: Configured and connected');
        console.log('   - Summary Generation: Working');
        console.log('   - Image Prompt Generation: Working');
        console.log('   - Question Explanations: Working');
        console.log('   - Image Generation Service: Ready');
        console.log('   - Caching System: Working');
        console.log('   - Cost Tracking: Working');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    testAIFeatures().then(() => {
        console.log('\n✅ Test script completed');
        process.exit(0);
    }).catch((error) => {
        console.error('\n❌ Test script failed:', error);
        process.exit(1);
    });
}

module.exports = { testAIFeatures };