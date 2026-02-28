// Performance routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const {
  getMyPerformance,
  getClassPerformance,
  getMyTrend,
} = require("./performance.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

// Student: own performance summary (avg score, attendance, rank, subjects)
router.get(
  "/performance/me",
  authMiddleware,
  requireRole(["student"]),
  getMyPerformance
);

// Student: exam-wise performance trend for line chart
router.get(
  "/performance/me/trend",
  authMiddleware,
  requireRole(["student"]),
  getMyTrend
);

// Teacher: class-wide performance table (all students ranked)
router.get(
  "/performance/class/:classId",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  getClassPerformance
);

module.exports = router;

