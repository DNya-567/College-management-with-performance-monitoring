// Classes routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
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

router.post(
  "/",
  authMiddleware,
  requireRole(["teacher"]),
  createClass
);
router.get(
  "/mine",
  authMiddleware,
  requireRole(["teacher"]),
  listMyClasses
);
router.get(
  "/department/stats",
  authMiddleware,
  requireRole(["hod"]),
  getDepartmentStats
);
router.get(
  "/department",
  authMiddleware,
  requireRole(["hod"]),
  listDepartmentClasses
);
router.get(
  "/",
  authMiddleware,
  requireRole(["student"]),
  listAvailableClasses
);
router.post(
  "/:classId/join",
  authMiddleware,
  requireRole(["student"]),
  requestEnrollment
);
router.get(
  "/:classId/students",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  listApprovedStudents
);

module.exports = router;
