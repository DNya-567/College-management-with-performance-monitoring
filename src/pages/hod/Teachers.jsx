// HOD Teachers Management: View and manage all teachers in department
// Must NOT define routes or API clients
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getMyTeacherProfile } from "../../api/teachers.api";
import { getTeachersByDepartment, getTeacherPerformance } from "../../api/hod.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import Spinner from "../../components/ui/Spinner";
import { Users, TrendingUp } from "lucide-react";

const TeacherManagement = () => {
  const { scopeRef } = usePageAnimation();
  const [departmentId, setDepartmentId] = useState(null);
  const [departmentName, setDepartmentName] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [teacherPerf, setTeacherPerf] = useState([]);
  const [perfLoading, setPerfLoading] = useState(false);

  // Load HOD's department on mount
  useEffect(() => {
    let isMounted = true;

    const loadDept = async () => {
      try {
        const res = await getMyTeacherProfile();
        const teacher = res.data?.teacher;
        if (isMounted) {
          setDepartmentId(teacher?.department_id);
          setDepartmentName(teacher?.department_name || "");
        }
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Failed to load department.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDept();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load teachers when department changes
  useEffect(() => {
    if (!departmentId) return;

    let isMounted = true;
    const load = async () => {
      try {
        const res = await getTeachersByDepartment(departmentId);
        if (isMounted) setTeachers(res.data?.teachers || []);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Failed to load teachers.");
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [departmentId]);

  // Load teacher performance when teacher is selected
  const handleSelectTeacher = async (teacherId) => {
    if (selectedTeacherId === teacherId) {
      setSelectedTeacherId(null);
      setTeacherPerf([]);
      return;
    }

    setSelectedTeacherId(teacherId);
    setPerfLoading(true);

    try {
      const res = await getTeacherPerformance(departmentId, teacherId);
      setTeacherPerf(res.data?.classes || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load performance.");
      setTeacherPerf([]);
    } finally {
      setPerfLoading(false);
    }
  };

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">Teacher Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and monitor all teachers in {departmentName || "your department"}
          </p>
        </div>

        {loading && <Spinner />}
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        {!loading && departmentId && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Teachers List */}
            <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#0052FF]" />
                <h2 className="text-lg font-semibold text-slate-900">Teachers</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">{teachers.length} teacher(s)</p>

              {teachers.length === 0 ? (
                <p className="text-sm text-slate-500">No teachers in this department.</p>
              ) : (
                <div className="space-y-2">
                  {teachers.map((teacher) => (
                    <button
                      key={teacher.id}
                      onClick={() => handleSelectTeacher(teacher.id)}
                      className={[
                        "w-full text-left rounded-xl px-4 py-3 text-sm transition",
                        selectedTeacherId === teacher.id
                          ? "bg-blue-50 border border-[#0052FF]"
                          : "bg-slate-50 border border-slate-200 hover:border-slate-300",
                      ].join(" ")}
                    >
                      <p className="font-medium text-slate-900">{teacher.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{teacher.email}</p>
                      <div className="flex gap-3 mt-2 text-xs text-slate-600">
                        <span>📚 {teacher.total_classes} class(es)</span>
                        <span>👥 {teacher.total_students} student(s)</span>
                      </div>
                      {teacher.is_active === false && (
                        <p className="mt-2 text-xs font-medium text-red-600">🔴 Inactive</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Performance Details */}
            <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              {selectedTeacher ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-[#0052FF]" />
                    <h2 className="text-lg font-semibold text-slate-900">
                      {selectedTeacher.name}'s Performance
                    </h2>
                  </div>

                  {perfLoading ? (
                    <Spinner />
                  ) : teacherPerf.length === 0 ? (
                    <p className="text-sm text-slate-500">No class data available.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-2 px-3 font-medium text-slate-700">Class</th>
                            <th className="text-left py-2 px-3 font-medium text-slate-700">Subject</th>
                            <th className="text-center py-2 px-3 font-medium text-slate-700">Students</th>
                            <th className="text-center py-2 px-3 font-medium text-slate-700">Avg Marks</th>
                            <th className="text-center py-2 px-3 font-medium text-slate-700">Avg %</th>
                            <th className="text-center py-2 px-3 font-medium text-slate-700">Avg Attendance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teacherPerf.map((cls) => (
                            <tr
                              key={cls.id}
                              className="border-b border-slate-100 hover:bg-slate-50 transition"
                            >
                              <td className="py-3 px-3 font-medium text-slate-900">
                                {cls.name}
                              </td>
                              <td className="py-3 px-3 text-slate-700">{cls.subject_name}</td>
                              <td className="py-3 px-3 text-center text-slate-600">
                                {cls.enrolled_students}
                              </td>
                              <td className="py-3 px-3 text-center font-medium text-slate-900">
                                {cls.avg_marks !== null ? cls.avg_marks.toFixed(2) : "—"}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="font-medium">
                                  {cls.avg_percentage !== null ? `${cls.avg_percentage.toFixed(1)}%` : "—"}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={[
                                    "font-medium",
                                    cls.avg_attendance_pct >= 75
                                      ? "text-emerald-600"
                                      : cls.avg_attendance_pct >= 50
                                      ? "text-amber-600"
                                      : "text-red-600",
                                  ].join(" ")}
                                >
                                  {cls.avg_attendance_pct !== null ? `${cls.avg_attendance_pct.toFixed(1)}%` : "—"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Summary Stats */}
                  {teacherPerf.length > 0 && (
                    <div className="grid gap-3 mt-6 pt-6 border-t border-slate-200 sm:grid-cols-3">
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-xs text-slate-500">Total Classes</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {teacherPerf.length}
                        </p>
                      </div>
                      <div className="rounded-lg bg-violet-50 p-3">
                        <p className="text-xs text-slate-500">Avg Student Score</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {(
                            teacherPerf.reduce((sum, c) => sum + (c.avg_marks || 0), 0) /
                            teacherPerf.length
                          ).toFixed(1)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <p className="text-xs text-slate-500">Avg Attendance</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {(
                            teacherPerf.reduce((sum, c) => sum + (c.avg_attendance_pct || 0), 0) /
                            teacherPerf.length
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-500">
                    Select a teacher to view their performance details.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherManagement;

