// HOD Performance: department-wide per-class performance overview.
// Click a class row to drill into individual student performance.
// Must NOT define routes or API clients.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { fetchDepartmentPerformance, fetchClassPerformance } from "../../api/performance.api";
import { getMyTeacherProfile } from "../../api/teachers.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import { useSemester } from "../../hooks/useSemester";
import SemesterSelector from "../../components/ui/SemesterSelector";
import { exportDepartmentPerformance, triggerExcelDownload } from "../../api/exports.api";
import { FileSpreadsheet } from "lucide-react";

export default function HodPerformance() {
  const { scopeRef } = usePageAnimation();
  const { semesters, selectedSemesterId, setSelectedSemesterId, loading: semLoading } = useSemester();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [departmentId, setDepartmentId] = useState(null);
  const [exportingDept, setExportingDept] = useState(false);

  // Drill-down state
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classPerf, setClassPerf] = useState([]);
  const [drillLoading, setDrillLoading] = useState(false);

  // Fetch department ID on mount
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await getMyTeacherProfile();
        if (isMounted) setDepartmentId(res.data?.teacher?.department_id || null);
      } catch { /* silent */ }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetchDepartmentPerformance();
        if (isMounted) setClasses(res.data?.classes || []);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Failed to load performance.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const handleDrill = async (classId) => {
    if (selectedClassId === classId) {
      setSelectedClassId(null);
      setClassPerf([]);
      return;
    }
    setSelectedClassId(classId);
    setDrillLoading(true);
    try {
      const res = await fetchClassPerformance(classId);
      setClassPerf(res.data?.students || []);
    } catch {
      setClassPerf([]);
    } finally {
      setDrillLoading(false);
    }
  };

  const selectedClass = classes.find((c) => c.class_id === selectedClassId);

  const handleExportDepartment = async () => {
    if (!departmentId) return;
    try {
      setExportingDept(true);
      const res = await exportDepartmentPerformance(departmentId, selectedSemesterId);
      triggerExcelDownload(res.data, "Department_Performance.xlsx");
    } catch {
      setError("Failed to export department performance.");
    } finally {
      setExportingDept(false);
    }
  };

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Department Performance</h1>
            <p className="mt-1 text-sm text-slate-500">Per-class overview. Click a row to see individual students.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <SemesterSelector
              semesters={semesters}
              selectedId={selectedSemesterId}
              onChange={setSelectedSemesterId}
              loading={semLoading}
            />
            {departmentId && classes.length > 0 && (
              <button
                onClick={handleExportDepartment}
                disabled={exportingDept}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {exportingDept ? "Exporting..." : "Export to Excel"}
              </button>
            )}
          </div>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        {!loading && !error && classes.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">No performance data yet.</p>
          </div>
        )}

        {!loading && !error && classes.length > 0 && (
          <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-3 py-2 font-medium">Class</th>
                    <th className="px-3 py-2 font-medium">Subject</th>
                    <th className="px-3 py-2 font-medium">Teacher</th>
                    <th className="px-3 py-2 font-medium">Year</th>
                    <th className="px-3 py-2 font-medium">Students</th>
                    <th className="px-3 py-2 font-medium">Avg Score</th>
                    <th className="px-3 py-2 font-medium">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c) => (
                    <tr
                      key={c.class_id}
                      onClick={() => handleDrill(c.class_id)}
                      className={`cursor-pointer border-b border-slate-100 transition-colors ${
                        selectedClassId === c.class_id ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-3 py-3 font-medium text-slate-900">{c.class_name}</td>
                      <td className="px-3 py-3 text-slate-600">{c.subject_name}</td>
                      <td className="px-3 py-3 text-slate-600">{c.teacher_name}</td>
                      <td className="px-3 py-3 text-slate-600">{c.year}</td>
                      <td className="px-3 py-3 text-slate-600">{c.student_count}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          c.avg_score >= 60 ? "bg-emerald-100 text-emerald-700" : c.avg_score >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        }`}>{c.avg_score}%</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          c.attendance_pct >= 75 ? "bg-blue-100 text-blue-700" : c.attendance_pct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        }`}>{c.attendance_pct}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Drill-down: individual student performance */}
        {selectedClassId && (
          <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Student Breakdown — {selectedClass?.class_name || ""}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Individual student performance in this class.</p>

            {drillLoading && <p className="mt-4 text-sm text-slate-500">Loading…</p>}

            {!drillLoading && classPerf.length === 0 && (
              <p className="mt-4 text-sm text-slate-500">No student data yet.</p>
            )}

            {!drillLoading && classPerf.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-3 py-2 font-medium">Rank</th>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Roll No</th>
                      <th className="px-3 py-2 font-medium">Avg Score</th>
                      <th className="px-3 py-2 font-medium">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classPerf.map((s) => (
                      <tr key={s.student_id} className="border-b border-slate-100">
                        <td className="px-3 py-3 text-slate-500">{s.rank}</td>
                        <td className="px-3 py-3 font-medium text-slate-900">{s.name}</td>
                        <td className="px-3 py-3 text-slate-600">{s.roll_no}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${s.avg_score >= 60 ? "bg-emerald-100 text-emerald-700" : s.avg_score >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                            {s.avg_score}%
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${s.attendance_pct >= 75 ? "bg-blue-100 text-blue-700" : s.attendance_pct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                            {s.attendance_pct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

