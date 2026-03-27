// Routes for auth endpoints only; delegates logic to controllers.
// Must NOT contain business logic, SQL, or auth verification.
import express from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  login,
  me,
  registerTeacher,
  registerStudent,
  registerHod,
  changePassword,
  forgotPassword,
  resetPassword,
} from "./auth.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import requireRole from "../../middlewares/role.middleware.js";
import { validate, loginSchema, registerTeacherSchema, registerStudentSchema, forgotPasswordSchema, resetPasswordSchema } from "../../utils/validation.js";

const router = express.Router();

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


