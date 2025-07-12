const encryptionService = require('../services/encryptionService');
const sessionService = require('../services/sessionService');
const { ValidationError } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * Encryption Middleware for Test-Taking Application
 * Automatically encrypts responses and decrypts requests for sensitive endpoints
 */

/**
 * Get encryption context from session
 * @param {Object} req - Express request object
 * @returns {Object|null} Encryption context or null if not available
 */
const getEncryptionContext = (req) => {
  if (!req.session || !req.session.encryptionContext) {
    return null;
  }
  
  const context = req.session.encryptionContext;
  
  // Validate context age
  if (!encryptionService.isContextValid(context)) {
    logger.encryption('Encryption context expired, will regenerate');
    delete req.session.encryptionContext;
    return null;
  }
  
  return context;
};

/**
 * Create or get encryption context for session
 * @param {Object} req - Express request object
 * @returns {Object} Encryption context
 */
const ensureEncryptionContext = (req) => {
  let context = getEncryptionContext(req);
  
  if (!context) {
    // Generate new encryption context
    const sessionSecret = req.session.id || 'fallback-secret';
    context = encryptionService.generateSessionContext(req.sessionID, sessionSecret);
    
    // Store in session
    req.session.encryptionContext = context;
    
    logger.encryption(`Generated new encryption context for session: ${req.sessionID}`);
  }
  
  return context;
};

/**
 * Middleware to encrypt API responses
 * @param {Object} options - Encryption options
 * @returns {Function} Express middleware function
 */
const encryptResponse = (options = {}) => {
  const { 
    forceEncryption = false,
    skipEncryption = false,
    encryptionRequired = true 
  } = options;
  
  return (req, res, next) => {
    // Skip encryption if explicitly disabled
    if (skipEncryption) {
      return next();
    }
    
    // Check if user is authenticated (encryption requires session)
    const isAuthenticated = sessionService.isStudentAuthenticated(req) || 
                           sessionService.isAdminAuthenticated(req);
    
    if (!isAuthenticated && encryptionRequired) {
      logger.warn('Encryption required but user not authenticated');
      return res.status(401).json({
        error: 'Authentication required for encrypted content',
        message: 'Please log in to access this content'
      });
    }
    
    // Skip encryption for non-authenticated users if not forced
    if (!isAuthenticated && !forceEncryption) {
      return next();
    }
    
    try {
      // Get or create encryption context
      const context = ensureEncryptionContext(req);
      
      // Override res.json to encrypt responses
      const originalJson = res.json;
      res.json = function(data) {
        try {
          // Check if client supports encryption
          const acceptsEncryption = req.headers['x-accept-encryption'] === 'true';
          
          if (!acceptsEncryption && !forceEncryption) {
            logger.debug('Client does not support encryption, sending plain response');
            return originalJson.call(this, data);
          }
          
          // Encrypt the response data
          const encryptedResponse = encryptionService.encryptResponse(data, context.key);
          
          // Add encryption headers
          res.set({
            'X-Content-Encrypted': 'true',
            'X-Encryption-Version': '1.0',
            'X-Encryption-Algorithm': 'aes-256-cbc'
          });
          
          logger.encryption(`Encrypted response for ${req.method} ${req.path}`);
          return originalJson.call(this, encryptedResponse);

        } catch (error) {
          logger.error('Response encryption error', { error: error.message, path: req.path });
          
          // If encryption fails and it's required, return error
          if (encryptionRequired || forceEncryption) {
            return originalJson.call(this, {
              error: 'Encryption failed',
              message: 'Unable to encrypt response data'
            });
          }
          
          // Otherwise, send unencrypted response
          return originalJson.call(this, data);
        }
      };
      
      next();

    } catch (error) {
      logger.error('Encryption middleware error', { error: error.message, path: req.path });
      
      if (encryptionRequired || forceEncryption) {
        return res.status(500).json({
          error: 'Encryption setup failed',
          message: 'Unable to setup encryption for this request'
        });
      }
      
      next();
    }
  };
};

/**
 * Middleware to decrypt API requests
 * @param {Object} options - Decryption options
 * @returns {Function} Express middleware function
 */
const decryptRequest = (options = {}) => {
  const { 
    decryptionRequired = false,
    skipDecryption = false 
  } = options;
  
  return (req, res, next) => {
    // Skip decryption if explicitly disabled
    if (skipDecryption) {
      return next();
    }
    
    // Check if request contains encrypted data
    const isEncrypted = req.headers['x-content-encrypted'] === 'true' ||
                       encryptionService.isEncrypted(req.body);
    
    if (!isEncrypted) {
      // If decryption is required but data is not encrypted, return error
      if (decryptionRequired) {
        return res.status(400).json({
          error: 'Encrypted data required',
          message: 'This endpoint requires encrypted request data'
        });
      }
      
      return next();
    }
    
    try {
      // Get encryption context
      const context = getEncryptionContext(req);
      
      if (!context) {
        logger.error('No encryption context available for decryption', { path: req.path });
        return res.status(400).json({
          error: 'Decryption failed',
          message: 'No encryption context available'
        });
      }
      
      // Decrypt request body
      const decryptedData = encryptionService.decryptRequest(req.body, context.key);

      // Replace request body with decrypted data
      req.body = decryptedData;

      // If there's a CSRF token in headers, add it back to the body for validation
      const csrfToken = req.headers['x-csrf-token'];
      if (csrfToken && typeof req.body === 'object' && req.body !== null) {
        req.body.csrfToken = csrfToken;
      }
      
      logger.encryption(`Decrypted request for ${req.method} ${req.path}`);
      next();

    } catch (error) {
      logger.error('Request decryption error', { error: error.message, path: req.path });
      return res.status(400).json({
        error: 'Decryption failed',
        message: 'Unable to decrypt request data'
      });
    }
  };
};

/**
 * Combined middleware for both encryption and decryption
 * @param {Object} options - Combined options
 * @returns {Array} Array of middleware functions
 */
const encryptionMiddleware = (options = {}) => {
  return [
    decryptRequest(options),
    encryptResponse(options)
  ];
};

/**
 * Middleware specifically for quiz endpoints
 * High security encryption for test data
 */
const quizEncryptionMiddleware = encryptionMiddleware({
  forceEncryption: true,
  encryptionRequired: true,
  decryptionRequired: false // Allow both encrypted and plain requests for compatibility
});

/**
 * Middleware for lesson content
 * Encrypt lesson data including questions
 */
const lessonEncryptionMiddleware = encryptionMiddleware({
  forceEncryption: false,
  encryptionRequired: false,
  decryptionRequired: false
});

/**
 * Middleware for result submissions
 * Encrypt sensitive result data
 */
const resultEncryptionMiddleware = encryptionMiddleware({
  forceEncryption: true,
  encryptionRequired: true,
  decryptionRequired: false
});

/**
 * Middleware to rotate encryption keys
 * Should be called periodically or on specific events
 */
const rotateEncryptionKey = (req, res, next) => {
  try {
    const context = getEncryptionContext(req);
    
    if (context) {
      const sessionSecret = req.session.id || 'fallback-secret';
      const newContext = encryptionService.rotateSessionKey(context, sessionSecret);
      req.session.encryptionContext = newContext;
      
      console.log(`🔄 Rotated encryption key for session: ${req.sessionID}`);
    }
    
    next();
  } catch (error) {
    console.error('❌ Key rotation error:', error);
    next(); // Continue even if rotation fails
  }
};

module.exports = {
  encryptResponse,
  decryptRequest,
  encryptionMiddleware,
  quizEncryptionMiddleware,
  lessonEncryptionMiddleware,
  resultEncryptionMiddleware,
  rotateEncryptionKey,
  getEncryptionContext,
  ensureEncryptionContext
};
