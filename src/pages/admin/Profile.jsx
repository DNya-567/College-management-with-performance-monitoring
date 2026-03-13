// Admin profile page: UI-only account details + logout action.
// Must NOT define routes or auth logic.
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../auth/useAuth";
import { useNavigate } from "react-router-dom";

const AdminProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Admin account details and session controls.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Account</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div>
              <p className="text-xs uppercase text-slate-400">Email</p>
              <p className="font-medium text-slate-900">{user?.email || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Role</p>
              <p className="font-medium uppercase text-slate-900">{user?.role || "admin"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Change password</h2>
          <p className="mt-1 text-sm text-slate-500">
            Password change for admin accounts is managed through security policy.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Session</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign out from this admin account.
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
    </DashboardLayout>
  );
};

export default AdminProfile;

