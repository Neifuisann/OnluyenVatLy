// Test script to debug authentication issue
const fetch = require('node-fetch');

async function testAuthEndpoint() {
    try {
        console.log('Testing /api/check-student-auth endpoint...');
        
        const response = await fetch('http://localhost:3003/api/check-student-auth');
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        
        // Test what the client-side code is checking for
        console.log('\nClient-side checks:');
        console.log('authData.isAuthenticated:', data.isAuthenticated);
        console.log('authData.authenticated:', data.authenticated);
        console.log('authData.student:', data.student);
        console.log('Condition (authData.isAuthenticated && authData.student):', !!(data.isAuthenticated && data.student));
        console.log('Condition (authData.authenticated && authData.student):', !!(data.authenticated && data.student));
        
    } catch (error) {
        console.error('Error testing auth endpoint:', error);
    }
}

testAuthEndpoint();
