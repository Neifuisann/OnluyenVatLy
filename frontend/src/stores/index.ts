/**
 * Central store exports
 */

import { useAuthStore } from './authStore';
import { useUIStore } from './uiStore';
import { useLessonStore } from './lessonStore';

export { useAuthStore } from './authStore';
export type { AuthStore, AuthState, AuthActions, User } from './authStore';

export { useUIStore } from './uiStore';
export type {
  UIStore,
  UIState,
  UIActions,
  Notification,
  BreadcrumbItem
} from './uiStore';

export { useLessonStore } from './lessonStore';
export type {
  LessonStore,
  LessonState,
  LessonActions,
  Lesson,
  LessonProgress
} from './lessonStore';

// Store utilities
export const resetAllStores = () => {
  useAuthStore.getState().reset();
  useUIStore.getState().reset();
  useLessonStore.getState().reset();
};

// Notification helpers
export const showNotification = (
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message?: string,
  duration?: number
) => {
  useUIStore.getState().addNotification({
    type,
    title,
    message,
    duration,
  });
};

export const showSuccess = (title: string, message?: string) => 
  showNotification('success', title, message);

export const showError = (title: string, message?: string) => 
  showNotification('error', title, message);

export const showWarning = (title: string, message?: string) => 
  showNotification('warning', title, message);

export const showInfo = (title: string, message?: string) => 
  showNotification('info', title, message);
