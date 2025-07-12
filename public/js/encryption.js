/**
 * Client-Side Encryption Utilities for Test-Taking Application
 * Uses Web Crypto API for secure encryption/decryption
 * Automatically handles encrypted requests and responses
 */

class EncryptionClient {
  constructor() {
    this.algorithm = 'AES-CBC';
    this.keyLength = 256;
    this.ivLength = 16; // 128 bits for CBC
    this.tagLength = 32; // 256 bits for HMAC-SHA256
    this.encryptionKey = null;
    this.rawKeyBuffer = null;
    this.isSupported = this.checkSupport();

    // Initialize encryption if supported
    if (this.isSupported) {
      this.initializeEncryption();
    }
  }

  /**
   * Check if Web Crypto API is supported
   * @returns {boolean} True if supported
   */
  checkSupport() {
    return typeof window !== 'undefined' && 
           window.crypto && 
           window.crypto.subtle &&
           typeof window.crypto.subtle.encrypt === 'function';
  }

  /**
   * Initialize encryption by requesting key from server
   */
  async initializeEncryption() {
    try {
      // Get CSRF token first
      let csrfToken = null;
      try {
        const csrfResponse = await fetch('/api/csrf-token', {
          credentials: 'include'
        });
        if (csrfResponse.ok) {
          const csrfData = await csrfResponse.json();
          csrfToken = csrfData.csrfToken;
        }
      } catch (csrfError) {
        console.warn('⚠️ Could not get CSRF token:', csrfError);
      }

      // Request encryption initialization from server
      const headers = {
        'Content-Type': 'application/json',
        'X-Accept-Encryption': 'true'
      };

      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }

      const response = await fetch('/api/encryption/init', {
        method: 'POST',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.encryptionKey) {
          await this.setEncryptionKey(data.encryptionKey);
          if (typeof console !== 'undefined' && !window.location.hostname.includes('production')) {
            console.log('🔑 Encryption initialized successfully');
          }
        }
      }
    } catch (error) {
      if (typeof console !== 'undefined' && !window.location.hostname.includes('production')) {
        console.warn('⚠️ Failed to initialize encryption:', error);
      }
    }
  }

  /**
   * Set encryption key from server
   * @param {string} keyData - Base64 encoded key data
   */
  async setEncryptionKey(keyData) {
    try {
      const keyBuffer = this.base64ToArrayBuffer(keyData);
      this.encryptionKey = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-CBC' },
        true, // Make key extractable for HMAC operations
        ['encrypt', 'decrypt']
      );

      // Store the raw key buffer for HMAC operations
      this.rawKeyBuffer = keyBuffer;
    } catch (error) {
      console.error('❌ Failed to set encryption key:', error);
      throw error;
    }
  }

  /**
   * Encrypt data using Web Crypto API
   * @param {string|Object} data - Data to encrypt
   * @returns {Object} Encrypted data object
   */
  async encrypt(data) {
    if (!this.isSupported || !this.encryptionKey || !this.rawKeyBuffer) {
      throw new Error('Encryption not available');
    }

    try {
      // Convert data to string if it's an object
      const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(this.ivLength));
      
      // Encrypt data
      const encodedData = new TextEncoder().encode(plaintext);
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-CBC',
          iv: iv
        },
        this.encryptionKey,
        encodedData
      );

      // Create HMAC for authentication using the raw key buffer
      const hmacKey = await window.crypto.subtle.importKey(
        'raw',
        this.rawKeyBuffer,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const encryptedBase64 = this.arrayBufferToBase64(encryptedBuffer);
      const ivBase64 = this.arrayBufferToBase64(iv);
      const dataToSign = new TextEncoder().encode(encryptedBase64 + ivBase64);
      const signature = await window.crypto.subtle.sign('HMAC', hmacKey, dataToSign);

      return {
        encrypted: encryptedBase64,
        iv: ivBase64,
        tag: this.arrayBufferToBase64(signature),
        algorithm: 'aes-256-cbc',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using Web Crypto API
   * @param {Object} encryptedData - Encrypted data object
   * @returns {string|Object} Decrypted data
   */
  async decrypt(encryptedData) {
    if (!this.isSupported || !this.encryptionKey || !this.rawKeyBuffer) {
      throw new Error('Decryption not available');
    }

    try {
      const { encrypted, iv, tag, algorithm } = encryptedData;



      // Validate algorithm
      if (algorithm !== 'aes-256-cbc') {
        throw new Error('Invalid encryption algorithm');
      }

      // Verify HMAC first using the raw key buffer
      const hmacKey = await window.crypto.subtle.importKey(
        'raw',
        this.rawKeyBuffer,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );

      const dataToVerify = new TextEncoder().encode(encrypted + iv);
      const tagBuffer = this.base64ToArrayBuffer(tag);
      const isValid = await window.crypto.subtle.verify('HMAC', hmacKey, tagBuffer, dataToVerify);

      if (!isValid) {
        throw new Error('Authentication failed - data may have been tampered with');
      }

      // Convert base64 to ArrayBuffer
      const encryptedBuffer = this.base64ToArrayBuffer(encrypted);
      const ivBuffer = this.base64ToArrayBuffer(iv);

      // Decrypt data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-CBC',
          iv: ivBuffer
        },
        this.encryptionKey,
        encryptedBuffer
      );

      const decryptedText = new TextDecoder().decode(decryptedBuffer);

      // Try to parse as JSON, return as string if it fails
      try {
        return JSON.parse(decryptedText);
      } catch {
        return decryptedText;
      }
    } catch (error) {
      if (typeof console !== 'undefined' && !window.location.hostname.includes('production')) {
        console.error('❌ Decryption error:', error);
      }
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Check if data is encrypted
   * @param {Object} data - Data to check
   * @returns {boolean} True if data is encrypted
   */
  isEncrypted(data) {
    return data &&
           typeof data === 'object' &&
           data.encrypted === true &&
           data.data &&
           data.data.encrypted &&
           data.data.iv &&
           data.data.tag;
  }

  /**
   * Encrypt request data for API calls
   * @param {Object} requestData - Request data to encrypt
   * @returns {Object} Encrypted request object
   */
  async encryptRequest(requestData) {
    if (!this.isSupported || !this.encryptionKey || !this.rawKeyBuffer) {
      return requestData; // Return unencrypted if encryption not available
    }

    try {
      const encryptedData = await this.encrypt(requestData);
      return {
        encrypted: true,
        data: encryptedData,
        version: '1.0'
      };
    } catch (error) {
      console.warn('⚠️ Request encryption failed, sending unencrypted:', error);
      return requestData;
    }
  }

  /**
   * Decrypt response data from API calls
   * @param {Object} responseData - Response data to decrypt
   * @returns {Object} Decrypted response data
   */
  async decryptResponse(responseData) {
    if (!this.isEncrypted(responseData)) {
      return responseData; // Not encrypted, return as-is
    }

    try {
      return await this.decrypt(responseData.data);
    } catch (error) {
      console.error('❌ Response decryption failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced fetch function with automatic encryption/decryption
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Promise} Enhanced fetch promise
   */
  async secureFetch(url, options = {}) {
    const enhancedOptions = { ...options };
    
    // Add encryption headers
    enhancedOptions.headers = {
      ...enhancedOptions.headers,
      'X-Accept-Encryption': 'true'
    };

    // Encrypt request body if present and encryption is available
    if (enhancedOptions.body && this.isSupported && this.encryptionKey && this.rawKeyBuffer) {
      try {
        let requestData;

        // Parse body if it's a string
        if (typeof enhancedOptions.body === 'string') {
          try {
            requestData = JSON.parse(enhancedOptions.body);
          } catch {
            requestData = enhancedOptions.body;
          }
        } else {
          requestData = enhancedOptions.body;
        }

        // Extract CSRF token from request data and move it to headers
        let csrfToken = null;
        if (requestData && typeof requestData === 'object' && requestData.csrfToken) {
          csrfToken = requestData.csrfToken;
          // Remove CSRF token from the data to be encrypted
          const dataToEncrypt = { ...requestData };
          delete dataToEncrypt.csrfToken;
          requestData = dataToEncrypt;
        }

        const encryptedRequest = await this.encryptRequest(requestData);
        enhancedOptions.body = JSON.stringify(encryptedRequest);
        enhancedOptions.headers['X-Content-Encrypted'] = 'true';

        // Add CSRF token to headers if present
        if (csrfToken) {
          enhancedOptions.headers['X-CSRF-Token'] = csrfToken;
        }

        if (typeof console !== 'undefined' && !window.location.hostname.includes('production')) {
          console.log('🔒 Encrypted request for:', url);
        }
      } catch (error) {
        if (typeof console !== 'undefined' && !window.location.hostname.includes('production')) {
          console.warn('⚠️ Request encryption failed for:', url, error);
        }
      }
    }

    // Make the request
    const response = await fetch(url, enhancedOptions);
    
    // Check if response is encrypted
    const isEncryptedResponse = response.headers.get('X-Content-Encrypted') === 'true';
    
    if (isEncryptedResponse && this.isSupported && this.encryptionKey && this.rawKeyBuffer) {
      // Clone response to read body
      const responseClone = response.clone();
      
      try {
        const responseData = await responseClone.json();
        const decryptedData = await this.decryptResponse(responseData);
        
        if (typeof console !== 'undefined' && !window.location.hostname.includes('production')) {
          console.log('🔓 Decrypted response from:', url);
        }

        // Return a new Response object with decrypted data
        return new Response(JSON.stringify(decryptedData), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (error) {
        if (typeof console !== 'undefined' && !window.location.hostname.includes('production')) {
          console.error('❌ Response decryption failed for:', url, error);
        }
        return response; // Return original response if decryption fails
      }
    }

    return response;
  }

  /**
   * Utility: Convert ArrayBuffer to Base64
   * @param {ArrayBuffer} buffer - Buffer to convert
   * @returns {string} Base64 string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Utility: Convert Base64 to ArrayBuffer
   * @param {string} base64 - Base64 string to convert
   * @returns {ArrayBuffer} ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Create global encryption client instance
window.encryptionClient = new EncryptionClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EncryptionClient;
}
