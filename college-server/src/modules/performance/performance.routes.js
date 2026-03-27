// Performance routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import {
  getMyPerformance,
  getClassPerformance,
  getMyTrend,
  getDepartmentPerformance,
} from './performance.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';

const router = express.Router();

// Student: own performance summary (avg score, attendance, rank, subjects)
router.get(
  "/performance/me",
  authMiddleware,
  requireRole(["student"]),
  getMyPerformance
);

// Student: exam-wise performance trend for line chart
router.get(
  "/performance/me/trend",
  authMiddleware,
  requireRole(["student"]),
  getMyTrend
);

// HOD: department-wide per-class performance overview
router.get(
  "/performance/department",
  authMiddleware,
  requireRole(["hod"]),
  asyncHandler(getDepartmentPerformance)
);

// Teacher: class-wide performance table (all students ranked)
router.get(
  "/performance/class/:classId",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  asyncHandler(getClassPerformance)
);

export default router;

