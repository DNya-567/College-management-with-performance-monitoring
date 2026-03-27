// Centralized logging configuration using Winston
// Logs all application events to file and console
// Levels: error, warn, info, debug (only console in dev, file+console)

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const env = require('./env');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for timestamps
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: env.isDevelopment ? 'debug' : 'info',
  format: customFormat,
  defaultMeta: { service: 'college-api' },
  transports: [
    // Error log file (only errors)
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
      ),
    }),

    // Combined log file (all levels)
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
      ),
    }),
  ],
});

// Add console transport in development
if (env.isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Utility to log request/response lifecycle
logger.logRequest = (req, res, next) => {
  const start = Date.now();

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const meta = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      userId: req.user?.userId || 'anonymous',
      correlationId: req.correlationId,
    };

    if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.path} - ${res.statusCode}`, meta);
    } else {
      logger.info(`${req.method} ${req.path} - ${res.statusCode}`, meta);
    }
  });

  next();
};

// Utility to log errors with context
logger.logError = (error, context = {}) => {
  logger.error('Application error', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

// Utility to log database query execution and errors
// CRITICAL: Use this whenever executing db.query() to track failures
logger.logDbQuery = (success, query, params = [], error = null, context = {}) => {
  if (success) {
    logger.debug('Database query executed', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      paramsCount: params.length,
      ...context,
    });
  } else {
    logger.error('Database query failed', {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      params: params.map((p) => (typeof p === 'string' && p.length > 50 ? p.substring(0, 50) + '...' : p)),
      errorMessage: error.message,
      errorCode: error.code,
      errorDetail: error.detail,
      ...context,
    });
  }
};

module.exports = logger;

