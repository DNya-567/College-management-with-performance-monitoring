// This file only contains auth-related API calls.
import { http } from "./http";

export const login = (payload) => http.post("/auth/login", payload);

export const me = () => http.get("/auth/me");

export const logout = () => http.post("/auth/logout");

export const registerTeacher = (payload) =>
  http.post("/auth/register/teacher", payload);

export const registerStudent = (payload) =>
  http.post("/auth/register/student", payload);

export const registerHod = (payload) =>
  http.post("/auth/register/hod", payload);

/** Self-service password change (student, teacher, hod only) */
export const changePassword = (current_password, new_password) =>
  http.put("/auth/change-password", { current_password, new_password });

/**
 * Forgot password — public endpoint.
 * Sends a reset link to the given email if it exists in the system.
 * Always succeeds (no info leakage).
 */
export const forgotPassword = (email) =>
  http.post("/auth/forgot-password", { email });

/**
 * Reset password — public endpoint.
 * @param {string} token  The raw token from the email link query param.
 * @param {string} new_password  The new password chosen by the user.
 */
export const resetPassword = (token, new_password) =>
  http.post("/auth/reset-password", { token, new_password });

