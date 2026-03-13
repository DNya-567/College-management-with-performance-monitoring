// Schedules routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business rules.
// Mounted at /api/schedules and /api/classes in app.js.
const router = require("express").Router();
const classRouter = require("express").Router({ mergeParams: true });
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");
const {
  createClassSchedule,
  updateClassSchedule,
  listClassSchedules,
  listMySchedules,
} = require("./schedules.controller");

// GET /api/schedules — role-aware listing for current user
router.get(
  "/",
  authMiddleware,
  requireRole(["student", "teacher", "hod"]),
  listMySchedules
);

// PATCH /api/schedules/:scheduleId — only teacher/hod can edit/cancel/reschedule
router.patch(
  "/:scheduleId",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  updateClassSchedule
);

// POST /api/classes/:classId/schedules — create schedule for a class
classRouter.post(
  "/:classId/schedules",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  createClassSchedule
);

// GET /api/classes/:classId/schedules — students can view, teacher/hod can manage
classRouter.get(
  "/:classId/schedules",
  authMiddleware,
  requireRole(["student", "teacher", "hod"]),
  listClassSchedules
);

module.exports = router;
module.exports.classRouter = classRouter;

