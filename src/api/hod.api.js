// HOD Teachers API: Manage and monitor teachers in the department
import { http } from "./http";

export const getTeachersByDepartment = (departmentId) =>
  http.get(`/departments/${departmentId}/teachers`);

export const getTeacherPerformance = (departmentId, teacherId) =>
  http.get(`/departments/${departmentId}/teacher/${teacherId}/performance`);

export const getTeacherClasses = (teacherId) =>
  http.get(`/teachers/${teacherId}/classes`);

