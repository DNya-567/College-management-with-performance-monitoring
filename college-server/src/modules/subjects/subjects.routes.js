// Subjects routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { listSubjects, createSubject } from './subjects.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';

const router = express.Router();

router.get("/", authMiddleware, asyncHandler(listSubjects));
router.post(
  "/",
  authMiddleware,
  requireRole(["teacher", "admin", "hod"]),
  asyncHandler(createSubject)
);
export default router;
