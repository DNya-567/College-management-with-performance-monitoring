// UI-only page: GitHub-style attendance heatmap for students.
// Uses the API layer for data, reusable heatmap component for rendering.
// Must NOT define routes or implement auth/token logic.
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AttendanceHeatmap from "../../components/attendance/AttendanceHeatmap";
import { listMyAttendance } from "../../api/attendance.api";
import { useStudentEnrollments } from "../../hooks/useStudentEnrollments";

const MyAttendance = () => {
  const { enrollments } = useStudentEnrollments();
  const [classId, setClassId] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Auto-select first class when enrollments load
  useEffect(() => {
    if (enrollments.length > 0 && !classId) {
      setClassId(enrollments[0].class_id);
      setLoading(false);
    } else if (enrollments.length === 0) {
      setLoading(false);
    }
  }, [enrollments, classId]);

  // Load attendance for the selected class
  useEffect(() => {
    let isMounted = true;
    if (!classId) { setAttendance([]); return; }
    const load = async () => {
      try {
        const res = await listMyAttendance(classId);
        if (isMounted) setAttendance(res.data?.attendance || []);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Failed to load attendance.");
      }
    };
    load();
    return () => { isMounted = false; };
  }, [classId]);

  // Stats
  const stats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter((r) => r.status === "present").length;
    const absent = attendance.filter((r) => r.status === "absent").length;
    const late = attendance.filter((r) => r.status === "late").length;
    const rate = total ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, rate };
  }, [attendance]);

  const selectedClass = useMemo(
    () => enrollments.find((c) => c.class_id === classId),
    [enrollments, classId]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">My Attendance</h1>
            <p className="mt-1 text-sm text-slate-500">Visual overview of your class attendance.</p>
          </div>
          <select
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-[#0052FF] focus:outline-none"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">Select class</option>
            {enrollments.map((c) => (
              <option key={c.class_id} value={c.class_id}>
                {c.class_name} ({c.year})
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        {!loading && !error && classId && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Present", value: stats.present, color: "text-green-600" },
                { label: "Absent", value: stats.absent, color: "text-red-600" },
                { label: "Late", value: stats.late, color: "text-yellow-600" },
                { label: "Attendance", value: `${stats.rate}%`, color: "text-[#0052FF]" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-xs font-medium uppercase text-slate-400">{s.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Heatmap */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedClass?.class_name || "Class"} — last 6 months
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedClass?.subject_name} · {selectedClass?.teacher_name}
                </p>
              </div>
              <AttendanceHeatmap data={attendance} months={6} />
            </div>
          </>
        )}

        {!loading && !error && !classId && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">Select a class above to view your attendance heatmap.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyAttendance;
