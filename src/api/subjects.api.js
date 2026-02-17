// Subjects API calls only.
import { http } from "./http";

export const listSubjects = () => http.get("/subjects");

export const createSubject = (payload) => http.post("/subjects", payload);

