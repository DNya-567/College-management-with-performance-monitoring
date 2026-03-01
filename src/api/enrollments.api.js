// Enrollment API calls only.
import { http } from "./http";

export const listPendingEnrollments = () => http.get("/enrollments/pending");
export const listMyEnrollments = () => http.get("/enrollments/mine");
export const listEnrollmentRequests = () => http.get("/enrollments/requests");
export const approveEnrollment = (id) => http.post(`/enrollments/${id}/approve`);
export const rejectEnrollment = (id) => http.post(`/enrollments/${id}/reject`);
