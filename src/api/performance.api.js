// Performance API calls only.
// Must NOT contain UI, routing, or auth state logic.
import { http } from "./http";

/** Student: fetch own performance summary (avg score, attendance, rank, subjects) */
export const fetchMyPerformance = () => http.get("/performance/me");

/** Student: fetch exam-wise performance trend for line chart */
export const fetchMyTrend = () => http.get("/performance/me/trend");

/** Teacher: fetch class-wide performance (all students ranked) */
export const fetchClassPerformance = (classId) =>
  http.get(`/performance/class/${classId}`);

/** HOD: fetch department-wide per-class performance overview */
export const fetchDepartmentPerformance = () =>
  http.get("/performance/department");

