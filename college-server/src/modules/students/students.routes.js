// Students routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import {
  listStudents,
  getStudentById,
  getMyProfile,
} from './students.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';
import { validatePagination } from '../../utils/pagination.js';

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  requireRole(["teacher", "admin", "hod"]),
  validatePagination,
  asyncHandler(listStudents)
);
router.get(
  "/me",
  authMiddleware,
  requireRole(["student"]),
  asyncHandler(getMyProfile)
);
router.get("/:id", asyncHandler(getStudentById));

export default router;
