const fs = require('fs');
const path = require('path');

/**
 * Simple logging utility
 */

class Logger {
  constructor() {
    // Check if we're in a serverless environment (like Vercel)
    this.isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;

    if (this.isServerless) {
      // In serverless environments, use /tmp directory or disable file logging
      this.logDir = '/tmp/logs';
      this.fileLoggingEnabled = false; // Disable file logging in serverless
    } else {
      this.logDir = path.join(__dirname, '../../logs');
      this.fileLoggingEnabled = true;
    }

    // Only try to create directory if file logging is enabled
    if (this.fileLoggingEnabled) {
      this.ensureLogDirectory();
    }
  }

  ensureLogDirectory() {
    if (this.fileLoggingEnabled && !fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
      } catch (error) {
        // If we can't create the directory, disable file logging
        console.warn('Failed to create log directory, disabling file logging:', error.message);
        this.fileLoggingEnabled = false;
      }
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}\n`;
  }

  writeToFile(filename, content) {
    if (!this.fileLoggingEnabled) {
      return; // Skip file writing in serverless environments
    }

    try {
      const filePath = path.join(this.logDir, filename);
      fs.appendFileSync(filePath, content);
    } catch (error) {
      // If file writing fails, disable it and warn
      console.warn('Failed to write to log file, disabling file logging:', error.message);
      this.fileLoggingEnabled = false;
    }
  }

  log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);

    // Always write to console
    console.log(formattedMessage.trim());

    // Write to file only if enabled
    if (this.fileLoggingEnabled) {
      const today = new Date().toISOString().split('T')[0];
      this.writeToFile(`app-${today}.log`, formattedMessage);

      // Write to level-specific file for errors and warnings
      if (level === 'error' || level === 'warn') {
        this.writeToFile(`${level}-${today}.log`, formattedMessage);
      }
    }
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, meta);
    }
  }

  // Log authentication events
  logAuth(event, details = {}) {
    this.info(`Auth Event: ${event}`, {
      event,
      ...details,
      timestamp: new Date().toISOString()
    });

    // Write to auth-specific log only if file logging is enabled
    if (this.fileLoggingEnabled) {
      const today = new Date().toISOString().split('T')[0];
      const authMessage = this.formatMessage('auth', `${event}`, details);
      this.writeToFile(`auth-${today}.log`, authMessage);
    }
  }

  // Log API requests
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };

    this.info(`${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`, logData);

    // Write to access log only if file logging is enabled
    if (this.fileLoggingEnabled) {
      const today = new Date().toISOString().split('T')[0];
      const accessMessage = this.formatMessage('access',
        `${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`,
        logData
      );
      this.writeToFile(`access-${today}.log`, accessMessage);
    }
  }

  // Log database operations
  logDatabase(operation, details = {}) {
    this.debug(`Database: ${operation}`, {
      operation,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // Log cache operations
  logCache(operation, key, details = {}) {
    this.debug(`Cache: ${operation} - ${key}`, {
      operation,
      key,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // Log file operations
  logFile(operation, filename, details = {}) {
    this.info(`File: ${operation} - ${filename}`, {
      operation,
      filename,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // Log rating updates
  logRating(studentId, change, details = {}) {
    this.info(`Rating Update: Student ${studentId} - ${change > 0 ? '+' : ''}${change}`, {
      studentId,
      ratingChange: change,
      ...details,
      timestamp: new Date().toISOString()
    });

    // Write to rating-specific log only if file logging is enabled
    if (this.fileLoggingEnabled) {
      const today = new Date().toISOString().split('T')[0];
      const ratingMessage = this.formatMessage('rating',
        `Student ${studentId} rating change: ${change > 0 ? '+' : ''}${change}`,
        { studentId, ratingChange: change, ...details }
      );
      this.writeToFile(`rating-${today}.log`, ratingMessage);
    }
  }

  // Clean old log files (keep last 30 days)
  cleanOldLogs() {
    // Skip cleaning in serverless environments or when file logging is disabled
    if (!this.fileLoggingEnabled) {
      return;
    }

    try {
      const files = fs.readdirSync(this.logDir);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          this.info(`Cleaned old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('Error cleaning old logs', { error: error.message });
    }
  }

  // Get log statistics
  getLogStats() {
    // Return null in serverless environments or when file logging is disabled
    if (!this.fileLoggingEnabled) {
      return {
        totalFiles: 0,
        totalSize: 0,
        filesByType: {},
        note: 'File logging disabled in serverless environment'
      };
    }

    try {
      const files = fs.readdirSync(this.logDir);
      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        filesByType: {}
      };

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const fileStats = fs.statSync(filePath);
        stats.totalSize += fileStats.size;

        const type = file.split('-')[0];
        if (!stats.filesByType[type]) {
          stats.filesByType[type] = { count: 0, size: 0 };
        }
        stats.filesByType[type].count++;
        stats.filesByType[type].size += fileStats.size;
      });

      return stats;
    } catch (error) {
      this.error('Error getting log stats', { error: error.message });
      return null;
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Clean old logs on startup (only if file logging is enabled)
if (logger.fileLoggingEnabled) {
  logger.cleanOldLogs();
}

module.exports = logger;
