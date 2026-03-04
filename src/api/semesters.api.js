// Semesters API calls only.
// Must NOT contain UI, routing, or auth state logic.
import { http } from "./http";

/** List all semesters */
export const fetchSemesters = () => http.get("/semesters");

/** Get the currently active semester */
export const fetchActiveSemester = () => http.get("/semesters/active");

/** Create a new semester (admin only) */
export const createSemester = (payload) => http.post("/semesters", payload);

/** Update a semester (admin only) */
export const updateSemester = (id, payload) => http.put(`/semesters/${id}`, payload);

/** Delete a semester (admin only) */
export const deleteSemester = (id) => http.delete(`/semesters/${id}`);

/** Set a semester as active (admin only) */
export const activateSemester = (id) => http.put(`/semesters/${id}/activate`);

