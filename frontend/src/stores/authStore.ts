import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  type: 'student' | 'admin';
  email?: string;
  grade_level?: string;
  school?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  csrfToken: string | null;
  sessionExpiry: number | null;
}

export interface AuthActions {
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setCsrfToken: (token: string | null) => void;
  setSessionExpiry: (expiry: number | null) => void;
  logout: () => void;
  reset: () => void;
}

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  csrfToken: null,
  sessionExpiry: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setCsrfToken: (csrfToken) => set({ csrfToken }),
      
      setSessionExpiry: (sessionExpiry) => set({ sessionExpiry }),
      
      logout: () => set({
        user: null,
        isAuthenticated: false,
        csrfToken: null,
        sessionExpiry: null,
      }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionExpiry: state.sessionExpiry,
        // Don't persist loading state or CSRF token
      }),
    }
  )
);
