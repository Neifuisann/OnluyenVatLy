// Test script to verify database insert with correct schema
require('dotenv').config();
const { supabase } = require('../api/config/database');

async function testResultInsert() {
    try {
        console.log('Testing result insert with correct schema...');
        
        const testData = {
            id: 'test_' + Date.now().toString(),
            lessonId: '1748074653639',
            student_id: '6cfb3de1-010c-47bf-85df-dac34ffbf722',
            questions: [
                {
                    type: 'multiple_choice',
                    question: 'Test question',
                    userAnswer: 'A',
                    correctAnswer: 'A',
                    isCorrect: true,
                    points: 1,
                    earnedPoints: 1
                }
            ],
            score: 1,
            totalPoints: 1,
            studentInfo: {
                name: 'Test Student',
                id: '6cfb3de1-010c-47bf-85df-dac34ffbf722'
            },
            timestamp: new Date().toISOString(),
            ipAddress: '127.0.0.1'
        };
        
        console.log('Inserting test data:', JSON.stringify(testData, null, 2));
        
        const { data, error } = await supabase
            .from('results')
            .insert(testData)
            .select('id')
            .single();
        
        if (error) {
            console.error('Insert error:', error);
            return false;
        }
        
        console.log('Insert successful! Result ID:', data.id);
        
        // Clean up - delete the test record
        const { error: deleteError } = await supabase
            .from('results')
            .delete()
            .eq('id', data.id);
            
        if (deleteError) {
            console.warn('Cleanup error:', deleteError);
        } else {
            console.log('Test record cleaned up successfully');
        }
        
        return true;
    } catch (error) {
        console.error('Test failed:', error);
        return false;
    }
}

testResultInsert().then(success => {
    console.log('Test completed:', success ? 'SUCCESS' : 'FAILED');
    process.exit(success ? 0 : 1);
});
