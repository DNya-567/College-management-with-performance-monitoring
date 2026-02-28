import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AttendanceHeatmap from "../../components/attendance/AttendanceHeatmap";
import { useStudentEnrollments } from "../../hooks/useStudentEnrollments";
import { listMyAttendance } from "../../api/attendance.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";

const buildStats = (attendance) => {
  const total = attendance.length;
  const present = attendance.filter((item) => item.status === "present").length;
  const absent = total - present;
  const rate = total ? Math.round((present / total) * 100) : 0;
  return { total, present, absent, rate };
};

export default function StudentDashboard() {
  const { enrollments } = useStudentEnrollments();
  const { scopeRef } = usePageAnimation();
  const [attendanceByClass, setAttendanceByClass] = useState({});
  const [selectedClassId, setSelectedClassId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rankedClasses = useMemo(() => {
    return enrollments
      .map((item) => {
        const stats = buildStats(attendanceByClass[item.class_id] || []);
        return { ...item, stats };
      })
      .sort((a, b) => b.stats.rate - a.stats.rate);
  }, [enrollments, attendanceByClass]);

  const selectedClass = useMemo(
    () => enrollments.find((item) => item.class_id === selectedClassId) || null,
    [enrollments, selectedClassId]
  );

  const selectedAttendance = useMemo(
    () => attendanceByClass[selectedClassId] || [],
    [attendanceByClass, selectedClassId]
  );

  const selectedStats = useMemo(() => {
    if (!selectedClassId) return null;
    return buildStats(selectedAttendance);
  }, [selectedAttendance, selectedClassId]);

  // Fetch attendance per class when enrollments load
  useEffect(() => {
    let isMounted = true;

    const loadAttendance = async () => {
      if (enrollments.length === 0) {
        if (isMounted) setLoading(false);
        return;
      }

      const nextAttendance = {};
      for (const item of enrollments) {
        if (!isMounted) return;
        try {
          const response = await listMyAttendance(item.class_id);
          nextAttendance[item.class_id] = response.data?.attendance || [];
        } catch {
          nextAttendance[item.class_id] = [];
        }
      }

      if (isMounted) {
        setSelectedClassId((prev) => prev || enrollments[0]?.class_id || "");
        setAttendanceByClass(nextAttendance);
        setLoading(false);
      }
    };

    void loadAttendance();

    return () => {
      isMounted = false;
    };
  }, [enrollments]);

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">
            Student Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Attendance overview for your joined classes.
          </p>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left card — ranking */}
            <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Attendance ranking
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Ranked by highest attendance rate.
              </p>

              {rankedClasses.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  No joined classes yet.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {rankedClasses.map((item, index) => (
                    <li
                      key={item.class_id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {index + 1}. {item.class_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.subject_name} · {item.teacher_name} · Year{" "}
                          {item.year}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {item.stats.rate}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Right card — heatmap */}
            <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Attendance heatmap
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Select a class to view the contribution graph.
                  </p>
                </div>
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#0052FF] focus:outline-none"
                  value={selectedClassId}
                  onChange={(event) => setSelectedClassId(event.target.value)}
                >
                  <option value="">Select class</option>
                  {enrollments.map((item) => (
                    <option key={item.class_id} value={item.class_id}>
                      {item.class_name} ({item.year})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedClassId && (
                <p className="mt-4 text-sm text-slate-500">
                  Pick a class to view the attendance heatmap.
                </p>
              )}

              {selectedClassId && selectedClass && selectedStats && (
                <div className="mt-4 space-y-4">
                  {/* Quick stats */}
                  <div className="flex gap-4 text-sm">
                    <div className="rounded-lg bg-green-50 px-3 py-1.5 font-medium text-green-700">
                      Present {selectedStats.present}
                    </div>
                    <div className="rounded-lg bg-red-50 px-3 py-1.5 font-medium text-red-700">
                      Absent {selectedStats.absent}
                    </div>
                    <div className="rounded-lg bg-blue-50 px-3 py-1.5 font-medium text-[#0052FF]">
                      Rate {selectedStats.rate}%
                    </div>
                  </div>

                  {/* Heatmap */}
                  <AttendanceHeatmap data={selectedAttendance} months={6} />
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
