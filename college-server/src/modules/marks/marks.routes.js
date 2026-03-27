// Marks routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import {
  createMark,
  listMarks,
  getMarkById,
  listMyMarks,
  createClassMark,
  listMarksByClass,
  listMyMarksByClass,
  updateMark,
} from './marks.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';
import { validate, createMarkSchema, updateMarkSchema } from '../../utils/validation.js';
import { validatePagination } from '../../utils/pagination.js';

const router = express.Router();

router.post(
  "/classes/:classId/marks",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(createClassMark)
);
router.get(
  "/classes/:classId/marks",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  asyncHandler(listMarksByClass)
);
router.get(
  "/classes/:classId/my-marks",
  authMiddleware,
  requireRole(["student"]),
  asyncHandler(listMyMarksByClass)
);

router.post(
  "/marks",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(createMark)
);
router.get(
  "/marks",
  authMiddleware,
  requireRole(["admin", "hod", "teacher"]),
  asyncHandler(listMarks)
);
router.get(
  "/marks/me",
  authMiddleware,
  requireRole(["student"]),
  validatePagination,
  asyncHandler(listMyMarks)
);
router.get(
  "/marks/:id",
  authMiddleware,
  requireRole(["admin", "hod", "teacher", "student"]),
  asyncHandler(getMarkById)
);
router.put(
  "/marks/:id",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(updateMark)
);

export default router;
