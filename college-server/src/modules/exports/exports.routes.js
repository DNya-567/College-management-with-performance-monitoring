// Exports routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';
import {
  exportClassMarks,
  exportClassAttendance,
  exportDepartmentPerformance,
} from './exports.controller.js';

const router = express.Router();

// Teacher: export marks and attendance for their own classes
router.get(
  "/marks/:classId",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(exportClassMarks)
);

router.get(
  "/attendance/:classId",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(exportClassAttendance)
);

// HOD: export department-wide performance
router.get(
  "/department/:deptId",
  authMiddleware,
  requireRole(["hod"]),
  asyncHandler(exportDepartmentPerformance)
);

export default router;

