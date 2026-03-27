// Departments routes: maps HTTP endpoints to controller functions.
// Public endpoint — used by registration forms to show department dropdown.
// HOD-only endpoints to manage teachers in their department.
// Must NOT include SQL, auth logic, or business logic.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';
import { listDepartments, getTeachersByDepartment, getTeacherPerformance } from './departments.controller.js';

const router = express.Router();

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

export default router;

