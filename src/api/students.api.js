// Students API calls only.
import { http } from "./http";

export const listStudents = () => http.get("/students");

export const getMyStudentProfile = () => http.get("/students/me");

