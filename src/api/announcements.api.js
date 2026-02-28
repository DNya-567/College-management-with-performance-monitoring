// Announcements API calls only.
// Announcements are class-scoped: tied to a specific class.
import { http } from "./http";

/** GET /api/announcements — all announcements relevant to the current user */
export const listAnnouncements = () => http.get("/announcements");

/** GET /api/classes/:classId/announcements — announcements for a specific class */
export const listClassAnnouncements = (classId) =>
  http.get(`/classes/${classId}/announcements`);

/** POST /api/classes/:classId/announcements — teacher creates announcement for a class */
export const createClassAnnouncement = (classId, payload) =>
  http.post(`/classes/${classId}/announcements`, payload);

