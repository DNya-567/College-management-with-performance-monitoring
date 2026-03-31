// Marks API calls only.
import { http } from "./http";

// Student marks APIs
export const listMyMarks = (params) => http.get("/marks/me", { params });
export const listMyMarksByClass = (classId) => http.get(`/classes/${classId}/my-marks`);

// Teacher marks APIs
export const listMarksByClass = (classId, semesterId) => {
  const params = semesterId ? { semester_id: semesterId } : {};
  return http.get(`/classes/${classId}/marks`, { params });
};
export const createMark = (data) => http.post("/marks", data);
export const createClassMark = (classId, data) => http.post(`/classes/${classId}/marks`, data);
export const updateMark = (id, data) => http.put(`/marks/${id}`, data);

// HOD marks APIs
export const getSubjectDifficulty = () => http.get("/marks/difficulty");

