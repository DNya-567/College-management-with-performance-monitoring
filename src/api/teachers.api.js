// Teachers API calls only.
import { http } from "./http";

export const getMyTeacherProfile = () => http.get("/teachers/me");

