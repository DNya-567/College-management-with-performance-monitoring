// Departments routes: maps HTTP endpoints to controller functions.
// Public endpoint — used by registration forms to show department dropdown.
// HOD-only endpoints to manage teachers in their department.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const asyncHandler = require("../../utils/asyncHandler");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");
const { listDepartments, getTeachersByDepartment, getTeacherPerformance } = require("./departments.controller");

// GET /api/departments — no auth required (needed for registration forms)
router.get("/", asyncHandler(listDepartments));

// GET /api/departments/:departmentId/teachers — HOD-only: get all teachers in department
router.get(
  "/:departmentId/teachers",
  authMiddleware,
  requireRole(["hod", "admin"]),
  asyncHandler(getTeachersByDepartment)
);

// GET /api/departments/:departmentId/teacher/:teacherId/performance — HOD-only: get teacher's class performance
// Path changed to avoid conflicts with /:departmentId/teachers
router.get(
  "/:departmentId/teacher/:teacherId/performance",
  authMiddleware,
  requireRole(["hod", "admin"]),
  asyncHandler(getTeacherPerformance)
);

module.exports = router;

