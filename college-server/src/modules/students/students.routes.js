// Students routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const {
  createStudent,
  listStudents,
  getStudentById,
  getMyProfile,
} = require("./students.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

router.post("/", createStudent);
router.get(
  "/",
  authMiddleware,
  requireRole(["teacher", "admin", "hod"]),
  listStudents
);
router.get(
  "/me",
  authMiddleware,
  requireRole(["student"]),
  getMyProfile
);
router.get("/:id", getStudentById);

module.exports = router;
