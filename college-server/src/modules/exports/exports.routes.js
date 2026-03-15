// Exports routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const asyncHandler = require("../../utils/asyncHandler");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");
const {
  exportClassMarks,
  exportClassAttendance,
  exportDepartmentPerformance,
} = require("./exports.controller");

// Teacher: export marks and attendance for their own classes
router.get(
  "/marks/:classId",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(exportClassMarks)
);

router.get(
  "/attendance/:classId",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(exportClassAttendance)
);

// HOD: export department-wide performance
router.get(
  "/department/:deptId",
  authMiddleware,
  requireRole(["hod"]),
  asyncHandler(exportDepartmentPerformance)
);

module.exports = router;

