// Routes for auth endpoints only; delegates logic to controllers.
// Must NOT contain business logic, SQL, or auth verification.
const router = require("express").Router();
const asyncHandler = require("../../utils/asyncHandler");
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
const { validate, loginSchema, registerTeacherSchema, registerStudentSchema, forgotPasswordSchema, resetPasswordSchema } = require("../../utils/validation");

router.post("/login", validate(loginSchema), asyncHandler(login));
router.get("/me", authMiddleware, asyncHandler(me));
router.post("/register/teacher", validate(registerTeacherSchema), asyncHandler(registerTeacher));
router.post("/register/student", validate(registerStudentSchema), asyncHandler(registerStudent));
router.post("/register/hod", validate(registerTeacherSchema), asyncHandler(registerHod));

// Self-service password change — student, teacher, hod only (requires current password)
router.put(
  "/change-password",
  authMiddleware,
  requireRole(["student", "teacher", "hod"]),
  asyncHandler(changePassword)
);

// Forgot password — public; accepts email, sends reset link
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);

// Reset password — public; accepts token + new password
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

module.exports = router;


