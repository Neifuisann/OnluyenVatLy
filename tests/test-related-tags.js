// Simple test to verify the related tags API endpoints
const fetch = require('node-fetch');

async function testRelatedTags() {
    try {
        console.log('Testing related tags API...');

        // Test with a common tag
        const response = await fetch('http://localhost:3000/api/tags/related/dao-dong');

        if (response.ok) {
            const data = await response.json();
            console.log('Related tags response:', JSON.stringify(data, null, 2));
        } else {
            console.error('Related tags API request failed:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Related tags test failed:', error.message);
    }
}

async function testIntersectionTags() {
    try {
        console.log('\nTesting intersection tags API...');

        // Test with multiple tags
        const response = await fetch('http://localhost:3000/api/tags/intersection?tags=dao-dong,song-co');

        if (response.ok) {
            const data = await response.json();
            console.log('Intersection tags response:', JSON.stringify(data, null, 2));
        } else {
            console.error('Intersection tags API request failed:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Intersection tags test failed:', error.message);
    }
}

async function runTests() {
    console.log('Make sure the server is running on port 3000\n');
    await testRelatedTags();
    await testIntersectionTags();
}

runTests();
