/**
 * Application configuration
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3003',
  ENDPOINTS: {
    // Authentication
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    VERIFY_SESSION: '/api/auth/verify-session',
    CHECK_AUTH: '/api/auth/check',
    SESSION_INFO: '/api/auth/session',
    REFRESH_SESSION: '/api/auth/refresh',
    CSRF_TOKEN: '/api/csrf-token',

    // Student endpoints
    STUDENT_LOGIN: '/api/auth/student/login',
    STUDENT_REGISTER: '/api/auth/student/register',
    STUDENT_CHECK: '/api/auth/student/check',
    STUDENT_LOGOUT: '/api/auth/student/logout',

    // Admin endpoints
    ADMIN_LOGIN: '/api/auth/admin/login',
    ADMIN_CHECK: '/api/auth/admin/check',
    ADMIN_LOGOUT: '/api/auth/admin/logout',
    
    // Lessons
    LESSONS: '/api/lessons',
    LESSON_DETAIL: '/api/lessons',
    
    // Quiz
    QUIZ: '/api/quiz',
    QUIZ_SUBMIT: '/api/quiz/submit',
    
    // Progress
    PROGRESS: '/api/progress',
    
    // Results
    RESULTS: '/api/results',
    
    // History
    HISTORY: '/api/history',
    
    // Settings
    SETTINGS: '/api/settings',
    
    // Admin
    ADMIN: '/api/admin',
    STUDENTS: '/api/students',
    
    // Gallery
    GALLERY: '/api/gallery',
    
    // AI Tools
    AI: '/api/ai',
    
    // Uploads
    UPLOADS: '/api/uploads',
  }
} as const;

// App Configuration
export const APP_CONFIG = {
  DOMAIN: process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000',
  NAME: 'OnluyenVatLy',
  DESCRIPTION: 'Online Physics Learning Platform',
} as const;

// Supabase Configuration
export const SUPABASE_CONFIG = {
  URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
} as const;

// Session Configuration
export const SESSION_CONFIG = {
  STUDENT_TIMEOUT_HOURS: 24,
  ADMIN_TIMEOUT_HOURS: 72,
} as const;

// Development Configuration
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
