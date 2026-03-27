// Semesters routes: maps HTTP endpoints to controller functions.
// GET /active is public to authenticated users; write ops are admin-only.
// Must NOT include SQL, auth logic, or business logic.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';
import { validate, createSemesterSchema } from '../../utils/validation.js';
import {
  listSemesters,
  getActiveSemester,
  createSemester,
  updateSemester,
  deleteSemester,
  setActiveSemester,
} from './semesters.controller.js';

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// Any authenticated user can read semesters
router.get("/", asyncHandler(listSemesters));
router.get("/active", asyncHandler(getActiveSemester));

// Admin-only write operations
router.post("/", requireRole(["admin"]), asyncHandler(createSemester));
router.put("/:id", requireRole(["admin"]), asyncHandler(updateSemester));
router.delete("/:id", requireRole(["admin"]), asyncHandler(deleteSemester));
router.put("/:id/activate", requireRole(["admin"]), asyncHandler(setActiveSemester));

export default router;

