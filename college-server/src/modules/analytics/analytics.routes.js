// Analytics routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { getSubjectDifficulty } from '../marks/marks.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';

const router = express.Router();

router.get(
  "/analytics/subjects/hardest",
  authMiddleware,
  requireRole(["admin", "hod"]),
  asyncHandler(getSubjectDifficulty)
);

export default router;
