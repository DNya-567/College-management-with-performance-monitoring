// Attendance routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const asyncHandler = require("../../utils/asyncHandler");
const {
  createAttendance,
  listAttendanceByDate,
  listMyAttendance,
  listTopAttendance,
  markAttendance,
  listMyAttendanceRange,
  listStudentAttendanceForClass,
  getAttendanceSummary,
} = require("./attendance.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");
const { validate, markAttendanceSchema } = require("../../utils/validation");

router.post(
  "/classes/:classId/attendance",
  authMiddleware,
  requireRole(["teacher"]),
  validate(markAttendanceSchema),
  asyncHandler(createAttendance)
);
router.get(
  "/classes/:classId/attendance",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(listAttendanceByDate)
);
router.get(
  "/classes/:classId/my-attendance",
  authMiddleware,
  requireRole(["student"]),
  asyncHandler(listMyAttendance)
);
router.get(
  "/classes/:classId/attendance/summary",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  asyncHandler(getAttendanceSummary)
);
router.get(
  "/classes/:classId/attendance/top",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(listTopAttendance)
);
router.get(
  "/classes/:classId/attendance/student/:studentId",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(listStudentAttendanceForClass)
);
router.post(
  "/attendance",
  authMiddleware,
  requireRole(["teacher", "admin"]),
  asyncHandler(markAttendance)
);
router.get(
  "/attendance/me",
  authMiddleware,
  requireRole(["student"]),
  asyncHandler(listMyAttendanceRange)
);

module.exports = router;
