const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");

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

const app = express();

// ── Security headers (XSS, clickjacking, MIME-sniffing protection) ──
app.use(helmet());

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
// General: 100 requests per minute per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use("/api", generalLimiter);

// Strict limiter for auth: 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

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

// ── 404 handler — must come AFTER all route mounts ──
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// ── Global error handler — must be the LAST middleware ──
// Express identifies error handlers by their 4-argument signature (err, req, res, next).
// Catches any unhandled throw/next(err) so the server never crashes silently.
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.stack || err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: env.isProduction ? "Internal server error." : err.message,
  });
});

module.exports = app;
