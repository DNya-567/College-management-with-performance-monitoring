// Enrollments routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const asyncHandler = require("../../utils/asyncHandler");
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
  asyncHandler(listEnrollmentRequests)
);
router.post(
  "/:id/approve",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  asyncHandler(approveEnrollment)
);
router.post(
  "/:id/reject",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  asyncHandler(rejectEnrollment)
);
router.get(
  "/mine",
  authMiddleware,
  requireRole(["student"]),
  asyncHandler(listMyClasses)
);
router.get(
  "/pending",
  authMiddleware,
  requireRole(["student"]),
  asyncHandler(listMyPendingClasses)
);

module.exports = router;
