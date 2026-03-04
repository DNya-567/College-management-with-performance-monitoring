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

