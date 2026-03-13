// UI-only page for viewing the teacher profile.
// Must NOT define routes or implement auth logic.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getMyTeacherProfile } from "../../api/teachers.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import ChangePasswordCard from "../../components/ui/ChangePasswordCard";
import Spinner from "../../components/ui/Spinner";
import { useAuth } from "../../auth/useAuth";

const TeacherProfile = () => {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { scopeRef } = usePageAnimation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

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
        {loading && <Spinner />}
        {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}
        {teacher && !loading && (
          <div className="mt-6 space-y-6 max-w-3xl">
            {/* Profile Info Card */}
            <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                  <p className="font-medium text-slate-900">{teacher.department_name || teacher.department_id || "—"}</p>
                </div>
              </div>
            </section>

            {/* Change Password Card */}
            <div className="anim-item">
              <ChangePasswordCard />
            </div>

            {/* Logout Card */}
            <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Session</h2>
              <p className="mt-1 text-sm text-slate-500">
                Sign out from this account safely.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Logout
              </button>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherProfile;

