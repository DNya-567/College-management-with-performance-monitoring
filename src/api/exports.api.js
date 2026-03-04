// Exports API calls only.
// Must NOT contain UI, routing, or auth state logic.
import { http } from "./http";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Download marks Excel for a class */
export const exportClassMarks = (classId, semesterId) => {
  const params = semesterId ? { semester_id: semesterId } : {};
  return http.get(`/exports/marks/${classId}`, { params, responseType: "blob" });
};

/** Download attendance Excel for a class */
export const exportClassAttendance = (classId, semesterId) => {
  const params = semesterId ? { semester_id: semesterId } : {};
  return http.get(`/exports/attendance/${classId}`, { params, responseType: "blob" });
};

/** Download department performance Excel (HOD only) */
export const exportDepartmentPerformance = (deptId, semesterId) => {
  const params = semesterId ? { semester_id: semesterId } : {};
  return http.get(`/exports/department/${deptId}`, { params, responseType: "blob" });
};

/** Trigger browser file download from a blob */
export const triggerExcelDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob], { type: XLSX_TYPE }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

