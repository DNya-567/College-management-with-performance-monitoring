const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const env = require("./config/env");
const logger = require("./config/logger");
const {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  createUpdateLimiter,
  reportingLimiter,
  adminLimiter,
} = require("./config/rateLimiter");

const authRoutes = require("./modules/auth/auth.routes");
const marksRoutes = require("./modules/marks/marks.routes");
const classesRoutes = require("./modules/classes/classes.routes");
const enrollmentsRoutes = require("./modules/enrollments/enrollments.routes");
const attendanceRoutes = require("./modules/attendance/attendance.routes");
const subjectsRoutes = require("./modules/subjects/subjects.routes");
const teachersRoutes = require("./modules/teachers/teachers.routes");
const studentsRoutes = require("./modules/students/students.routes");
const announcementsRoutes = require("./modules/announcements/announcements.routes");
const { classRouter: announcementsClassRoutes } = require("./modules/announcements/announcements.routes");
const performanceRoutes = require("./modules/performance/performance.routes");
const departmentsRoutes = require("./modules/departments/departments.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const semestersRoutes = require("./modules/semesters/semesters.routes");
const reportsRoutes = require("./modules/reports/reports.routes");
const exportsRoutes = require("./modules/exports/exports.routes");
const importsRoutes = require("./modules/imports/imports.routes");
const schedulesRoutes = require("./modules/schedules/schedules.routes");
const { classRouter: schedulesClassRoutes } = require("./modules/schedules/schedules.routes");
const healthRoutes = require("./routes/health.routes");

const app = express();

// ── Security headers (XSS, clickjacking, MIME-sniffing protection) ──
app.use(helmet());

// ── Correlation ID for request tracing ──
const { v4: uuidv4 } = require('uuid');
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

module.exports = app;
