// Attendance routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import {
  createAttendance,
  listAttendanceByDate,
  listMyAttendance,
  listTopAttendance,
  markAttendance,
  listMyAttendanceRange,
  listStudentAttendanceForClass,
  getAttendanceSummary,
} from './attendance.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';
import { validate, markAttendanceSchema } from '../../utils/validation.js';

const router = express.Router();

router.post(
  "/classes/:classId/attendance",
  authMiddleware,
  requireRole(["teacher"]),
  validate(markAttendanceSchema),
  asyncHandler(createAttendance)
);
router.get(
  "/classes/:classId/attendance",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(listAttendanceByDate)
);
router.get(
  "/classes/:classId/my-attendance",
  authMiddleware,
  requireRole(["student"]),
  asyncHandler(listMyAttendance)
);
router.get(
  "/classes/:classId/attendance/summary",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  asyncHandler(getAttendanceSummary)
);
router.get(
  "/classes/:classId/attendance/top",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(listTopAttendance)
);
router.get(
  "/classes/:classId/attendance/student/:studentId",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(listStudentAttendanceForClass)
);
router.post(
  "/attendance",
  authMiddleware,
  requireRole(["teacher", "admin"]),
  asyncHandler(markAttendance)
);
router.get(
  "/attendance/me",
  authMiddleware,
  requireRole(["student"]),
  asyncHandler(listMyAttendanceRange)
);

export default router;
