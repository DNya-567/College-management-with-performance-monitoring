// Frontend logger utility for structured logging
// Logs important events to console with formatting
// In production, these could be sent to a logging service (e.g., Sentry)

const logLevels = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

// Format log message with timestamp and level
const formatMessage = (level, message, data) => {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase();

  return {
    timestamp,
    level: levelUpper,
    message,
    data,
  };
};

// Logger object with methods for each level
const logger = {
  error: (message, data = {}) => {
    const formatted = formatMessage(logLevels.ERROR, message, data);
    console.error(`[${formatted.timestamp}] ${formatted.level}: ${message}`, data);
    // In production: Send to error tracking service (Sentry, etc.)
    return formatted;
  },

  warn: (message, data = {}) => {
    const formatted = formatMessage(logLevels.WARN, message, data);
    console.warn(`[${formatted.timestamp}] ${formatted.level}: ${message}`, data);
    return formatted;
  },

  info: (message, data = {}) => {
    const formatted = formatMessage(logLevels.INFO, message, data);
    console.info(`[${formatted.timestamp}] ${formatted.level}: ${message}`, data);
    return formatted;
  },

  debug: (message, data = {}) => {
    if (import.meta.env.MODE === 'development') {
      const formatted = formatMessage(logLevels.DEBUG, message, data);
      console.debug(`[${formatted.timestamp}] ${formatted.level}: ${message}`, data);
      return formatted;
    }
  },

  // Log API call
  logApiCall: (method, endpoint, status, duration, error = null) => {
    const data = { method, endpoint, status, duration: `${duration}ms` };

    if (status >= 400) {
      logger.warn(`API ${method} ${endpoint}`, { ...data, error });
    } else {
      logger.info(`API ${method} ${endpoint}`, data);
    }
  },

  // Log auth event
  logAuthEvent: (event, data = {}) => {
    logger.info(`Auth: ${event}`, data);
  },

  // Log navigation
  logNavigation: (from, to) => {
    logger.debug(`Navigation: ${from} → ${to}`, { from, to });
  },
};

export default logger;

