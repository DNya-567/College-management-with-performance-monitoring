// Apply database indexes on server startup (only in production)
// This ensures indexes are created before the system serves traffic
// Usage: Call this in server.js after database connection

const { applyIndexes } = require('./indexing');

/**
 * Initialize database indexes on startup
 * PRODUCTION: Indexes will be created on first deployment
 * DEVELOPMENT: Skipped (use manual admin endpoint)
 */
const initializeIndexes = async () => {
  try {
    const logger = require('../config/logger');
    const env = require('../config/env');

    // Only auto-create indexes in production
    if (!env.isProduction) {
      logger.info('Database indexing skipped (development mode)');
      logger.info('To create indexes manually, POST /api/admin/indexes/create (admin only)');
      return;
    }

    logger.info('Production mode: Initializing database indexes...');
    const result = await applyIndexes();

    if (result.success) {
      logger.info(`Database optimization complete: ${result.created} indexes created`);
    } else {
      logger.warn(`Database indexing partially completed: ${result.message}`);
    }
  } catch (error) {
    logger.error('Failed to initialize indexes on startup', {
      message: error.message,
      stack: error.stack
    });
    // Don't crash - continue with degraded performance
    logger.warn('Continuing with degraded performance - run POST /api/admin/indexes/create manually');
  }
};

module.exports = { initializeIndexes };

