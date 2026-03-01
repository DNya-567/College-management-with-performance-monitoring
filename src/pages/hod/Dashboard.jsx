// HOD Dashboard: department overview with stats, class performance, and alerts.
// Must NOT define routes or API clients.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { listDepartmentClasses, fetchDepartmentStats } from "../../api/classes.api";
import { fetchClassPerformance } from "../../api/performance.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";

export default function HodDashboard() {
  const navigate = useNavigate();
  const { scopeRef } = usePageAnimation();

  // Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Department classes
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");

  // Class performance
  const [classPerf, setClassPerf] = useState([]);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState("");

  // Failed students: score < 20% OR attendance < 30%
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
    () => classes.find((c) => c.id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  // Load stats + classes
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [statsRes, classesRes] = await Promise.all([
          fetchDepartmentStats(),
          listDepartmentClasses(),
        ]);
        if (!isMounted) return;
        setStats(statsRes.data);
        const list = classesRes.data?.classes || [];
        setClasses(list);
        if (list.length > 0) setSelectedClassId(list[0].id);
      } catch {
        // silent
      } finally {
        if (isMounted) setStatsLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // Load class performance when selected class changes
  useEffect(() => {
    let isMounted = true;
    if (!selectedClassId) { setClassPerf([]); return; }

    setPerfLoading(true);
    setPerfError("");
    const load = async () => {
      try {
        const res = await fetchClassPerformance(selectedClassId);
        if (isMounted) setClassPerf(res.data?.students || []);
      } catch (err) {
        if (isMounted) setPerfError(err.response?.data?.message || "Failed to load performance.");
      } finally {
        if (isMounted) setPerfLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [selectedClassId]);

  const statCards = stats
    ? [
        { label: "Classes", value: stats.total_classes, color: "text-[#0052FF]", bg: "bg-blue-50" },
        { label: "Teachers", value: stats.total_teachers, color: "text-violet-600", bg: "bg-violet-50" },
        { label: "Students", value: stats.total_students, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Pending Requests", value: stats.pending_requests, color: "text-amber-600", bg: "bg-amber-50" },
      ]
    : [];

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">HOD Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Department overview and performance.</p>
        </div>

        {/* Quick actions */}
        <div className="anim-item flex flex-wrap gap-3">
          <button onClick={() => navigate("/hod/classes")} className="rounded-full bg-[#0052FF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600">
            Department Classes
          </button>
          <button onClick={() => navigate("/hod/requests")} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Enrollment Requests
          </button>
          <button onClick={() => navigate("/hod/performance")} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Performance Overview
          </button>
        </div>

        {/* Stat cards */}
        {statsLoading && <p className="text-sm text-slate-500">Loading stats…</p>}
        {!statsLoading && stats && (
          <div className="anim-item grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((card) => (
              <div key={card.label} className={`rounded-2xl border border-slate-200 ${card.bg} p-5 shadow-sm`}>
                <p className="text-xs font-medium uppercase text-slate-400">{card.label}</p>
                <p className={`mt-1 text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Class Performance */}
        <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Class Performance</h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedClass ? `${selectedClass.name} — ranked by avg score` : "Select a class."}
              </p>
            </div>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#0052FF] focus:outline-none"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.teacher_name} ({c.year})</option>
              ))}
            </select>
          </div>

          {perfLoading && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
          {perfError && <p className="mt-4 text-sm text-red-600">{perfError}</p>}

          {!perfLoading && !perfError && (
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
                  {classPerf.length === 0 ? (
                    <tr><td colSpan={5} className="px-3 py-4 text-sm text-slate-500">No performance data yet.</td></tr>
                  ) : (
                    classPerf.map((s) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Failed Students */}
        {selectedClassId && !perfLoading && failedStudents.length > 0 && (
          <section className="anim-item rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="shrink-0 text-2xl leading-none">⚠️</span>
              <div>
                <h2 className="text-lg font-semibold text-red-800">Failed Students</h2>
                <p className="text-sm text-red-600">
                  {failedStudents.length} student{failedStudents.length !== 1 ? "s" : ""} below threshold (marks &lt;20% or attendance &lt;30%).
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
                  {failedStudents.map((s) => (
                    <tr key={s.student_id} className="border-b border-red-100 bg-white">
                      <td className="px-3 py-3 font-medium text-slate-900">{s.name}</td>
                      <td className="px-3 py-3 text-slate-600">{s.roll_no}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${s.failedByMarks ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{s.avg_score}%</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${s.failedByAttendance ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{s.attendance_pct}%</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {s.failedByMarks && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Low marks</span>}
                          {s.failedByAttendance && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">Low attendance</span>}
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
