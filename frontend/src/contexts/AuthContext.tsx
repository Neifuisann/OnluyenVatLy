'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

// Types for authentication
export interface User {
  id: string;
  name: string;
  type: 'student' | 'admin';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  csrfToken: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshSession: () => Promise<void>;
  getCsrfToken: () => Promise<string>;
}

export interface LoginCredentials {
  username: string;
  password: string;
  type: 'student' | 'admin';
}

export interface AuthResult {
  success: boolean;
  message?: string;
  error?: string;
  redirect?: string;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    csrfToken: null,
  });

  // Get CSRF token
  const getCsrfToken = useCallback(async (): Promise<string> => {
    try {
      const response = await apiClient.get<{ csrfToken: string }>('/api/csrf-token');
      if (response.success && response.data?.csrfToken) {
        setAuthState(prev => ({ ...prev, csrfToken: response.data!.csrfToken }));
        return response.data.csrfToken;
      }
      throw new Error('Failed to get CSRF token');
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      throw error;
    }
  }, []);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Try to check student auth first
      const studentResponse = await apiClient.get<{
        isAuthenticated: boolean;
        student?: { id: string; name: string };
      }>('/api/auth/student/check');

      if (studentResponse.success && studentResponse.data?.isAuthenticated && studentResponse.data.student) {
        setAuthState(prev => ({
          ...prev,
          user: {
            id: studentResponse.data!.student!.id,
            name: studentResponse.data!.student!.name,
            type: 'student'
          },
          isAuthenticated: true,
          isLoading: false,
        }));
        return;
      }

      // Try admin auth if student auth failed
      const adminResponse = await apiClient.get<{
        isAuthenticated: boolean;
      }>('/api/auth/admin/check');

      if (adminResponse.success && adminResponse.data?.isAuthenticated) {
        setAuthState(prev => ({
          ...prev,
          user: {
            id: 'admin',
            name: 'Administrator',
            type: 'admin'
          },
          isAuthenticated: true,
          isLoading: false,
        }));
        return;
      }

      // Not authenticated
      setAuthState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error checking authentication:', error);
      setAuthState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }));
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      const endpoint = credentials.type === 'admin' 
        ? '/api/auth/admin/login'
        : '/api/auth/student/login';

      const response = await apiClient.post<{
        success: boolean;
        message?: string;
        redirect?: string;
        student?: { id: string; name: string };
      }>(endpoint, {
        username: credentials.username,
        password: credentials.password,
      });

      if (response.success) {
        // Refresh auth state after successful login
        await checkAuth();
        
        return {
          success: true,
          message: response.data?.message || 'Login successful',
          redirect: response.data?.redirect,
        };
      } else {
        return {
          success: false,
          error: response.error || 'Login failed',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }, [checkAuth]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth state regardless of API call result
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        csrfToken: null,
      });
    }
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      await apiClient.post('/api/auth/refresh');
      await checkAuth();
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  }, [checkAuth]);

  // Check auth on mount - DISABLED for simplified demo
  // useEffect(() => {
  //   checkAuth();
  // }, [checkAuth]);

  // Get CSRF token on mount
  useEffect(() => {
    if (authState.isAuthenticated && !authState.csrfToken) {
      getCsrfToken().catch(console.error);
    }
  }, [authState.isAuthenticated, authState.csrfToken, getCsrfToken]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    checkAuth,
    refreshSession,
    getCsrfToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [isAuthenticated, isLoading, redirectTo]);

  return { isAuthenticated, isLoading };
}

// Hook for admin-only access
export function useRequireAdmin(redirectTo = '/login') {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.type !== 'admin')) {
      window.location.href = redirectTo;
    }
  }, [user, isAuthenticated, isLoading, redirectTo]);

  return { isAuthenticated: isAuthenticated && user?.type === 'admin', isLoading };
}

// Hook for student access
export function useRequireStudent(redirectTo = '/student/login') {
  const { user, isAuthenticated, isLoading } = useAuth();

  // DISABLED automatic redirect for simplified demo
  // useEffect(() => {
  //   if (!isLoading && (!isAuthenticated || user?.type !== 'student')) {
  //     window.location.href = redirectTo;
  //   }
  // }, [user, isAuthenticated, isLoading, redirectTo]);

  return { isAuthenticated: isAuthenticated && user?.type === 'student', isLoading };
}
