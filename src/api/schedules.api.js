// Schedules API calls only.
// Class-scoped endpoints are under /classes/:classId/schedules.
import { http } from "./http";

export const listMySchedules = () => http.get("/schedules");

export const listClassSchedules = (classId) =>
  http.get(`/classes/${classId}/schedules`);

export const createClassSchedule = (classId, payload) =>
  http.post(`/classes/${classId}/schedules`, payload);

export const updateSchedule = (scheduleId, payload) =>
  http.patch(`/schedules/${scheduleId}`, payload);

