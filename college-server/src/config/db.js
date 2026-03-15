// Database connection pool configuration for production scale
// Handles 50-100 concurrent connections with proper timeout handling and metrics
// Must NOT contain business logic — only connection config and pool setup
const { Pool } = require("pg");
const env = require("./env");
const logger = require("./logger");

// Pool configuration optimized for production
// - max: 50-100 connections depending on environment
// - idleTimeoutMillis: 30 seconds before closing idle connections
// - connectionTimeoutMillis: 5 second timeout for getting connection
// - statement_timeout: 30 seconds per query (prevents hanging queries)
const poolConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: env.isProduction ? { rejectUnauthorized: false } : false,

  // Connection pool settings
  max: env.isProduction ? 100 : 20,              // 100 for production, 20 for dev
  min: env.isProduction ? 10 : 2,                // Keep minimum connections ready
  idleTimeoutMillis: 30000,                      // Close idle connections after 30s
  connectionTimeoutMillis: 5000,                 // Timeout getting a connection after 5s

  // Query timeout (prevents queries hanging forever)
  statement_timeout: 30000,                      // 30 second query timeout

  // Connection validation
  application_name: 'college-api',
  replication: 'off',
};

const pool = new Pool(poolConfig);

// ─────────────────────────────────────────────────────────────────────────────
// Pool Event Handlers
// ─────────────────────────────────────────────────────────────────────────────

// Track connection events for metrics
let hasLoggedConnect = false;
let poolWarningLogged = false;
let metricsCheckInterval = null;

/**
 * Connection successful
 * Log once on first successful connection
 */
pool.on("connect", () => {
  if (!hasLoggedConnect) {
    logger.info("PostgreSQL connection pool initialized", {
      maxConnections: poolConfig.max,
      minConnections: poolConfig.min,
      environment: env.NODE_ENV
    });
    hasLoggedConnect = true;
  }
});

/**
 * Connection error (should not crash, just log)
 * Errors during checkout or query will be caught by query handlers
 */
pool.on("error", (err) => {
  logger.error("PostgreSQL pool error", {
    message: err.message,
    code: err.code,
    severity: err.severity
  });
  // Don't crash — let PM2/process manager handle restarts
});

/**
 * Query timeout or query error
 */
pool.on("query", (query) => {
  // This is optional — useful for debug logging in development
  if (!env.isProduction && query.text.length > 200) {
    logger.debug("Database query", {
      query: query.text.substring(0, 100) + "...",
      params: query.values ? query.values.length : 0
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Pool Metrics & Monitoring
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get current pool statistics
 * Returns metrics about pool usage
 */
const getPoolStats = () => {
  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingRequests: pool.waitingCount,
    activeConnections: pool.totalCount - pool.idleCount,
    utilizationPercent: Math.round(((pool.totalCount - pool.idleCount) / pool.totalCount) * 100),
    maxConnections: poolConfig.max,
    minConnections: poolConfig.min,
    isHealthy: pool.totalCount > 0 && pool.idleCount > 0
  };
};

/**
 * Log pool metrics periodically
 * Helps identify connection exhaustion issues
 */
const startMetricsMonitoring = () => {
  if (env.isProduction) {
    metricsCheckInterval = setInterval(() => {
      const stats = getPoolStats();

      // Warn if pool is getting full (>80% utilization)
      if (stats.utilizationPercent > 80 && !poolWarningLogged) {
        logger.warn("Database connection pool near capacity", stats);
        poolWarningLogged = true;
      }

      // Reset warning flag when utilization drops below 60%
      if (stats.utilizationPercent < 60 && poolWarningLogged) {
        logger.info("Database connection pool utilization normalized", stats);
        poolWarningLogged = false;
      }

      // Log critical state if pool exhausted
      if (stats.idleConnections === 0) {
        logger.error("Database connection pool exhausted", {
          ...stats,
          action: "All connections in use, requests may queue"
        });
      }
    }, 60000); // Check every 60 seconds
  }
};

/**
 * Stop metrics monitoring
 * Call on server shutdown
 */
const stopMetricsMonitoring = () => {
  if (metricsCheckInterval) {
    clearInterval(metricsCheckInterval);
    metricsCheckInterval = null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Connection Resilience
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Graceful shutdown handler
 * Drain connections and close pool
 */
const gracefulShutdown = async () => {
  logger.info("Draining database connection pool...");
  stopMetricsMonitoring();

  try {
    await pool.end();
    logger.info("Database connection pool closed");
    return true;
  } catch (error) {
    logger.error("Error closing database pool", { message: error.message });
    return false;
  }
};

/**
 * Validate pool health
 * Used by health check endpoints
 */
const healthCheck = async () => {
  try {
    const result = await pool.query("SELECT 1 as health");
    const stats = getPoolStats();

    return {
      status: "healthy",
      database: "connected",
      stats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Start monitoring on load
startMetricsMonitoring();

module.exports = pool;
module.exports.getPoolStats = getPoolStats;
module.exports.gracefulShutdown = gracefulShutdown;
module.exports.healthCheck = healthCheck;
module.exports.stopMetricsMonitoring = stopMetricsMonitoring;
