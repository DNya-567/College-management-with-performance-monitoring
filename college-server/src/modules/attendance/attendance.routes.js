// Attendance routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const {
  createAttendance,
  listAttendanceByDate,
  listMyAttendance,
} = require("./attendance.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

router.post(
  "/classes/:classId/attendance",
  authMiddleware,
  requireRole(["teacher"]),
  createAttendance
);
router.get(
  "/classes/:classId/attendance",
  authMiddleware,
  requireRole(["teacher"]),
  listAttendanceByDate
);
router.get(
  "/classes/:classId/my-attendance",
  authMiddleware,
  requireRole(["student"]),
  listMyAttendance
);

module.exports = router;
