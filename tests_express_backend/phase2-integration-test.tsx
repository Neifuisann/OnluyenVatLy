/**
 * Phase 2 Integration Test
 * This file demonstrates how to use the Phase 2 infrastructure components
 */

import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute, AdminRoute, StudentRoute } from '@/components/auth/ProtectedRoute';
import { CsrfProtectedForm } from '@/components/forms/CsrfProtectedForm';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoadingSpinner, PageLoading } from '@/components/ui/LoadingStates';
import { LessonCardSkeleton } from '@/components/ui/Skeleton';
import { ErrorDisplay, NetworkError } from '@/components/ui/ErrorDisplay';
import { useAuthStore, useUIStore, useLessonStore } from '@/stores';
import { apiClient } from '@/lib/api/client';

// Example: Authentication usage
function AuthExample() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  const handleLogin = async () => {
    const result = await login({
      username: 'test@example.com',
      password: 'password',
      type: 'student'
    });
    
    if (result.success) {
      console.log('Login successful');
    } else {
      console.error('Login failed:', result.error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.name}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}

// Example: Protected routes usage
function ProtectedRouteExample() {
  return (
    <div>
      {/* Public content */}
      <h1>Public Page</h1>
      
      {/* Student-only content */}
      <StudentRoute>
        <h2>Student Dashboard</h2>
        <p>This content is only visible to students</p>
      </StudentRoute>
      
      {/* Admin-only content */}
      <AdminRoute>
        <h2>Admin Panel</h2>
        <p>This content is only visible to admins</p>
      </AdminRoute>
      
      {/* General protected content */}
      <ProtectedRoute>
        <h2>Protected Content</h2>
        <p>This content requires authentication</p>
      </ProtectedRoute>
    </div>
  );
}

// Example: CSRF protected form
function FormExample() {
  const handleSubmit = async (formData: FormData, csrfToken: string) => {
    console.log('Form submitted with CSRF token:', csrfToken);
    
    // Example API call
    const response = await apiClient.post('/api/lessons', {
      title: formData.get('title'),
      description: formData.get('description'),
    });
    
    if (response.success) {
      console.log('Lesson created successfully');
    }
  };

  return (
    <CsrfProtectedForm onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title">Title:</label>
        <input 
          type="text" 
          name="title" 
          id="title" 
          required 
          className="border rounded px-3 py-2"
        />
      </div>
      
      <div>
        <label htmlFor="description">Description:</label>
        <textarea 
          name="description" 
          id="description" 
          className="border rounded px-3 py-2"
        />
      </div>
      
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Create Lesson
      </button>
    </CsrfProtectedForm>
  );
}

// Example: Store usage
function StoreExample() {
  const { user, setUser } = useAuthStore();
  const { addNotification, theme, setTheme } = useUIStore();
  const { lessons, setLessons, searchQuery, setSearchQuery } = useLessonStore();

  const handleNotification = () => {
    addNotification({
      type: 'success',
      title: 'Success!',
      message: 'This is a test notification',
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3>Auth Store</h3>
        <p>Current user: {user?.name || 'Not logged in'}</p>
      </div>
      
      <div>
        <h3>UI Store</h3>
        <p>Current theme: {theme}</p>
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          Toggle Theme
        </button>
        <button onClick={handleNotification} className="ml-2">
          Show Notification
        </button>
      </div>
      
      <div>
        <h3>Lesson Store</h3>
        <p>Lessons count: {lessons.length}</p>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search lessons..."
          className="border rounded px-3 py-2"
        />
      </div>
    </div>
  );
}

// Example: Loading states
function LoadingExample() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSkeleton, setShowSkeleton] = React.useState(false);

  return (
    <div className="space-y-4">
      <div>
        <button onClick={() => setIsLoading(!isLoading)}>
          Toggle Loading Spinner
        </button>
        {isLoading && <LoadingSpinner />}
      </div>
      
      <div>
        <button onClick={() => setShowSkeleton(!showSkeleton)}>
          Toggle Skeleton
        </button>
        {showSkeleton && <LessonCardSkeleton />}
      </div>
    </div>
  );
}

// Example: Error handling
function ErrorExample() {
  const [showError, setShowError] = React.useState(false);
  const [showNetworkError, setShowNetworkError] = React.useState(false);

  return (
    <div className="space-y-4">
      <button onClick={() => setShowError(!showError)}>
        Toggle Error Display
      </button>
      
      <button onClick={() => setShowNetworkError(!showNetworkError)}>
        Toggle Network Error
      </button>
      
      {showError && (
        <ErrorDisplay
          title="Test Error"
          message="This is a test error message"
          onRetry={() => setShowError(false)}
        />
      )}
      
      {showNetworkError && (
        <NetworkError onRetry={() => setShowNetworkError(false)} />
      )}
    </div>
  );
}

// Main test component
export default function Phase2IntegrationTest() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="container mx-auto p-6 space-y-8">
          <h1 className="text-3xl font-bold">Phase 2 Integration Test</h1>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
            <AuthExample />
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Protected Routes</h2>
            <ProtectedRouteExample />
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">CSRF Protected Form</h2>
            <FormExample />
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">State Management</h2>
            <StoreExample />
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Loading States</h2>
            <LoadingExample />
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4">Error Handling</h2>
            <ErrorExample />
          </section>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}
