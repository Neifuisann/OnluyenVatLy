const crypto = require('crypto');
const { ValidationError } = require('./errorHandler');

/**
 * CSRF Protection Middleware
 * Implements token-based CSRF protection
 */

// Generate a CSRF token
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Get or create CSRF token for session
const getCSRFToken = (req) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }
  return req.session.csrfToken;
};

// Middleware to add CSRF token to requests
const addCSRFToken = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Generate token and add to response locals for templates
  const token = getCSRFToken(req);
  res.locals.csrfToken = token;
  
  // Add CSRF token to API responses
  const originalJson = res.json;
  res.json = function(data) {
    if (data && typeof data === 'object' && !data.csrfToken) {
      data.csrfToken = token;
    }
    return originalJson.call(this, data);
  };
  
  next();
};

// Middleware to validate CSRF token
const validateCSRFToken = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for certain public endpoints
  const skipPaths = [
    '/auth/student/login',
    '/auth/admin/login',
    '/webhooks/', // Supabase webhooks
    '/supabase/', // Supabase callbacks
    '/database/webhooks' // Database webhooks
  ];

  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  const sessionToken = req.session.csrfToken;
  const requestToken = req.body.csrfToken || req.headers['x-csrf-token'];
  
  if (!sessionToken) {
    throw new ValidationError('CSRF token not found in session');
  }
  
  if (!requestToken) {
    throw new ValidationError('CSRF token not provided');
  }
  
  // Use timing-safe comparison
  if (!crypto.timingSafeEqual(Buffer.from(sessionToken, 'hex'), Buffer.from(requestToken, 'hex'))) {
    throw new ValidationError('Invalid CSRF token');
  }
  
  next();
};

// Get CSRF token endpoint
const getCSRFTokenEndpoint = (req, res) => {
  const token = getCSRFToken(req);
  res.json({
    success: true,
    csrfToken: token
  });
};

module.exports = {
  generateCSRFToken,
  getCSRFToken,
  addCSRFToken,
  validateCSRFToken,
  getCSRFTokenEndpoint
};