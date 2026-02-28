// UI-only page for viewing the teacher profile.
// Must NOT define routes or implement auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getMyTeacherProfile } from "../../api/teachers.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";

const TeacherProfile = () => {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { scopeRef } = usePageAnimation();

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await getMyTeacherProfile();
        if (isMounted) {
          setTeacher(response.data?.teacher || null);
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

  return (
    <DashboardLayout>
      <div ref={scopeRef}>
        <h1 className="anim-item text-2xl font-semibold text-slate-900">My Profile</h1>
        {loading && <p className="mt-4 text-sm text-slate-500">Loading...</p>}
        {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}
        {teacher && !loading && (
          <div className="anim-item mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-3 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase text-slate-400">Name</p>
                <p className="font-medium text-slate-900">{teacher.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Email</p>
                <p className="font-medium text-slate-900">{teacher.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Department</p>
                <p className="font-medium text-slate-900">{teacher.department_id || "-"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherProfile;

