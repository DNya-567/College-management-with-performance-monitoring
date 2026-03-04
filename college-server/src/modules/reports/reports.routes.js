// Reports routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");
const { generateReportCard } = require("./reports.controller");

// Student & Teacher can download report cards (auth enforced in controller)
router.get(
  "/student/:studentId/reportcard",
  authMiddleware,
  requireRole(["student", "teacher"]),
  generateReportCard
);

module.exports = router;

