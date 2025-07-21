/**
 * Encryption Utilities for Client-Side
 * Helps manage encryption status and secure communication with the server
 */

const EncryptionUtils = {
  /**
   * Cache for encryption status to avoid frequent API calls
   */
  _encryptionStatusCache: {
    enabled: true, // Default to enabled
    timestamp: 0,
    ttl: 60000 // Cache TTL in milliseconds (1 minute)
  },

  /**
   * Check if encryption is enabled on the server
   * @returns {Promise<boolean>} True if encryption is enabled, false otherwise
   */
  async isEncryptionEnabled() {
    const now = Date.now();
    
    // Return cached value if still valid
    if (now - this._encryptionStatusCache.timestamp < this._encryptionStatusCache.ttl) {
      return this._encryptionStatusCache.enabled;
    }
    
    try {
      // Fetch encryption status from server
      const response = await fetch('/api/admin/encryption/public-status');
      const data = await response.json();
      
      if (!data.success) {
        console.error('Error fetching encryption status:', data.message);
        return true; // Default to enabled if there's an error
      }
      
      // Update cache
      this._encryptionStatusCache = {
        enabled: data.encryptionEnabled,
        timestamp: now,
        ttl: 60000
      };
      
      return data.encryptionEnabled;
    } catch (error) {
      console.error('Error checking encryption status:', error);
      return true; // Default to enabled if there's an error
    }
  },
  
  /**
   * Clear the encryption status cache
   * Used when the status might have changed
   */
  clearEncryptionCache() {
    this._encryptionStatusCache.timestamp = 0;
  },
  
  /**
   * Secure fetch that handles encryption/decryption automatically
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  async secureFetch(url, options = {}) {
    // Check if encryption is enabled
    const encryptionEnabled = await this.isEncryptionEnabled();
    
    // Default options
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Merge options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // If encryption is enabled and we have an encryption context
    if (encryptionEnabled && window.encryptionService) {
      // Add encryption headers
      mergedOptions.headers['X-Accept-Encryption'] = 'true';
      
      // Encrypt request body if present
      if (mergedOptions.body) {
        try {
          const encryptedData = window.encryptionService.encryptRequest(
            typeof mergedOptions.body === 'string' 
              ? JSON.parse(mergedOptions.body) 
              : mergedOptions.body
          );
          
          mergedOptions.body = JSON.stringify(encryptedData);
          mergedOptions.headers['X-Content-Encrypted'] = 'true';
        } catch (error) {
          console.error('Error encrypting request:', error);
          // Continue with unencrypted data if encryption fails
        }
      }
    } else if (url.includes('/api/results')) {
      // For results API, add a special header when encryption is disabled
      mergedOptions.headers['X-Encryption-Disabled'] = 'true';
    }
    
    // Add CSRF token if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      mergedOptions.headers['X-CSRF-Token'] = csrfToken;
    }
    
    // Perform fetch
    const response = await fetch(url, mergedOptions);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return response;
    }
    
    // Parse JSON response
    const data = await response.json();
    
    // Check if response is encrypted
    const isEncrypted = response.headers.get('x-content-encrypted') === 'true' || 
                       (data && data.encrypted === true);
    
    // Decrypt response if encrypted and we have an encryption service
    if (isEncrypted && window.encryptionService) {
      try {
        return window.encryptionService.decryptResponse(data);
      } catch (error) {
        console.error('Error decrypting response:', error);
        throw new Error('Failed to decrypt response');
      }
    }
    
    // Return plain response
    return data;
  },
  
  /**
   * Submit quiz results securely
   * @param {Object} quizData - Quiz data to submit
   * @returns {Promise<Object>} Response data
   */
  async submitQuizResults(quizData) {
    return this.secureFetch('/api/results', {
      method: 'POST',
      body: JSON.stringify(quizData)
    });
  }
};

// Make available globally
window.EncryptionUtils = EncryptionUtils;