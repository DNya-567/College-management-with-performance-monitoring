// Admin routes: maps HTTP endpoints to admin controller functions.
// All routes are protected with admin-only access.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");
const {
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
} = require("./admin.controller");

// All admin routes require authentication + admin role
router.use(authMiddleware, requireRole(["admin"]));

// Dashboard stats
router.get("/stats", getSystemStats);

// Recent activity (announcements)
router.get("/recent-activity", getRecentActivity);

// Audit logs
router.get("/audit-logs", getAuditLogs);

// User management
router.get("/users", listAllUsers);
router.put("/users/:id/reset-password", resetUserPassword);
router.put("/users/:id/toggle-status", toggleUserStatus);
router.delete("/users/:id", deleteUser);

// Class overview (read-only)
router.get("/classes", listAllClasses);

// Teacher management
router.get("/teachers", listAllTeachers);
router.put("/teachers/:id/department", updateTeacherDepartment);

// Student management (read-only)
router.get("/students", listAllStudents);

// Department management (full CRUD)
router.get("/departments", listAllDepartments);
router.post("/departments", createDepartment);
router.put("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);
router.put("/departments/:id/hod", assignHod);

// Database Index Management (CRITICAL for production)
// POST to create all indexes (safe to run multiple times)
// GET to list or view stats
router.post("/indexes/create", createIndexes);
router.get("/indexes/list", listIndexes);
router.get("/indexes/stats", getIndexStats);

module.exports = router;

