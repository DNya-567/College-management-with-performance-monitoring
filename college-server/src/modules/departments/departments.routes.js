// Departments routes: maps HTTP endpoints to controller functions.
// Public endpoint — used by registration forms to show department dropdown.
// HOD-only endpoints to manage teachers in their department.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");
const { listDepartments, getTeachersByDepartment, getTeacherPerformance } = require("./departments.controller");

// GET /api/departments — no auth required (needed for registration forms)
router.get("/", listDepartments);

// GET /api/departments/:departmentId/teachers — HOD-only: get all teachers in department
router.get(
  "/:departmentId/teachers",
  authMiddleware,
  requireRole(["hod", "admin"]),
  getTeachersByDepartment
);

// GET /api/teachers/:teacherId/performance — HOD-only: get teacher's class performance
router.get(
  "/teachers/:teacherId/performance",
  authMiddleware,
  requireRole(["hod", "admin"]),
  getTeacherPerformance
);

module.exports = router;

