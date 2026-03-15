// Classes routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const asyncHandler = require("../../utils/asyncHandler");
const {
  createClass,
  listMyClasses,
  listAvailableClasses,
  listApprovedStudents,
  listDepartmentClasses,
  getDepartmentStats,
} = require("./classes.controller");
const {
  requestEnrollment,
} = require("../enrollments/enrollments.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");
const { validate, createClassSchema } = require("../../utils/validation");
const { validatePagination } = require("../../utils/pagination");

router.post(
  "/",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(createClass)
);
router.get(
  "/mine",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(listMyClasses)
);
router.get(
  "/department/stats",
  authMiddleware,
  requireRole(["hod"]),
  asyncHandler(getDepartmentStats)
);
router.get(
  "/department",
  authMiddleware,
  requireRole(["hod"]),
  asyncHandler(listDepartmentClasses)
);
router.get(
  "/",
  authMiddleware,
  requireRole(["student"]),
  validatePagination,
  asyncHandler(listAvailableClasses)
);
router.post(
  "/:classId/join",
  authMiddleware,
  requireRole(["student"]),
  asyncHandler(requestEnrollment)
);
router.get(
  "/:classId/students",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  listApprovedStudents
);

module.exports = router;
