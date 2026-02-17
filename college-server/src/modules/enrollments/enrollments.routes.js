// Enrollments routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const {
  listEnrollmentRequests,
  approveEnrollment,
  rejectEnrollment,
  listMyClasses,
} = require("./enrollments.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

router.get(
  "/requests",
  authMiddleware,
  requireRole(["teacher"]),
  listEnrollmentRequests
);
router.post(
  "/:id/approve",
  authMiddleware,
  requireRole(["teacher"]),
  approveEnrollment
);
router.post(
  "/:id/reject",
  authMiddleware,
  requireRole(["teacher"]),
  rejectEnrollment
);
router.get(
  "/mine",
  authMiddleware,
  requireRole(["student"]),
  listMyClasses
);

module.exports = router;
