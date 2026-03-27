// Health check endpoint for monitoring database and server health
// Used by load balancers, monitoring systems, and health dashboards

import express from 'express';
import db from '../config/db.js';
import logger from '../config/logger.js';

const router = express.Router();

/**
 * GET /health
 * Public health check endpoint (no auth required)
 * Returns server and database status
 * Used by: Docker healthchecks, load balancers, monitoring systems
 */
router.get('/', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    const poolStats = db.getPoolStats();

    // Determine overall status
    const isHealthy = dbHealth.status === 'healthy';

    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      server: {
        uptime: process.uptime(),
        memory: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
        environment: process.env.NODE_ENV
      },
      database: dbHealth,
      pool: poolStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check failed', { message: error.message });

    return res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health/ready
 * Kubernetes readiness probe
 * Returns 200 if service is ready to handle requests
 */
router.get('/ready', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    const isReady = dbHealth.status === 'healthy';

    return res.status(isReady ? 200 : 503).json({
      ready: isReady,
      database: isReady ? 'connected' : 'disconnected'
    });
  } catch (error) {
    return res.status(503).json({ ready: false, error: error.message });
  }
});

/**
 * GET /health/live
 * Kubernetes liveness probe
 * Returns 200 if server is alive (even if degraded)
 */
router.get('/live', (req, res) => {
  return res.status(200).json({
    alive: true,
    uptime: process.uptime()
  });
});

/**
 * GET /health/pool
 * Get detailed pool statistics
 * Admin/monitoring only
 */
router.get('/pool', (req, res) => {
  const stats = db.getPoolStats();

  return res.json({
    timestamp: new Date().toISOString(),
    pool: stats,
    recommendation: stats.utilizationPercent > 80
      ? 'Consider increasing max pool size or optimizing queries'
      : 'Pool health is good'
  });
});

export default router;

