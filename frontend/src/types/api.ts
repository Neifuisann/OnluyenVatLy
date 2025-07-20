/**
 * API Types and Interfaces
 */

// User Types
export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'student' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Student extends User {
  role: 'student';
  full_name?: string;
  grade_level?: string;
  school?: string;
}

export interface Admin extends User {
  role: 'admin';
  permissions?: string[];
}

// Authentication Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  full_name?: string;
  grade_level?: string;
  school?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  session_id?: string;
}

// Lesson Types
export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  difficulty_level: number;
  estimated_time?: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
  is_published: boolean;
  author_id: string;
}

export interface LessonProgress {
  lesson_id: string;
  user_id: string;
  progress_percentage: number;
  completed_at?: string;
  time_spent: number;
  last_accessed: string;
}

// Quiz Types
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  difficulty: number;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  questions: QuizQuestion[];
  time_limit?: number;
  passing_score: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: number[];
  score: number;
  completed_at: string;
  time_taken: number;
}

// Result Types
export interface Result {
  id: string;
  user_id: string;
  lesson_id?: string;
  quiz_id?: string;
  score: number;
  total_possible: number;
  percentage: number;
  completed_at: string;
  time_taken: number;
}

// Settings Types
export interface UserSettings {
  user_id: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  sound_enabled: boolean;
}

// Gallery Types
export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  category: string;
  tags?: string[];
  created_at: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiError {
  error: string;
  message?: string;
  code?: string;
  details?: unknown;
}
