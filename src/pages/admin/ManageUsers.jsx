// Admin: Manage Users — list all users with CRUD actions.
// Must NOT define routes, API clients, or auth logic.
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  fetchAllUsers,
  resetUserPassword,
  toggleUserStatus,
  deleteUser,
} from "../../api/admin.api";
import { useAuth } from "../../auth/useAuth";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import Spinner from "../../components/ui/Spinner";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { Users, Search, KeyRound, ToggleLeft, ToggleRight, Trash2, Check, X } from "lucide-react";

const ROLES = ["all", "admin", "teacher", "student", "hod"];

const roleBadge = (role) => {
  const colors = {
    admin: "bg-rose-100 text-rose-700",
    teacher: "bg-violet-100 text-violet-700",
    student: "bg-emerald-100 text-emerald-700",
    hod: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || "bg-slate-100 text-slate-600"}`}>
      {role}
    </span>
  );
};

export default function ManageUsers() {
  const { user: currentUser } = useAuth();
  const { scopeRef } = usePageAnimation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Action states
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  // Reset password modal
  const [resetModal, setResetModal] = useState({ open: false, userId: null, email: "" });
  const [newPassword, setNewPassword] = useState("");

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ open: false, userId: null, email: "" });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAllUsers(roleFilter === "all" ? "" : roleFilter);
      setUsers(res.data?.users || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Reset Password ──
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    try {
      setActionLoading(resetModal.userId);
      await resetUserPassword(resetModal.userId, newPassword);
      showToast(`Password reset for ${resetModal.email}`);
      setResetModal({ open: false, userId: null, email: "" });
      setNewPassword("");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reset password.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Toggle Status ──
  const handleToggleStatus = async (userId) => {
    try {
      setActionLoading(userId);
      const res = await toggleUserStatus(userId);
      showToast(res.data?.message || "Status updated.");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: res.data.is_active } : u))
      );
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to toggle status.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Delete User ──
  const handleDeleteUser = async () => {
    try {
      setActionLoading(deleteModal.userId);
      await deleteUser(deleteModal.userId);
      showToast(`User ${deleteModal.email} deleted.`);
      setDeleteModal({ open: false, userId: null, email: "" });
      setUsers((prev) => prev.filter((u) => u.id !== deleteModal.userId));
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete user.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = search
    ? users.filter(
        (u) =>
          (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
          (u.name || "").toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const isSelf = (userId) => userId === currentUser?.id;

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
            toast.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
          }`}>
            {toast.type === "error" ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="anim-item flex items-center gap-3">
          <div className="bg-blue-50 rounded-lg p-2.5">
            <Users className="w-6 h-6 text-[#0052FF]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Manage Users</h1>
            <p className="text-sm text-slate-500">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="anim-item flex flex-wrap gap-3">
          <div className="flex gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  roleFilter === r
                    ? "bg-[#0052FF] text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-[#0052FF] hover:text-[#0052FF]"
                }`}
              >
                {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="anim-item bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <Spinner text="Loading users..." />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-400 p-6 text-center">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Name</th>
                    <th className="text-left px-5 py-3 font-medium">Email</th>
                    <th className="text-left px-5 py-3 font-medium">Role</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Joined</th>
                    <th className="text-right px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{u.name || "—"}</td>
                      <td className="px-5 py-3 text-slate-600">{u.email}</td>
                      <td className="px-5 py-3">{roleBadge(u.role)}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.is_active !== false ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}>
                          {u.is_active !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3">
                        {isSelf(u.id) ? (
                          <span className="text-xs text-slate-400 italic float-right">You</span>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setResetModal({ open: true, userId: u.id, email: u.email })}
                              disabled={actionLoading === u.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#0052FF] hover:bg-blue-50 transition-colors"
                              title="Reset Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u.id)}
                              disabled={actionLoading === u.id}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.is_active !== false
                                  ? "text-emerald-500 hover:text-amber-600 hover:bg-amber-50"
                                  : "text-red-400 hover:text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={u.is_active !== false ? "Deactivate" : "Activate"}
                            >
                              {u.is_active !== false ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setDeleteModal({ open: true, userId: u.id, email: u.email })}
                              disabled={actionLoading === u.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reset Password Modal */}
        {resetModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 p-6">
              <h3 className="text-base font-semibold text-slate-900">Reset Password</h3>
              <p className="text-sm text-slate-500 mt-1">
                Set a new password for <strong>{resetModal.email}</strong>
              </p>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="w-full mt-4 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => { setResetModal({ open: false, userId: null, email: "" }); setNewPassword(""); }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetPassword}
                  disabled={actionLoading === resetModal.userId}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0052FF] rounded-lg hover:bg-[#0041cc] transition-colors disabled:opacity-50"
                >
                  {actionLoading === resetModal.userId ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={deleteModal.open}
          title="Delete User"
          message={`Are you sure you want to permanently delete ${deleteModal.email}? This will remove all their data including classes, marks, and attendance. This action cannot be undone.`}
          confirmLabel={actionLoading === deleteModal.userId ? "Deleting..." : "Delete"}
          destructive
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteModal({ open: false, userId: null, email: "" })}
        />
      </div>
    </DashboardLayout>
  );
}
