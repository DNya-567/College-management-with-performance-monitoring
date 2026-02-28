// UI-only page for viewing the student profile.
// Must NOT define routes or implement auth logic.
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AttendanceHeatmap from "../../components/attendance/AttendanceHeatmap";
import { getMyStudentProfile } from "../../api/students.api";
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

const StudentProfile = () => {
  const { scopeRef } = usePageAnimation();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { enrollments } = useStudentEnrollments();
  const [attendanceByClass, setAttendanceByClass] = useState({});
  const [attendanceError, setAttendanceError] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");

  const subjectTotals = useMemo(() => {
    return enrollments.map((item) => {
      const stats = buildStats(attendanceByClass[item.class_id] || []);
      return {
        classId: item.class_id,
        className: item.class_name,
        subjectName: item.subject_name,
        year: item.year,
        stats,
      };
    });
  }, [enrollments, attendanceByClass]);

  const selectedAttendance = useMemo(
    () => attendanceByClass[selectedClassId] || [],
    [attendanceByClass, selectedClassId]
  );

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await getMyStudentProfile();
        if (isMounted) {
          setStudent(response.data?.student || null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load profile.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch attendance per class when enrollments load
  useEffect(() => {
    let isMounted = true;

    const loadAttendance = async () => {
      if (enrollments.length === 0) return;

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
        setAttendanceError("");
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
          <h1 className="text-2xl font-semibold text-slate-900">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your student information at a glance.
          </p>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!loading && student && (
          <div className="anim-item grid gap-6 lg:grid-cols-2">
            {/* Basic info card */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Basic information
              </h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div>
                  <p className="text-xs uppercase text-slate-400">Name</p>
                  <p className="font-medium text-slate-900">{student.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Email</p>
                  <p className="font-medium text-slate-900">{student.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Roll No</p>
                  <p className="font-medium text-slate-900">{student.roll_no}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Class</p>
                  <p className="font-medium text-slate-900">
                    {student.class_id || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Year</p>
                  <p className="font-medium text-slate-900">{student.year}</p>
                </div>
              </div>
            </section>

            {/* Subject attendance totals */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Subject attendance totals
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Total attendance summary for each joined subject.
              </p>

              {attendanceError && (
                <p className="mt-4 text-sm text-red-600" role="alert">
                  {attendanceError}
                </p>
              )}

              {!attendanceError && subjectTotals.length === 0 && (
                <p className="mt-4 text-sm text-slate-500">
                  No joined classes yet.
                </p>
              )}

              {!attendanceError && subjectTotals.length > 0 && (
                <div className="mt-4 space-y-3">
                  {subjectTotals.map((item) => (
                    <div
                      key={item.classId}
                      className="rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {item.subjectName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.className} · Year {item.year}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {item.stats.rate}%
                        </span>
                      </div>
                      <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-[#0052FF]"
                          style={{ width: `${item.stats.rate}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Present {item.stats.present} / {item.stats.total}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Full-width heatmap card */}
        {!loading && student && enrollments.length > 0 && (
          <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Attendance heatmap
                </h2>
                <p className="text-sm text-slate-500">
                  GitHub-style view of your attendance over the last 6 months.
                </p>
              </div>
              <select
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#0052FF] focus:outline-none"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">Select class</option>
                {enrollments.map((c) => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.class_name} ({c.year})
                  </option>
                ))}
              </select>
            </div>
            {selectedClassId ? (
              <AttendanceHeatmap data={selectedAttendance} months={6} />
            ) : (
              <p className="text-sm text-slate-500">
                Select a class above to view the heatmap.
              </p>
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;

