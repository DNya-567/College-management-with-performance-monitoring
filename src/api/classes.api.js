// Classes API calls only.
import { http } from "./http";

export const listMyClasses = () => http.get("/classes/mine");

export const createClass = (payload) => http.post("/classes", payload);

export const listApprovedStudents = (classId) =>
  http.get(`/classes/${classId}/students`);
