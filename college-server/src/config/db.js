// Database connection pool configuration for production scale
// Handles 50-100 concurrent connections with proper timeout handling and metrics
// Must NOT contain business logic — only connection config and pool setup
const { Pool } = require("pg");
const env = require("./env");
const logger = require("./logger");

const poolConfig = {
  ...(env.DATABASE_URL
    ? { connectionString: env.DATABASE_URL }
    : {
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
      }),
  ssl: env.isProduction ? { rejectUnauthorized: false } : false,

  // Connection pool settings
  max: env.isProduction ? 20 : 10,               // Neon free tier max is 20
  min: env.isProduction ? 2 : 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 30000,
  application_name: 'college-api',
};

const pool = new Pool(poolConfig);

// ─────────────────────────────────────────────────────────────────────────────
// Pool Event Handlers
// ─────────────────────────────────────────────────────────────────────────────

let hasLoggedConnect = false;
let poolWarningLogged = false;
let metricsCheckInterval = null;

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

pool.on("error", (err) => {
  logger.error("PostgreSQL pool error", {
    message: err.message,
    code: err.code,
    severity: err.severity
  });
});

pool.on("query", (query) => {
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

const startMetricsMonitoring = () => {
  if (env.isProduction) {
    metricsCheckInterval = setInterval(() => {
      const stats = getPoolStats();

      if (stats.utilizationPercent > 80 && !poolWarningLogged) {
        logger.warn("Database connection pool near capacity", stats);
        poolWarningLogged = true;
      }

      if (stats.utilizationPercent < 60 && poolWarningLogged) {
        logger.info("Database connection pool utilization normalized", stats);
        poolWarningLogged = false;
      }

      if (stats.idleConnections === 0) {
        logger.error("Database connection pool exhausted", {
          ...stats,
          action: "All connections in use, requests may queue"
        });
      }
    }, 60000);
  }
};

const stopMetricsMonitoring = () => {
  if (metricsCheckInterval) {
    clearInterval(metricsCheckInterval);
    metricsCheckInterval = null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Connection Resilience
// ─────────────────────────────────────────────────────────────────────────────

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

startMetricsMonitoring();

module.exports = pool;
module.exports.getPoolStats = getPoolStats;
module.exports.gracefulShutdown = gracefulShutdown;
module.exports.healthCheck = healthCheck;
module.exports.stopMetricsMonitoring = stopMetricsMonitoring;
