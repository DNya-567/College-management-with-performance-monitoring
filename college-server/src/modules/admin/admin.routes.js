// Admin routes: maps HTTP endpoints to admin controller functions.
// All routes are protected with admin-only access.
// Must NOT include SQL, auth logic, or business logic.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';
import {
  getSystemStats,
  listAllUsers,
  listAllClasses,
  listAllTeachers,
  listAllStudents,
  listAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignHod,
  getRecentActivity,
  resetUserPassword,
  toggleUserStatus,
  deleteUser,
  updateTeacherDepartment,
  getAuditLogs,
  createIndexes,
  listIndexes,
  getIndexStats,
} from './admin.controller.js';

// All admin routes require authentication + admin role
router.use(authMiddleware, requireRole(["admin"]));

// Dashboard stats
router.get("/stats", asyncHandler(getSystemStats));

// Recent activity (announcements)
router.get("/recent-activity", asyncHandler(getRecentActivity));

// Audit logs
router.get("/audit-logs", asyncHandler(getAuditLogs));

// User management
router.get("/users", asyncHandler(listAllUsers));
router.put("/users/:id/reset-password", asyncHandler(resetUserPassword));
router.put("/users/:id/toggle-status", asyncHandler(toggleUserStatus));
router.delete("/users/:id", asyncHandler(deleteUser));

// Class overview (read-only)
router.get("/classes", asyncHandler(listAllClasses));

// Teacher management
router.get("/teachers", asyncHandler(listAllTeachers));
router.put("/teachers/:id/department", asyncHandler(updateTeacherDepartment));

// Student management (read-only)
router.get("/students", asyncHandler(listAllStudents));

// Department management (full CRUD)
router.get("/departments", asyncHandler(listAllDepartments));
router.post("/departments", asyncHandler(createDepartment));
router.put("/departments/:id", asyncHandler(updateDepartment));
router.delete("/departments/:id", asyncHandler(deleteDepartment));
router.put("/departments/:id/hod", asyncHandler(assignHod));

// Database Index Management (CRITICAL for production)
// POST to create all indexes (safe to run multiple times)
// GET to list or view stats
router.post("/indexes/create", asyncHandler(createIndexes));
router.get("/indexes/list", asyncHandler(listIndexes));
router.get("/indexes/stats", asyncHandler(getIndexStats));

export default router;

