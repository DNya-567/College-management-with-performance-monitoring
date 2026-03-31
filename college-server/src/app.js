import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import env from './config/env.js';
import logger from './config/logger.js';
import {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  createUpdateLimiter,
  reportingLimiter,
  adminLimiter,
} from './config/rateLimiter.js';

import authRoutes from './modules/auth/auth.routes.js';
import marksRoutes from './modules/marks/marks.routes.js';
import classesRoutes from './modules/classes/classes.routes.js';
import enrollmentsRoutes from './modules/enrollments/enrollments.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import subjectsRoutes from './modules/subjects/subjects.routes.js';
import teachersRoutes from './modules/teachers/teachers.routes.js';
import studentsRoutes from './modules/students/students.routes.js';
import announcementsRoutes from './modules/announcements/announcements.routes.js';
import { classRouter as announcementsClassRoutes } from './modules/announcements/announcements.routes.js';
import performanceRoutes from './modules/performance/performance.routes.js';
import departmentsRoutes from './modules/departments/departments.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import semestersRoutes from './modules/semesters/semesters.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import exportsRoutes from './modules/exports/exports.routes.js';
import importsRoutes from './modules/imports/imports.routes.js';
import schedulesRoutes from './modules/schedules/schedules.routes.js';
import { classRouter as schedulesClassRoutes } from './modules/schedules/schedules.routes.js';
import healthRoutes from './routes/health.routes.js';

const app = express();

// ── Security headers (XSS, clickjacking, MIME-sniffing protection) ──
app.use(helmet());

// ── Correlation ID for request tracing ──
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
});

// ── Request/Response logging ──
app.use(logger.logRequest);

// ── CORS — read allowed origins from env instead of hardcoding ──
const allowedOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ── Body parsing with size limit to prevent oversized payloads ──
app.use(express.json({ limit: "1mb" }));

// ── Rate limiting ──
// General API limiter: 100 requests/minute for all IPs
app.use("/api", generalLimiter);

// Strict auth limiter: 10 attempts/15 minutes for login/register/password reset
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

// Upload/Export limiter: 5 operations/minute (file operations are expensive)
app.use("/api/imports", uploadLimiter);
app.use("/api/exports", uploadLimiter);

// Create/Update limiter: 50 writes/minute
app.use("/api/marks", createUpdateLimiter);
app.use("/api/announcements", createUpdateLimiter);
app.use("/api/schedules", createUpdateLimiter);

// Reporting limiter: 30 reports/minute (heavy queries)
app.use("/api/reports", reportingLimiter);
app.use("/api/performance", reportingLimiter);

// Admin limiter: 200 requests/minute (higher limit for batch operations)
app.use("/api/admin", adminLimiter);

// ── Request logger (dev only — disabled in production) ──
if (env.isDevelopment) {
  app.use((req, _res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    next();
  });
}

// ── Health check ──
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ── Root route — API information (helps diagnose deployment issues) ──
app.get("/", (_req, res) => {
  res.json({
    message: "College Management System API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth/login",
      docs: "https://github.com/your-repo/docs",
    },
    environment: process.env.NODE_ENV || "development",
  });
});

// ── Debug CORS route (temporary) ──
app.get("/api/debug-cors", (_req, res) => {
  res.json({
    cors_origins: process.env.CORS_ORIGINS,
    node_env: process.env.NODE_ENV
  });
});

// ── Route mounts ──
app.use("/api/auth", authRoutes);
app.use("/api", marksRoutes);
app.use("/api/classes", classesRoutes);
app.use("/api/enrollments", enrollmentsRoutes);
app.use("/api", attendanceRoutes);
app.use("/api/subjects", subjectsRoutes);
app.use("/api/teachers", teachersRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/classes", announcementsClassRoutes);
app.use("/api", performanceRoutes);
app.use("/api/departments", departmentsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/semesters", semestersRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/exports", exportsRoutes);
app.use("/api/imports", importsRoutes);
app.use("/api/schedules", schedulesRoutes);
app.use("/api/classes", schedulesClassRoutes);

// ── Health check endpoints (public, no auth required) ──
// Used by load balancers, Kubernetes probes, monitoring systems
app.use("/health", healthRoutes);

// ── 404 handler — must come AFTER all route mounts ──
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// ── Global error handler — must be the LAST middleware ──
// Express identifies error handlers by their 4-argument signature (err, req, res, next).
// Catches any unhandled throw/next(err) so the server never crashes silently.
app.use((err, req, res, _next) => {
  logger.logError(err, {
    method: req.method,
    path: req.path,
    correlationId: req.correlationId,
    userId: req.user?.userId || 'anonymous',
  });

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: env.isProduction ? "Internal server error." : err.message,
    correlationId: req.correlationId,
  });
});

export default app;
