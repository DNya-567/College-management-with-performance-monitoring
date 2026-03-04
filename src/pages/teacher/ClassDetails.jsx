// UI-only page for viewing a single class and its sections.
// Must NOT define routes or implement auth logic.
import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { listApprovedStudents } from "../../api/classes.api";
import { fetchAttendanceSummary } from "../../api/attendance.api";
import { downloadReportCard, triggerDownload } from "../../api/reports.api";
import { useTeacherClasses } from "../../hooks/useTeacherClasses";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import { useSemester } from "../../hooks/useSemester";
import Spinner from "../../components/ui/Spinner";
import SemesterSelector from "../../components/ui/SemesterSelector";
import { http } from "../../api/http";
import { exportClassMarks, exportClassAttendance, triggerExcelDownload } from "../../api/exports.api";
import { Download, FileSpreadsheet } from "lucide-react";

const ClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { classes } = useTeacherClasses();
  const { scopeRef } = usePageAnimation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Attendance summary state
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Marks summary state
  const [marksSummary, setMarksSummary] = useState([]);
  const [marksLoading, setMarksLoading] = useState(false);

  const { semesters, selectedSemesterId, setSelectedSemesterId, loading: semLoading } = useSemester();
  const [downloadingId, setDownloadingId] = useState(null);
  const [exportingMarks, setExportingMarks] = useState(false);
  const [exportingAtt, setExportingAtt] = useState(false);

  const handleDownloadReport = async (studentId, studentName) => {
    try {
      setDownloadingId(studentId);
      const res = await downloadReportCard(studentId, selectedSemesterId);
      const sem = semesters.find((s) => s.id === selectedSemesterId);
      const filename = `ReportCard_${studentName}_${sem?.name || "all"}.pdf`;
      triggerDownload(res.data, filename);
    } catch (err) {
      setError("Failed to download report card.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExportMarks = async () => {
    if (!classId) return;
    try {
      setExportingMarks(true);
      const res = await exportClassMarks(classId, selectedSemesterId);
      triggerExcelDownload(res.data, `Marks_${currentClass?.name || "class"}.xlsx`);
    } catch {
      setError("Failed to export marks.");
    } finally {
      setExportingMarks(false);
    }
  };

  const handleExportAttendance = async () => {
    if (!classId) return;
    try {
      setExportingAtt(true);
      const res = await exportClassAttendance(classId, selectedSemesterId);
      triggerExcelDownload(res.data, `Attendance_${currentClass?.name || "class"}.xlsx`);
    } catch {
      setError("Failed to export attendance.");
    } finally {
      setExportingAtt(false);
    }
  };

  const currentClass = useMemo(
    () => classes.find((item) => item.id === classId) || null,
    [classes, classId]
  );

  // Load students
  useEffect(() => {
    let isMounted = true;

    const loadStudents = async () => {
      try {
        const studentsRes = await listApprovedStudents(classId);
        if (isMounted) {
          setStudents(studentsRes.data?.students || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load class data.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (classId) {
      void loadStudents();
    }

    return () => {
      isMounted = false;
    };
  }, [classId]);

  // Load attendance summary
  useEffect(() => {
    let isMounted = true;
    if (!classId) return;

    const load = async () => {
      setAttendanceLoading(true);
      try {
        const res = await fetchAttendanceSummary(classId);
        if (isMounted) setAttendanceSummary(res.data?.summary || []);
      } catch {
        // silent — section will show empty state
      } finally {
        if (isMounted) setAttendanceLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [classId]);

  // Load marks summary
  useEffect(() => {
    let isMounted = true;
    if (!classId) return;

    const load = async () => {
      setMarksLoading(true);
      try {
        const res = await http.get(`/classes/${classId}/marks`);
        if (isMounted) setMarksSummary(res.data?.marks || []);
      } catch {
        // silent
      } finally {
        if (isMounted) setMarksLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [classId]);

  // Compute per-student marks stats
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
        <div className="anim-item flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-slate-500">Class</p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {currentClass?.name || "Class details"}
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <SemesterSelector
              semesters={semesters}
              selectedId={selectedSemesterId}
              onChange={setSelectedSemesterId}
              loading={semLoading}
            />
            <Link
              to="/teacher/classes"
              className="text-sm font-medium text-[#0052FF]"
            >
              Back to classes
            </Link>
          </div>
        </div>

        {loading && <Spinner />}
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            {/* Row 1: Overview + Approved students */}
            <div className="anim-item grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>
                    <span className="font-medium text-slate-900">Name:</span>{" "}
                    {currentClass?.name || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Year:</span>{" "}
                    {currentClass?.year || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Students:</span>{" "}
                    {students.length}
                  </p>
                </div>

                {/* Quick actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(`/teacher/attendance?classId=${classId}`)}
                    className="rounded-full bg-[#0052FF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
                  >
                    Mark Attendance
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/marks?classId=${classId}`)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Enter Marks
                  </button>
                  <button
                    onClick={() => navigate(`/teacher/announcements?classId=${classId}`)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Announcements
                  </button>
                </div>

                {/* Export actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={handleExportMarks}
                    disabled={exportingMarks}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    {exportingMarks ? "Exporting..." : "Export Marks"}
                  </button>
                  <button
                    onClick={handleExportAttendance}
                    disabled={exportingAtt}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    {exportingAtt ? "Exporting..." : "Export Attendance"}
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Approved students
                </h2>
                {students.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    No approved students yet.
                  </p>
                ) : (
                  <ul className="mt-4 max-h-[320px] space-y-3 overflow-y-auto text-sm text-slate-700">
                    {students.map((student) => (
                      <li
                        key={student.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2"
                      >
                        <div>
                          <span className="font-medium text-slate-900">
                            {student.name}
                          </span>
                          <span className="ml-2 text-xs text-slate-500">
                            {student.roll_no}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDownloadReport(student.id, student.name)}
                          disabled={downloadingId === student.id}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#0052FF] hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Download Report Card"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {downloadingId === student.id ? "..." : "Report"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Row 2: Attendance Summary */}
            <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Attendance Summary
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Per-student attendance rate for this class.
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/teacher/attendance?classId=${classId}`)}
                  className="text-sm font-medium text-[#0052FF] hover:underline"
                >
                  View full attendance →
                </button>
              </div>

              {attendanceLoading && (
                <p className="mt-4 text-sm text-slate-500">Loading…</p>
              )}

              {!attendanceLoading && attendanceSummary.length === 0 && (
                <p className="mt-4 text-sm text-slate-500">
                  No attendance records yet. Start marking attendance to see the summary.
                </p>
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
                          <td className="px-3 py-3 font-medium text-slate-900">
                            {row.name}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {row.roll_no}
                          </td>
                          <td className="px-3 py-3 text-green-600 font-medium">
                            {row.present_count ?? 0}
                          </td>
                          <td className="px-3 py-3 text-red-600 font-medium">
                            {row.absent_count ?? 0}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {row.total_sessions ?? 0}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                Number(row.attendance_rate) >= 75
                                  ? "bg-emerald-100 text-emerald-700"
                                  : Number(row.attendance_rate) >= 50
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
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
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Marks Summary
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Per-student average marks across all exams.
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/teacher/marks?classId=${classId}`)}
                  className="text-sm font-medium text-[#0052FF] hover:underline"
                >
                  Enter marks →
                </button>
              </div>

              {marksLoading && (
                <p className="mt-4 text-sm text-slate-500">Loading…</p>
              )}

              {!marksLoading && marksPerStudent.length === 0 && (
                <p className="mt-4 text-sm text-slate-500">
                  No marks entered yet. Start entering marks for this class.
                </p>
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
                          <td className="px-3 py-3 font-medium text-slate-900">
                            {row.name}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {row.roll_no}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {row.exams}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {row.totalScore}/{row.totalMax}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                row.avg_pct >= 60
                                  ? "bg-emerald-100 text-emerald-700"
                                  : row.avg_pct >= 40
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
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
};

export default ClassDetails;

