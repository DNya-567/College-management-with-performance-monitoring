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
} = require("./admin.controller");

// All admin routes require authentication + admin role
router.use(authMiddleware, requireRole(["admin"]));

// Dashboard stats
router.get("/stats", getSystemStats);

// Recent activity (announcements)
router.get("/recent-activity", getRecentActivity);

// User management (read-only)
router.get("/users", listAllUsers);

// Class overview (read-only)
router.get("/classes", listAllClasses);

// Teacher management (read-only)
router.get("/teachers", listAllTeachers);

// Student management (read-only)
router.get("/students", listAllStudents);

// Department management (full CRUD)
router.get("/departments", listAllDepartments);
router.post("/departments", createDepartment);
router.put("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);
router.put("/departments/:id/hod", assignHod);

module.exports = router;

