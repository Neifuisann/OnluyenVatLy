'use client';

import { FormEvent, ReactNode } from 'react';
import { useFormCsrf } from '@/hooks/useCsrf';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export interface CsrfProtectedFormProps {
  children: ReactNode;
  onSubmit: (formData: FormData, csrfToken: string) => void | Promise<void>;
  className?: string;
  disabled?: boolean;
  loadingText?: string;
}

export function CsrfProtectedForm({
  children,
  onSubmit,
  className,
  disabled = false,
  loadingText = 'Đang xử lý...',
}: CsrfProtectedFormProps) {
  const { token, isLoading, error, isReady } = useFormCsrf();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!isReady || disabled) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.append('csrfToken', token!);
    
    try {
      await onSubmit(formData, token!);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner text="Đang tải form..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">Lỗi bảo mật: {error}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {/* Hidden CSRF token field for non-JS fallback */}
      <input type="hidden" name="csrfToken" value={token || ''} />
      
      {children}
      
      {disabled && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <LoadingSpinner text={loadingText} />
        </div>
      )}
    </form>
  );
}

// Hook for manual form handling with CSRF
export function useSecureForm() {
  const { token, isReady, getFormData, getFormDataWithCsrf } = useFormCsrf();

  const submitSecurely = async (
    endpoint: string,
    data: Record<string, unknown>,
    options?: RequestInit
  ) => {
    if (!isReady) {
      throw new Error('CSRF token not ready');
    }

    const secureData = getFormData(data);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token!,
        ...options?.headers,
      },
      body: JSON.stringify(secureData),
      credentials: 'include',
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const uploadSecurely = async (
    endpoint: string,
    formData: FormData,
    options?: RequestInit
  ) => {
    if (!isReady) {
      throw new Error('CSRF token not ready');
    }

    const secureFormData = getFormDataWithCsrf(formData);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-CSRF-Token': token!,
        ...options?.headers,
      },
      body: secureFormData,
      credentials: 'include',
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  return {
    token,
    isReady,
    submitSecurely,
    uploadSecurely,
    getFormData,
    getFormDataWithCsrf,
  };
}
