// Enrollments routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const {
  listEnrollmentRequests,
  approveEnrollment,
  rejectEnrollment,
  listMyClasses,
  listMyPendingClasses,
} = require("./enrollments.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

router.get(
  "/requests",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  listEnrollmentRequests
);
router.post(
  "/:id/approve",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  approveEnrollment
);
router.post(
  "/:id/reject",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  rejectEnrollment
);
router.get(
  "/mine",
  authMiddleware,
  requireRole(["student"]),
  listMyClasses
);
router.get(
  "/pending",
  authMiddleware,
  requireRole(["student"]),
  listMyPendingClasses
);

module.exports = router;
