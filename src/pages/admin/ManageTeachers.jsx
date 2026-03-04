// Admin: Manage Teachers — list teachers with department reassignment and delete.
// Must NOT define routes, API clients, or auth logic.
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  fetchAllTeachers,
  fetchAllDepartments,
  updateTeacherDepartment,
} from "../../api/admin.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import Spinner from "../../components/ui/Spinner";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { GraduationCap, Search, ArrowRightLeft, Trash2, Check, X } from "lucide-react";

export default function ManageTeachers() {
  const { scopeRef } = usePageAnimation();
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  // Department reassignment modal
  const [deptModal, setDeptModal] = useState({ open: false, teacher: null });
  const [selectedDept, setSelectedDept] = useState("");

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ open: false, teacher: null });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, dRes] = await Promise.all([fetchAllTeachers(), fetchAllDepartments()]);
      setTeachers(tRes.data?.teachers || []);
      setDepartments(dRes.data?.departments || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Change Department ──
  const handleChangeDepartment = async () => {
    if (!selectedDept) {
      showToast("Please select a department.", "error");
      return;
    }
    try {
      setActionLoading(deptModal.teacher.id);
      await updateTeacherDepartment(deptModal.teacher.id, selectedDept);
      showToast(`Department updated for ${deptModal.teacher.name}`);
      setDeptModal({ open: false, teacher: null });
      setSelectedDept("");
      await loadData(); // refresh to get updated department names
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update department.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = search
    ? teachers.filter(
        (t) =>
          (t.name || "").toLowerCase().includes(search.toLowerCase()) ||
          (t.email || "").toLowerCase().includes(search.toLowerCase()) ||
          (t.department_name || "").toLowerCase().includes(search.toLowerCase())
      )
    : teachers;

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
        <div className="anim-item flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-violet-50 rounded-lg p-2.5">
              <GraduationCap className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">All Teachers</h1>
              <p className="text-sm text-slate-500">{filtered.length} teacher{filtered.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teachers..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="anim-item bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <Spinner text="Loading teachers..." />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-400 p-6 text-center">No teachers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Name</th>
                    <th className="text-left px-5 py-3 font-medium">Email</th>
                    <th className="text-left px-5 py-3 font-medium">Role</th>
                    <th className="text-left px-5 py-3 font-medium">Department</th>
                    <th className="text-left px-5 py-3 font-medium">Classes</th>
                    <th className="text-right px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{t.name}</td>
                      <td className="px-5 py-3 text-slate-600">{t.email}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.role === "hod" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"
                        }`}>
                          {t.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{t.department_name || "—"}</td>
                      <td className="px-5 py-3 text-slate-600">{t.class_count}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setDeptModal({ open: true, teacher: t }); setSelectedDept(""); }}
                            disabled={actionLoading === t.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0052FF] hover:bg-blue-50 transition-colors"
                            title="Change Department"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, teacher: t })}
                            disabled={actionLoading === t.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Teacher"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Change Department Modal */}
        {deptModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 p-6">
              <h3 className="text-base font-semibold text-slate-900">Change Department</h3>
              <p className="text-sm text-slate-500 mt-1">
                Reassign <strong>{deptModal.teacher?.name}</strong> to a new department
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Current: {deptModal.teacher?.department_name || "None"}
              </p>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full mt-4 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setDeptModal({ open: false, teacher: null })}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeDepartment}
                  disabled={actionLoading === deptModal.teacher?.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0052FF] rounded-lg hover:bg-[#0041cc] transition-colors disabled:opacity-50"
                >
                  {actionLoading === deptModal.teacher?.id ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={deleteModal.open}
          title="Delete Teacher"
          message={`To delete ${deleteModal.teacher?.name || "this teacher"} and all their data, go to Manage Users and delete their account from there. This ensures proper cascading cleanup.`}
          confirmLabel="Go to Users"
          onConfirm={() => {
            setDeleteModal({ open: false, teacher: null });
            window.location.href = "/admin/users";
          }}
          onCancel={() => setDeleteModal({ open: false, teacher: null })}
        />
      </div>
    </DashboardLayout>
  );
}

