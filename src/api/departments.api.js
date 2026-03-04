// Departments API calls only.
// Must NOT contain UI, routing, or auth state logic.
import { http } from "./http";

export const listDepartments = () => http.get("/departments");

