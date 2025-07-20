/**
 * API Client for communicating with the Express.js backend
 */

import { API_CONFIG } from '../config';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  csrfToken?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export interface RequestOptions extends RequestInit {
  skipCsrf?: boolean;
  retries?: number;
}

class ApiClient {
  private baseUrl: string;
  private csrfToken: string | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Set CSRF token for subsequent requests
   */
  setCsrfToken(token: string) {
    this.csrfToken = token;
  }

  /**
   * Get CSRF token from server
   */
  async getCsrfToken(): Promise<string> {
    try {
      const response = await this.request<{ csrfToken: string }>('/api/csrf-token', {
        method: 'GET',
        skipCsrf: true,
      });

      if (response.success && response.data?.csrfToken) {
        this.csrfToken = response.data.csrfToken;
        return response.data.csrfToken;
      }

      throw new Error('Failed to get CSRF token');
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      throw error;
    }
  }

  /**
   * Make a request to the API with retry logic and CSRF handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { skipCsrf = false, retries = 1, ...requestOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...requestOptions.headers as Record<string, string>,
    };

    // Add CSRF token for non-GET requests
    if (!skipCsrf && requestOptions.method && !['GET', 'HEAD', 'OPTIONS'].includes(requestOptions.method)) {
      if (this.csrfToken) {
        headers['X-CSRF-Token'] = this.csrfToken;
      } else {
        // Try to get CSRF token if we don't have one
        try {
          await this.getCsrfToken();
          if (this.csrfToken) {
            headers['X-CSRF-Token'] = this.csrfToken;
          }
        } catch (error) {
          console.warn('Failed to get CSRF token:', error);
        }
      }
    }

    const config: RequestInit = {
      ...requestOptions,
      headers,
      credentials: 'include', // Include cookies for session management
    };

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, config);

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return { success: true, data: null as T };
        }

        const data = await response.json();

        // Store CSRF token if provided in response
        if (data.csrfToken) {
          this.csrfToken = data.csrfToken;
        }

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 401) {
            // Unauthorized - clear any stored tokens
            this.csrfToken = null;
          } else if (response.status === 403 && data.error?.includes('CSRF')) {
            // CSRF token invalid - try to get a new one and retry
            if (attempt < retries) {
              try {
                await this.getCsrfToken();
                if (this.csrfToken) {
                  headers['X-CSRF-Token'] = this.csrfToken;
                  config.headers = headers;
                  continue; // Retry with new CSRF token
                }
              } catch (csrfError) {
                console.error('Failed to refresh CSRF token:', csrfError);
              }
            }
          }

          throw new Error(data.error || data.message || `HTTP ${response.status}`);
        }

        return {
          success: true,
          data: data.data || data,
          message: data.message,
          csrfToken: data.csrfToken,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error occurred');

        // Don't retry for certain errors
        if (error instanceof Error && (
          error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('404')
        )) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    console.error('API Request failed after retries:', lastError);
    return {
      success: false,
      error: lastError?.message || 'Unknown error occurred',
    };
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>, options?: RequestOptions): Promise<ApiResponse<T>> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;

    return this.request<T>(url, { method: 'GET', ...options });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }

  /**
   * Upload file
   */
  async upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<ApiResponse<T>> {
    // For file uploads, we need to handle CSRF differently
    const uploadOptions: RequestOptions = {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
      ...options,
    };

    // Add CSRF token to FormData if available
    if (!uploadOptions.skipCsrf && this.csrfToken) {
      formData.append('csrfToken', this.csrfToken);
    }

    return this.request<T>(endpoint, uploadOptions);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing or custom instances
export { ApiClient };
