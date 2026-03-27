// Enrollments routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import {
  listEnrollmentRequests,
  approveEnrollment,
  rejectEnrollment,
  listMyClasses,
  listMyPendingClasses,
} from './enrollments.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';

const router = express.Router();

router.get(
  "/requests",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  asyncHandler(listEnrollmentRequests)
);
router.post(
  "/:id/approve",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  asyncHandler(approveEnrollment)
);
router.post(
  "/:id/reject",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  asyncHandler(rejectEnrollment)
);
router.get(
  "/mine",
  authMiddleware,
  requireRole(["student"]),
  asyncHandler(listMyClasses)
);
router.get(
  "/pending",
  authMiddleware,
  requireRole(["student"]),
  asyncHandler(listMyPendingClasses)
);
export default router;
