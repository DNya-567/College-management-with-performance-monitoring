/**
 * Rate Limiting Configuration
 * ─────────────────────────────────────────────────────────────
 * This file centralizes all rate limiting rules for the API.
 * Rate limiting protects against:
 * - Brute force attacks (login, password reset)
 * - DoS attacks (overwhelming API with requests)
 * - Resource exhaustion (heavy DB queries, file uploads)
 * - Bot spam and API abuse
 *
 * Configuration:
 * - Uses express-rate-limit with in-memory store (suitable for single-instance)
 * - For multi-instance deployment, use redis store (not implemented here)
 * - Returns 429 Too Many Requests when limit exceeded
 * Logs rate limit violations for monitoring
 */

const rateLimit = require("express-rate-limit");
const logger = require("./logger");

/**
 * General API Limiter
 * ────────────────────
 * Applied to: /api/*
 * Limit: 100 requests per 60 seconds per IP
 * Purpose: Prevent general API abuse
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 seconds
  max: 100, // 100 requests per window
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: { message: "Too many requests, please try again later." },
  statusCode: 429,
  handler: (req, res) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.user?.userId || "anonymous",
    });
    res.status(429).json({
      message: "Too many requests, please try again later.",
      retryAfter: req.rateLimit.resetTime,
    });
  },
  skip: (req) => {
    // Skip rate limiting for health check and internal requests
    return req.path === "/api/health" || req.path === "/health";
  },
});

/**
 * Strict Auth Limiter (Login/Register/Password Reset)
 * ─────────────────────────────────────────────────────
 * Applied to: /api/auth/login, /api/auth/register, /api/auth/forgot-password, /api/auth/reset-password
 * Limit: 10 attempts per 15 minutes per IP
 * Purpose: Prevent brute force attacks on authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." },
  statusCode: 429,
  skipSuccessfulRequests: true, // Don't count successful logins against limit
  handler: (req, res) => {
    logger.warn("Auth rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
      email: req.body?.email || "unknown",
    });
    res.status(429).json({
      message: "Too many login attempts, please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Upload/Import Limiter
 * ──────────────────────
 * Applied to: /api/imports/*, /api/exports/*
 * Limit: 5 requests per 60 seconds per IP
 * Purpose: Prevent bulk upload/export abuse
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 seconds
  max: 5, // 5 uploads per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many file operations, please try again later." },
  statusCode: 429,
  handler: (req, res) => {
    logger.warn("Upload/Export rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.user?.userId || "anonymous",
    });
    res.status(429).json({
      message: "Too many file operations, please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Create/Update Limiter (POST, PUT, PATCH)
 * ─────────────────────────────────────────
 * Applied to: Write operations
 * Limit: 50 requests per 60 seconds per IP
 * Purpose: Prevent spam creation/updates while allowing reasonable usage
 */
const createUpdateLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 seconds
  max: 50, // 50 writes per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many write requests, please try again later." },
  statusCode: 429,
  handler: (req, res) => {
    logger.warn("Create/Update rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.user?.userId || "anonymous",
    });
    res.status(429).json({
      message: "Too many write requests, please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Reporting/Analytics Limiter
 * ────────────────────────────
 * Applied to: /api/reports/*, /api/performance/*, /api/analytics/*
 * Limit: 30 requests per 60 seconds per IP
 * Purpose: Heavy queries like reports and analytics require protection
 */
const reportingLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 seconds
  max: 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many reporting requests, please try again later." },
  statusCode: 429,
  handler: (req, res) => {
    logger.warn("Reporting rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.user?.userId || "anonymous",
    });
    res.status(429).json({
      message: "Too many reporting requests, please try again later.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Admin Operations Limiter
 * ────────────────────────
 * Applied to: /api/admin/*
 * Limit: 200 requests per 60 seconds per IP
 * Purpose: Admin operations need higher limits (batch processing, bulk imports)
 */
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 60 seconds
  max: 200, // 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Admin rate limit exceeded." },
  statusCode: 429,
  handler: (req, res) => {
    logger.warn("Admin rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userId: req.user?.userId || "anonymous",
    });
    res.status(429).json({
      message: "Admin rate limit exceeded.",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  createUpdateLimiter,
  reportingLimiter,
  adminLimiter,
};

