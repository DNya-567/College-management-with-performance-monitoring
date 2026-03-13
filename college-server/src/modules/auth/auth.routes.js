// Routes for auth endpoints only; delegates logic to controllers.
// Must NOT contain business logic, SQL, or auth verification.
const router = require("express").Router();
const {
  login,
  me,
  registerTeacher,
  registerStudent,
  registerHod,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("./auth.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

router.post("/login", login);
router.get("/me", authMiddleware, me);
router.post("/register/teacher", registerTeacher);
router.post("/register/student", registerStudent);
router.post("/register/hod", registerHod);

// Self-service password change — student, teacher, hod only (requires current password)
router.put(
  "/change-password",
  authMiddleware,
  requireRole(["student", "teacher", "hod"]),
  changePassword
);

// Forgot password — public; accepts email, sends reset link
router.post("/forgot-password", forgotPassword);

// Reset password — public; accepts token + new password
router.post("/reset-password", resetPassword);

module.exports = router;


