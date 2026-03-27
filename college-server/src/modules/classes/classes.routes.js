// Classes routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import {
  createClass,
  listMyClasses,
  listAvailableClasses,
  listApprovedStudents,
  listDepartmentClasses,
  getDepartmentStats,
} from './classes.controller.js';
import {
  requestEnrollment,
} from '../enrollments/enrollments.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';
import { validate, createClassSchema } from '../../utils/validation.js';
import { validatePagination } from '../../utils/pagination.js';

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(createClass)
);
router.get(
  "/mine",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(listMyClasses)
);
router.get(
  "/department/stats",
  authMiddleware,
  requireRole(["hod"]),
  asyncHandler(getDepartmentStats)
);
router.get(
  "/department",
  authMiddleware,
  requireRole(["hod"]),
  asyncHandler(listDepartmentClasses)
);
router.get(
  "/",
  authMiddleware,
  requireRole(["student"]),
  validatePagination,
  asyncHandler(listAvailableClasses)
);
router.post(
  "/:classId/join",
  authMiddleware,
  requireRole(["student"]),
  asyncHandler(requestEnrollment)
);
router.get(
  "/:classId/students",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  listApprovedStudents
);

export default router;
