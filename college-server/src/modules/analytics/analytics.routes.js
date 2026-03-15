// Analytics routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const asyncHandler = require("../../utils/asyncHandler");
const { getSubjectDifficulty } = require("../marks/marks.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

router.get(
  "/analytics/subjects/hardest",
  authMiddleware,
  requireRole(["admin", "hod"]),
  asyncHandler(getSubjectDifficulty)
);

module.exports = router;
