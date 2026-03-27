// Teachers routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import { getMyProfile } from './teachers.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';

const router = express.Router();

router.get("/me", authMiddleware, requireRole(["teacher", "hod"]), asyncHandler(getMyProfile));

export default router;

