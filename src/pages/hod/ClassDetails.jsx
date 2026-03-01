// HOD Class Details: read-only view of a department class.
// Shows students, attendance summary, marks summary — no edit actions.
// Must NOT define routes or API clients.
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { listApprovedStudents, listDepartmentClasses } from "../../api/classes.api";
import { fetchAttendanceSummary } from "../../api/attendance.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import { http } from "../../api/http";

export default function HodClassDetails() {
  const { classId } = useParams();
  const { scopeRef } = usePageAnimation();

  const [currentClass, setCurrentClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [marksSummary, setMarksSummary] = useState([]);
  const [marksLoading, setMarksLoading] = useState(false);

  // Load class info + students
  useEffect(() => {
    let isMounted = true;
    if (!classId) return;

    const load = async () => {
      try {
        const [classesRes, studentsRes] = await Promise.all([
          listDepartmentClasses(),
          listApprovedStudents(classId),
        ]);
        if (!isMounted) return;
        const match = (classesRes.data?.classes || []).find((c) => c.id === classId);
        setCurrentClass(match || null);
        setStudents(studentsRes.data?.students || []);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Failed to load class.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [classId]);

  // Load attendance summary
  useEffect(() => {
    let isMounted = true;
    if (!classId) return;
    setAttendanceLoading(true);
    const load = async () => {
      try {
        const res = await fetchAttendanceSummary(classId);
        if (isMounted) setAttendanceSummary(res.data?.summary || []);
      } catch { /* silent */ }
      finally { if (isMounted) setAttendanceLoading(false); }
    };
    load();
    return () => { isMounted = false; };
  }, [classId]);

  // Load marks
  useEffect(() => {
    let isMounted = true;
    if (!classId) return;
    setMarksLoading(true);
    const load = async () => {
      try {
        const res = await http.get(`/classes/${classId}/marks`);
        if (isMounted) setMarksSummary(res.data?.marks || []);
      } catch { /* silent */ }
      finally { if (isMounted) setMarksLoading(false); }
    };
    load();
    return () => { isMounted = false; };
  }, [classId]);

  const marksPerStudent = useMemo(() => {
    const map = {};
    marksSummary.forEach((m) => {
      if (!map[m.student_id]) {
        map[m.student_id] = { name: m.student_name, roll_no: m.roll_no, exams: 0, totalScore: 0, totalMax: 0 };
      }
      map[m.student_id].exams += 1;
      map[m.student_id].totalScore += Number(m.score) || 0;
      map[m.student_id].totalMax += Number(m.total_marks) || 0;
    });
    return Object.entries(map)
      .map(([id, data]) => ({
        student_id: id,
        ...data,
        avg_pct: data.totalMax > 0 ? Math.round((data.totalScore / data.totalMax) * 100) : 0,
      }))
      .sort((a, b) => String(a.roll_no || "").localeCompare(String(b.roll_no || ""), undefined, { numeric: true }));
  }, [marksSummary]);

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        {/* Header */}
        <div className="anim-item flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Department Class</p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {currentClass?.name || "Class details"}
            </h1>
          </div>
          <Link to="/hod/classes" className="text-sm font-medium text-[#0052FF]">
            Back to classes
          </Link>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        {!loading && !error && (
          <>
            {/* Row 1: Overview + Students */}
            <div className="anim-item grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-900">Name:</span> {currentClass?.name || "-"}</p>
                  <p><span className="font-medium text-slate-900">Subject:</span> {currentClass?.subject_name || "-"}</p>
                  <p><span className="font-medium text-slate-900">Teacher:</span> {currentClass?.teacher_name || "-"}</p>
                  <p><span className="font-medium text-slate-900">Year:</span> {currentClass?.year || "-"}</p>
                  <p><span className="font-medium text-slate-900">Students:</span> {students.length}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Approved Students</h2>
                {students.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No approved students yet.</p>
                ) : (
                  <ul className="mt-4 max-h-[320px] space-y-3 overflow-y-auto text-sm text-slate-700">
                    {students.map((s) => (
                      <li key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2">
                        <span className="font-medium text-slate-900">{s.name}</span>
                        <span className="text-xs text-slate-500">{s.roll_no}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Row 2: Attendance Summary */}
            <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Attendance Summary</h2>
              <p className="mt-1 text-sm text-slate-500">Per-student attendance rate for this class.</p>

              {attendanceLoading && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
              {!attendanceLoading && attendanceSummary.length === 0 && (
                <p className="mt-4 text-sm text-slate-500">No attendance records yet.</p>
              )}
              {!attendanceLoading && attendanceSummary.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Roll No</th>
                        <th className="px-3 py-2 font-medium">Present</th>
                        <th className="px-3 py-2 font-medium">Absent</th>
                        <th className="px-3 py-2 font-medium">Total</th>
                        <th className="px-3 py-2 font-medium">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceSummary.map((row) => (
                        <tr key={row.student_id} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-medium text-slate-900">{row.name}</td>
                          <td className="px-3 py-3 text-slate-600">{row.roll_no}</td>
                          <td className="px-3 py-3 text-green-600 font-medium">{row.present_count ?? 0}</td>
                          <td className="px-3 py-3 text-red-600 font-medium">{row.absent_count ?? 0}</td>
                          <td className="px-3 py-3 text-slate-600">{row.total_sessions ?? 0}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${Number(row.attendance_rate) >= 75 ? "bg-emerald-100 text-emerald-700" : Number(row.attendance_rate) >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                              {row.attendance_rate ?? 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Row 3: Marks Summary */}
            <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Marks Summary</h2>
              <p className="mt-1 text-sm text-slate-500">Per-student average marks across all exams.</p>

              {marksLoading && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
              {!marksLoading && marksPerStudent.length === 0 && (
                <p className="mt-4 text-sm text-slate-500">No marks entered yet.</p>
              )}
              {!marksLoading && marksPerStudent.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Roll No</th>
                        <th className="px-3 py-2 font-medium">Exams</th>
                        <th className="px-3 py-2 font-medium">Total Score</th>
                        <th className="px-3 py-2 font-medium">Avg %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marksPerStudent.map((row) => (
                        <tr key={row.student_id} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-medium text-slate-900">{row.name}</td>
                          <td className="px-3 py-3 text-slate-600">{row.roll_no}</td>
                          <td className="px-3 py-3 text-slate-600">{row.exams}</td>
                          <td className="px-3 py-3 text-slate-600">{row.totalScore}/{row.totalMax}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${row.avg_pct >= 60 ? "bg-emerald-100 text-emerald-700" : row.avg_pct >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                              {row.avg_pct}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

