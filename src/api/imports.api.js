// Imports API calls only.
// Must NOT contain UI, routing, or auth state logic.
import { http } from "./http";

/** Admin: bulk import students from CSV */
export const importStudentsCSV = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return http.post("/imports/students", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/** Teacher: bulk import marks from CSV for a class */
export const importMarksCSV = (classId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return http.post(`/imports/marks/${classId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/** Download student CSV template */
export const downloadStudentTemplate = () =>
  http.get("/imports/templates/students", { responseType: "blob" });

/** Download marks CSV template */
export const downloadMarksTemplate = () =>
  http.get("/imports/templates/marks", { responseType: "blob" });

/** Trigger browser download from blob */
export const triggerCSVDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

