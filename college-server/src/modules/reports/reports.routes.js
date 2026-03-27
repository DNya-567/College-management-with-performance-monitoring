// Reports routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';
import { generateReportCard } from './reports.controller.js';

const router = express.Router();

// Student & Teacher can download report cards (auth enforced in controller)
router.get(
  "/student/:studentId/reportcard",
  authMiddleware,
  requireRole(["student", "teacher"]),
  asyncHandler(generateReportCard)
);

export default router;

