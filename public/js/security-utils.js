/**
 * Security utility functions for client-side XSS prevention
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') {
    return str;
  }
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Sanitizes HTML content by removing dangerous tags and attributes
 * This is a basic sanitizer - for production use, consider using DOMPurify
 * @param {string} html - The HTML string to sanitize
 * @returns {string} - The sanitized HTML
 */
function sanitizeHtml(html) {
  if (typeof html !== 'string') {
    return html;
  }
  
  // Remove dangerous tags
  const dangerousTags = /<script[^>]*>.*?<\/script>/gi;
  const dangerousAttributes = /on\w+="[^"]*"/gi;
  const dangerousProtocols = /javascript:/gi;
  
  return html
    .replace(dangerousTags, '')
    .replace(dangerousAttributes, '')
    .replace(dangerousProtocols, '');
}

/**
 * Safely sets text content without HTML interpretation
 * @param {HTMLElement} element - The element to set text content on
 * @param {string} text - The text content to set
 */
function safeSetTextContent(element, text) {
  if (element && typeof text === 'string') {
    element.textContent = text;
  }
}

/**
 * Safely sets HTML content with basic sanitization
 * @param {HTMLElement} element - The element to set HTML content on
 * @param {string} html - The HTML content to set
 */
function safeSetHtmlContent(element, html) {
  if (element && typeof html === 'string') {
    element.innerHTML = sanitizeHtml(html);
  }
}

/**
 * Creates a safe HTML string with escaped content
 * @param {string} template - The HTML template with {{}} placeholders
 * @param {Object} data - The data to fill in the template
 * @returns {string} - The safe HTML string
 */
function createSafeHtml(template, data) {
  let result = template;
  
  for (const [key, value] of Object.entries(data)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(placeholder, escapeHtml(value));
  }
  
  return result;
}

// Export functions for use in other modules
window.SecurityUtils = {
  escapeHtml,
  sanitizeHtml,
  safeSetTextContent,
  safeSetHtmlContent,
  createSafeHtml
};