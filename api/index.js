// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
// const { inject } = require('@vercel/analytics');

// Import configuration modules
const { sessionConfig, sessionStore } = require('./config/session');
const { UPLOAD_CONFIG } = require('./config/constants');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import route modules
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const lessonRoutes = require('./routes/lessons');
const ratingRoutes = require('./routes/ratings');
const uploadRoutes = require('./routes/uploads');
const resultRoutes = require('./routes/results');
const viewRoutes = require('./routes/views');
const galleryRoutes = require('./routes/gallery');
const quizRoutes = require('./routes/quiz');
const tagsRoutes = require('./routes/tags');
const explainRoutes = require('./routes/explain');
const adminRoutes = require('./routes/admin');
const historyRoutes = require('./routes/history');
const progressRoutes = require('./routes/progress');

// Import utilities
const logger = require('./utils/logger');

// Import services that need initialization
const sessionService = require('./services/sessionService');

const app = express();
const PORT = process.env.PORT || 3003;

// --- Global Error Handling ---
process.on('uncaughtException', (error) => {
  logger.error('FATAL: Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('FATAL: Unhandled Rejection', { reason, promise });
});
// --- End Global Error Handling ---

// Initialize Vercel Analytics
// inject();

// Set proper charset for all responses
app.use((req, res, next) => {
    res.charset = 'utf-8';
    next();
});

// Middleware to inject Speed Insights script
app.use((req, res, next) => {
    const originalSend = res.send;

    res.send = function(body) {
        // Only inject script into HTML responses
        if (typeof body === 'string' && body.includes('</head>')) {
            // Inject the Speed Insights script before the closing head tag
            const speedInsightsScript = '<script defer src="/_vercel/speed-insights/script.js"></script>';
            body = body.replace('</head>', `${speedInsightsScript}</head>`);
        }
        return originalSend.call(this, body);
    };

    next();
});

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const responseTime = Date.now() - start;
        logger.logRequest(req, res, responseTime);
    });

    next();
});

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true, parameterLimit: 50000 }));
app.use(express.static(path.join(process.cwd(), 'public'), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath);

        // Force no-cache for CSS and JS files to prevent theme issues
        if (ext === '.css' || ext === '.js') {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else if (ext === '.html') {
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        } else {
            // Images and other assets can be cached
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
        }
    }
}));

// Configure express-session
app.set('trust proxy', 1); // Trust first proxy, crucial for Vercel/Heroku/etc.
app.use(sessionConfig);

// Initialize session service with session store
sessionService.initialize(sessionStore);

// Add session cleanup middleware only for non-static routes
app.use((req, _res, next) => {
    // Skip session cleanup for static files and assets
    if (req.url.startsWith('/css/') ||
        req.url.startsWith('/js/') ||
        req.url.startsWith('/images/') ||
        req.url.startsWith('/favicon.ico')) {
        return next();
    }

    // Ensure session integrity for dynamic routes
    if (req.session) {
        sessionService.cleanupSession(req);
    }
    next();
});

// Add cache busting for theme changes
app.use((_req, res, next) => {
    // Add cache buster to prevent theme caching issues
    res.locals.cacheVersion = process.env.CACHE_VERSION || Date.now();
    next();
});

// Setup API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/explain', explainRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/progress', progressRoutes);

// Setup view routes (HTML pages) - Register early to avoid conflicts
app.use('/', viewRoutes);

// Duplicate auth routes removed - now handled by /api/auth/* routes

// Student info endpoints for session storage
app.get('/api/student-info', (req, res) => {
  const sessionData = sessionService.getSessionData(req);

  if (sessionData.studentId) {
    res.json({
      success: true,
      student: {
        id: sessionData.studentId,
        name: sessionData.studentName
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'No student session found'
    });
  }
});

// Student info session endpoint (for backward compatibility)
app.post('/api/student-info', (req, res) => {
    req.session.studentInfo = req.body;
    res.json({ success: true });
});

// Temporary cache clear endpoint for development
app.get('/api/clear-cache', (_req, res) => {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
    res.json({ message: 'Cache cleared' });
});

// View routes already registered above

// 404 handler for unmatched routes
app.use('*', (req, res) => {
    logger.warn('404 Not Found', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(404).json({
            success: false,
            message: 'Route not found'
        });
    } else {
        res.status(404).sendFile(path.join(process.cwd(), 'views', '404.html'));
    }
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

module.exports = app;