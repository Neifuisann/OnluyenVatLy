import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';

export interface CsrfState {
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useCsrf() {
  const [state, setState] = useState<CsrfState>({
    token: null,
    isLoading: false,
    error: null,
  });

  const fetchToken = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const token = await apiClient.getCsrfToken();
      setState({
        token,
        isLoading: false,
        error: null,
      });
      return token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get CSRF token';
      setState({
        token: null,
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, []);

  const refreshToken = useCallback(async () => {
    return fetchToken();
  }, [fetchToken]);

  // Auto-fetch token on mount
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return {
    ...state,
    fetchToken,
    refreshToken,
  };
}

// Hook for forms that need CSRF protection
export function useFormCsrf() {
  const { token, isLoading, error, refreshToken } = useCsrf();

  const getFormData = useCallback((formData: Record<string, unknown>) => {
    if (!token) {
      throw new Error('CSRF token not available');
    }
    
    return {
      ...formData,
      csrfToken: token,
    };
  }, [token]);

  const getFormDataWithCsrf = useCallback((formData: FormData) => {
    if (!token) {
      throw new Error('CSRF token not available');
    }
    
    formData.append('csrfToken', token);
    return formData;
  }, [token]);

  return {
    token,
    isLoading,
    error,
    refreshToken,
    getFormData,
    getFormDataWithCsrf,
    isReady: !isLoading && !error && !!token,
  };
}
