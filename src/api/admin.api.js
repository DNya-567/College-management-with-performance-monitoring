// Admin API calls only.
// Must NOT contain UI, routing, or auth state logic.
import { http } from "./http";

/** Dashboard: system-wide stats */
export const fetchAdminStats = () => http.get("/admin/stats");

/** Dashboard: recent activity */
export const fetchRecentActivity = () => http.get("/admin/recent-activity");

/** Users: list all with optional role filter */
export const fetchAllUsers = (role) =>
  http.get("/admin/users", { params: role ? { role } : {} });

/** Classes: list every class with teacher/subject/student count */
export const fetchAllClasses = () => http.get("/admin/classes");

/** Teachers: list all with department and class count */
export const fetchAllTeachers = () => http.get("/admin/teachers");

/** Students: list all with enrollment count */
export const fetchAllStudents = () => http.get("/admin/students");

/** Departments: list all with HOD info */
export const fetchAllDepartments = () => http.get("/admin/departments");

/** Departments: create */
export const createDepartment = (payload) =>
  http.post("/admin/departments", payload);

/** Departments: update name */
export const updateDepartment = (id, payload) =>
  http.put(`/admin/departments/${id}`, payload);

/** Departments: delete */
export const deleteDepartment = (id) =>
  http.delete(`/admin/departments/${id}`);

/** Departments: assign HOD */
export const assignHod = (departmentId, teacherId) =>
  http.put(`/admin/departments/${departmentId}/hod`, { teacher_id: teacherId });

// ── User CRUD ──

/** Reset a user's password */
export const resetUserPassword = (id, password) =>
  http.put(`/admin/users/${id}/reset-password`, { password });

/** Toggle user active/inactive status */
export const toggleUserStatus = (id) =>
  http.put(`/admin/users/${id}/toggle-status`);

/** Permanently delete a user */
export const deleteUser = (id) =>
  http.delete(`/admin/users/${id}`);

// ── Teacher CRUD ──

/** Reassign teacher to a different department */
export const updateTeacherDepartment = (teacherId, departmentId) =>
  http.put(`/admin/teachers/${teacherId}/department`, { department_id: departmentId });

// ── Audit Logs ──

/** Fetch recent audit logs */
export const fetchAuditLogs = (limit = 50) =>
  http.get("/admin/audit-logs", { params: { limit } });

