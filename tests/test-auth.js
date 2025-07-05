/**
 * Test script to verify authentication system changes
 * Tests that admin users can access student features
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3003';

// Test admin login and student endpoint access
async function testAdminAsStudent() {
    console.log('🧪 Testing Admin-as-Student Authentication...\n');
    
    try {
        // Step 1: Admin login
        console.log('1. Testing admin login...');
        const loginResponse = await fetch(`${BASE_URL}/api/auth/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'hoff' // Admin password from .env comments
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('   Login response:', loginData);
        
        if (!loginData.success) {
            console.log('❌ Admin login failed');
            return;
        }
        
        // Extract session cookie
        const cookies = loginResponse.headers.get('set-cookie');
        console.log('   Session cookie:', cookies ? 'Set' : 'Not set');
        if (cookies) {
            console.log('   Cookie details:', cookies.substring(0, 100) + '...');
        }
        
        // Step 2: Test student auth check endpoint
        console.log('\n2. Testing student auth check with admin session...');
        const studentCheckResponse = await fetch(`${BASE_URL}/api/auth/student/check`, {
            headers: {
                'Cookie': cookies || ''
            }
        });
        
        const studentCheckData = await studentCheckResponse.json();
        console.log('   Student check response:', studentCheckData);
        
        if (studentCheckData.success && studentCheckData.data.isAuthenticated) {
            console.log('✅ Admin can access student endpoints!');
        } else {
            console.log('❌ Admin cannot access student endpoints');
        }
        
        // Step 3: Test a student-protected route
        console.log('\n3. Testing student-protected API route...');
        const progressResponse = await fetch(`${BASE_URL}/api/progress/overview`, {
            headers: {
                'Cookie': cookies || ''
            }
        });

        console.log('   Progress endpoint status:', progressResponse.status);
        if (progressResponse.status === 200) {
            console.log('✅ Admin can access student-protected routes!');
            const progressData = await progressResponse.json();
            console.log('   Progress data received:', progressData.success ? 'Success' : 'Failed');
        } else if (progressResponse.status === 401) {
            console.log('❌ Admin cannot access student-protected routes');
            const errorData = await progressResponse.json();
            console.log('   Error:', errorData.message || errorData.error);
        } else {
            console.log('⚠️  Unexpected response status');
        }
        
        // Step 4: Test admin check endpoint
        console.log('\n4. Testing admin auth check...');
        const adminCheckResponse = await fetch(`${BASE_URL}/api/auth/admin/check`, {
            headers: {
                'Cookie': cookies || ''
            }
        });
        
        const adminCheckData = await adminCheckResponse.json();
        console.log('   Admin check response:', adminCheckData);
        
        if (adminCheckData.success && adminCheckData.data.isAdmin) {
            console.log('✅ Admin authentication still works!');
        } else {
            console.log('❌ Admin authentication broken');
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run the test
testAdminAsStudent().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
}).catch(error => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
});
