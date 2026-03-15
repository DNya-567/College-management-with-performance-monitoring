// Students routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const asyncHandler = require("../../utils/asyncHandler");
const {
  listStudents,
  getStudentById,
  getMyProfile,
} = require("./students.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");
const { validatePagination } = require("../../utils/pagination");

router.get(
  "/",
  authMiddleware,
  requireRole(["teacher", "admin", "hod"]),
  validatePagination,
  asyncHandler(listStudents)
);
router.get(
  "/me",
  authMiddleware,
  requireRole(["student"]),
  asyncHandler(getMyProfile)
);
router.get("/:id", asyncHandler(getStudentById));

module.exports = router;
