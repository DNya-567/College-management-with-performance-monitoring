// Routes for auth endpoints only; delegates logic to controllers.
// Must NOT contain business logic, SQL, or auth verification.
const router = require("express").Router();
const { login, me, registerTeacher, registerStudent, registerHod, changePassword } = require("./auth.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

router.post("/login", login);
router.get("/me", authMiddleware, me);
router.post("/register/teacher", registerTeacher);
router.post("/register/student", registerStudent);
router.post("/register/hod", registerHod);

// Self-service password change — student, teacher, hod only
router.put(
  "/change-password",
  authMiddleware,
  requireRole(["student", "teacher", "hod"]),
  changePassword
);

module.exports = router;
