/**
 * CSRF Token Utility Functions
 * Provides helper functions for handling CSRF tokens in API requests
 */

/**
 * Get CSRF token from the server
 * @returns {Promise<string>} The CSRF token
 */
async function getCSRFToken() {
    try {
        const response = await fetch('/api/csrf-token', {
            credentials: 'include' // Include cookies for session
        });
        if (!response.ok) {
            throw new Error('Failed to get CSRF token');
        }
        const data = await response.json();
        return data.csrfToken;
    } catch (error) {
        console.error('Error getting CSRF token:', error);
        throw error;
    }
}

/**
 * Make a secure API request with CSRF token
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>} The fetch response
 */
async function secureApiRequest(url, options = {}) {
    try {
        // Only add CSRF token for non-GET requests
        if (options.method && options.method.toUpperCase() !== 'GET') {
            const csrfToken = await getCSRFToken();
            
            // If body is a JSON string, parse it, add token, and stringify again
            if (options.body && typeof options.body === 'string') {
                try {
                    const bodyData = JSON.parse(options.body);
                    bodyData.csrfToken = csrfToken;
                    options.body = JSON.stringify(bodyData);
                } catch (e) {
                    // If body is not JSON, add token as header instead
                    options.headers = {
                        ...options.headers,
                        'x-csrf-token': csrfToken
                    };
                }
            } else if (options.body && typeof options.body === 'object') {
                // If body is an object, add token directly
                options.body.csrfToken = csrfToken;
                if (!options.headers || !options.headers['Content-Type']) {
                    options.headers = {
                        ...options.headers,
                        'Content-Type': 'application/json'
                    };
                }
                options.body = JSON.stringify(options.body);
            } else {
                // No body, add token as header
                options.headers = {
                    ...options.headers,
                    'x-csrf-token': csrfToken
                };
            }
        }
        
        // Always include credentials for session cookies
        options.credentials = 'include';
        
        return await fetch(url, options);
    } catch (error) {
        console.error('Error making secure API request:', error);
        throw error;
    }
}

/**
 * Make a secure POST request with CSRF token
 * @param {string} url - The API endpoint URL
 * @param {Object} data - The data to send in the request body
 * @param {Object} headers - Additional headers
 * @returns {Promise<Response>} The fetch response
 */
async function securePost(url, data, headers = {}) {
    return secureApiRequest(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: data
    });
}

/**
 * Make a secure PUT request with CSRF token
 * @param {string} url - The API endpoint URL
 * @param {Object} data - The data to send in the request body
 * @param {Object} headers - Additional headers
 * @returns {Promise<Response>} The fetch response
 */
async function securePut(url, data, headers = {}) {
    return secureApiRequest(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: data
    });
}

/**
 * Make a secure DELETE request with CSRF token
 * @param {string} url - The API endpoint URL
 * @param {Object} headers - Additional headers
 * @returns {Promise<Response>} The fetch response
 */
async function secureDelete(url, headers = {}) {
    return secureApiRequest(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    });
}

// Export functions for use in other modules
if (typeof window !== 'undefined') {
    window.CSRFUtils = {
        getCSRFToken,
        secureApiRequest,
        securePost,
        securePut,
        secureDelete
    };
}

// Also support CommonJS exports for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getCSRFToken,
        secureApiRequest,
        securePost,
        securePut,
        secureDelete
    };
}
