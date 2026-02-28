// Attendance API calls only.
// Must NOT contain UI, routing, or auth state logic.
import { http } from "./http";

export const listTopAttendance = (classId) =>
  http.get(`/classes/${classId}/attendance/top`);

export const listMyAttendance = (classId) =>
  http.get(`/classes/${classId}/my-attendance`);

/** Fetch current student's attendance across all classes with optional date range. */
export const fetchMyAttendanceRange = (from, to) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return http.get("/attendance/me", { params });
};

/** Teacher: fetch a specific student's attendance history for a class. */
export const listStudentAttendanceForClass = (classId, studentId) =>
  http.get(`/classes/${classId}/attendance/student/${studentId}`);

/** Teacher: submit bulk attendance records (upsert) for a class on a date. */
export const submitClassAttendance = (classId, payload) =>
  http.post(`/classes/${classId}/attendance`, payload);

