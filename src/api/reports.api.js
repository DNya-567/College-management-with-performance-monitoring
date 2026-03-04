// Reports API calls only.
// Must NOT contain UI, routing, or auth state logic.
import { http } from "./http";

/**
 * Downloads a student report card as PDF.
 * Uses axios with responseType: "blob" to handle binary data.
 * Returns a Blob that can be turned into a download link.
 */
export const downloadReportCard = async (studentId, semesterId) => {
  const params = semesterId ? { semester_id: semesterId } : {};
  const res = await http.get(`/reports/student/${studentId}/reportcard`, {
    params,
    responseType: "blob",
  });
  return res;
};

/**
 * Triggers browser file download from a blob response.
 * @param {Blob} blob
 * @param {string} filename
 */
export const triggerDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

