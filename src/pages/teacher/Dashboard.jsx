import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useTeacherClasses } from "../../hooks/useTeacherClasses";
import { listTopAttendance } from "../../api/attendance.api";
import { fetchClassPerformance } from "../../api/performance.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";

// Teacher Dashboard: landing page for teacher role
// Responsibility: show quick actions for teachers
// Must NOT fetch data or contain business logic

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { classes } = useTeacherClasses();
  const { scopeRef } = usePageAnimation();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [topStudents, setTopStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Class performance state
  const [classPerf, setClassPerf] = useState([]);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState("");

  // Compute failed students: score < 20% OR attendance < 30%
  const failedStudents = useMemo(() => {
    return classPerf
      .filter((s) => s.avg_score < 20 || s.attendance_pct < 30)
      .map((s) => ({
        ...s,
        failedByMarks: s.avg_score < 20,
        failedByAttendance: s.attendance_pct < 30,
      }));
  }, [classPerf]);

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  // Auto-select first class when classes load
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    let isMounted = true;

    const loadTopAttendance = async () => {
      if (!selectedClassId) {
        if (isMounted) setTopStudents([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await listTopAttendance(selectedClassId);
        if (isMounted) {
          setTopStudents(response.data?.students || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load attendance.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadTopAttendance();

    return () => {
      isMounted = false;
    };
  }, [selectedClassId]);

  // Load class performance when class changes
  useEffect(() => {
    let isMounted = true;

    const loadClassPerf = async () => {
      if (!selectedClassId) {
        if (isMounted) setClassPerf([]);
        return;
      }

      setPerfLoading(true);
      setPerfError("");

      try {
        const response = await fetchClassPerformance(selectedClassId);
        if (isMounted) setClassPerf(response.data?.students || []);
      } catch (err) {
        if (isMounted) {
          setPerfError(
            err.response?.data?.message || "Failed to load performance."
          );
        }
      } finally {
        if (isMounted) setPerfLoading(false);
      }
    };

    void loadClassPerf();

    return () => {
      isMounted = false;
    };
  }, [selectedClassId]);

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">
            Teacher Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">Quick actions</p>
        </div>

        <div className="anim-item flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/teacher/marks")}
            className="rounded-full bg-[#0052FF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
          >
            Enter Marks
          </button>

          <button
            onClick={() => navigate("/teacher/attendance")}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Attendance
          </button>
        </div>

        <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Top 5 attendance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedClass
                  ? `Class: ${selectedClass.name}`
                  : "Select a class to see attendance."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
              >
                <option value="">Select class</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.year})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    selectedClassId
                      ? `/teacher/attendance?classId=${selectedClassId}`
                      : "/teacher/attendance"
                  )
                }
                className="rounded-full bg-[#0052FF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
                disabled={!selectedClassId}
              >
                View full attendance
              </button>
            </div>
          </div>

          {loading && (
            <p className="mt-4 text-sm text-slate-500">Loading...</p>
          )}
          {error && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-3 py-2 font-medium">Sr No</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Roll No</th>
                    <th className="px-3 py-2 font-medium">Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.length === 0 ? (
                    <tr>
                      <td
                        className="px-3 py-4 text-sm text-slate-500"
                        colSpan={4}
                      >
                        No attendance data yet.
                      </td>
                    </tr>
                  ) : (
                    topStudents.map((student, index) => (
                      <tr key={student.id} className="border-b border-slate-100">
                        <td className="px-3 py-3 text-slate-500">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {student.name}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {student.roll_no}
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {student.attendance_rate ?? 0}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Class Performance ── */}
        {selectedClassId && (
          <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Class Performance
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedClass
                    ? `All students in ${selectedClass.name} — ranked by avg score`
                    : "Select a class above."}
                </p>
              </div>
            </div>

            {perfLoading && (
              <p className="text-sm text-slate-500">Loading performance…</p>
            )}
            {perfError && (
              <p className="text-sm text-red-600" role="alert">
                {perfError}
              </p>
            )}

            {!perfLoading && !perfError && (
              <div className="overflow-x-auto">
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
                    {classPerf.length === 0 ? (
                      <tr>
                        <td
                          className="px-3 py-4 text-sm text-slate-500"
                          colSpan={5}
                        >
                          No performance data yet.
                        </td>
                      </tr>
                    ) : (
                      classPerf.map((student) => (
                        <tr
                          key={student.student_id}
                          className="border-b border-slate-100"
                        >
                          <td className="px-3 py-3 text-slate-500">
                            {student.rank}
                          </td>
                          <td className="px-3 py-3 font-medium text-slate-900">
                            {student.name}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {student.roll_no}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                student.avg_score >= 60
                                  ? "bg-emerald-100 text-emerald-700"
                                  : student.avg_score >= 40
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {student.avg_score}%
                            </span>
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                student.attendance_pct >= 75
                                  ? "bg-blue-100 text-blue-700"
                                  : student.attendance_pct >= 50
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {student.attendance_pct}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── Failed Students ── */}
        {selectedClassId && !perfLoading && failedStudents.length > 0 && (
          <section className="anim-item rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="shrink-0 text-2xl leading-none">⚠️</span>
              <div>
                <h2 className="text-lg font-semibold text-red-800">
                  Failed Students
                </h2>
                <p className="text-sm text-red-600">
                  {failedStudents.length}{" "}
                  {failedStudents.length === 1 ? "student" : "students"}{" "}
                  {failedStudents.length === 1 ? "has" : "have"} failed due to
                  low marks (&lt;20%) or low attendance (&lt;30%).
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-red-200 text-red-700">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Roll No</th>
                    <th className="px-3 py-2 font-medium">Avg Score</th>
                    <th className="px-3 py-2 font-medium">Attendance</th>
                    <th className="px-3 py-2 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {failedStudents.map((student) => (
                    <tr
                      key={student.student_id}
                      className="border-b border-red-100 bg-white"
                    >
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {student.name}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {student.roll_no}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            student.failedByMarks
                              ? "bg-red-100 text-red-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {student.avg_score}%
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            student.failedByAttendance
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {student.attendance_pct}%
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {student.failedByMarks && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                              Low marks
                            </span>
                          )}
                          {student.failedByAttendance && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                              Low attendance
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
