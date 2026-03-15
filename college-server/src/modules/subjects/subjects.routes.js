// Subjects routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const asyncHandler = require("../../utils/asyncHandler");
const { listSubjects, createSubject } = require("./subjects.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

router.get("/", authMiddleware, asyncHandler(listSubjects));
router.post(
  "/",
  authMiddleware,
  requireRole(["teacher", "admin", "hod"]),
  asyncHandler(createSubject)
);

module.exports = router;
