// Schedules routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business rules.
// Mounted at /api/schedules and /api/classes in app.js.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';
import {
  createClassSchedule,
  updateClassSchedule,
  listClassSchedules,
  listMySchedules,
} from './schedules.controller.js';

const router = express.Router();
const classRouter = express.Router({ mergeParams: true });

// GET /api/schedules — role-aware listing for current user
router.get(
  "/",
  authMiddleware,
  requireRole(["student", "teacher", "hod"]),
  asyncHandler(listMySchedules)
);

// PATCH /api/schedules/:scheduleId — only teacher/hod can edit/cancel/reschedule
router.patch(
  "/:scheduleId",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  asyncHandler(updateClassSchedule)
);

// POST /api/classes/:classId/schedules — create schedule for a class
classRouter.post(
  "/:classId/schedules",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  asyncHandler(createClassSchedule)
);

// GET /api/classes/:classId/schedules — students can view, teacher/hod can manage
classRouter.get(
  "/:classId/schedules",
  authMiddleware,
  requireRole(["student", "teacher", "hod"]),
  asyncHandler(listClassSchedules)
);


export default router;
export { classRouter };
