/**
 * Shared authentication utilities for frontend
 * Handles both student and admin authentication checks
 */

// Enhanced authentication check that supports both students and admins
async function checkStudentAuthentication() {
    try {
        const response = await fetch('/api/auth/student/check');
        if (!response.ok) {
            console.log('Auth check failed, user not authenticated');
            return false;
        }
        const authData = await response.json();

        if (authData.success && authData.data) {
            if (authData.data.isAuthenticated && authData.data.student) {
                console.log('User authenticated:', authData.data.student.name);
                return true;
            }
        }
        
        console.log('User not authenticated');
        return false;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return false;
    }
}

// Check if current user is admin
async function checkAdminAuthentication() {
    try {
        const response = await fetch('/api/auth/admin/check');
        if (!response.ok) {
            return false;
        }
        const authData = await response.json();
        return authData.success && authData.data && authData.data.isAdmin;
    } catch (error) {
        console.error('Error checking admin authentication:', error);
        return false;
    }
}

// Get current user info (works for both students and admins)
async function getCurrentUser() {
    try {
        const response = await fetch('/api/auth/student/check');
        if (!response.ok) {
            return null;
        }
        const authData = await response.json();
        
        if (authData.success && authData.data && authData.data.student) {
            return {
                type: authData.data.student.id === 'admin' ? 'admin' : 'student',
                id: authData.data.student.id,
                name: authData.data.student.name
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Function to prompt for login when authentication is required
function promptForLogin() {
    const currentUrl = window.location.pathname + window.location.search;
    if (confirm('Bạn cần đăng nhập để truy cập tính năng này. Chuyển đến trang đăng nhập?')) {
        window.location.href = '/student/login?redirect=' + encodeURIComponent(currentUrl);
    }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkStudentAuthentication,
        checkAdminAuthentication,
        getCurrentUser,
        promptForLogin
    };
}
