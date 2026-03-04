// Admin: Manage Semesters — create, edit, delete, set active.
// Must NOT define routes, API clients, or auth logic.
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  fetchSemesters,
  createSemester,
  deleteSemester,
  activateSemester,
} from "../../api/semesters.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import Spinner from "../../components/ui/Spinner";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { Calendar, Plus, Star, Trash2, Check, X } from "lucide-react";

export default function ManageSemesters() {
  const { scopeRef } = usePageAnimation();
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, semester: null });

  // Create form
  const [form, setForm] = useState({ name: "", academic_year: "", start_date: "", end_date: "" });
  const [creating, setCreating] = useState(false);

  const loadSemesters = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchSemesters();
      setSemesters(res.data?.semesters || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSemesters();
  }, [loadSemesters]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.academic_year || !form.start_date || !form.end_date) {
      showToast("All fields are required.", "error");
      return;
    }
    try {
      setCreating(true);
      await createSemester(form);
      showToast("Semester created.");
      setForm({ name: "", academic_year: "", start_date: "", end_date: "" });
      await loadSemesters();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create.", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      setActionLoading(id);
      await activateSemester(id);
      showToast("Semester activated.");
      await loadSemesters();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to activate.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    const sem = deleteModal.semester;
    try {
      setActionLoading(sem.id);
      await deleteSemester(sem.id);
      showToast(`Semester "${sem.name}" deleted.`);
      setDeleteModal({ open: false, semester: null });
      await loadSemesters();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

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
          <div className="bg-indigo-50 rounded-lg p-2.5">
            <Calendar className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Manage Semesters</h1>
            <p className="text-sm text-slate-500">Create and manage academic semesters</p>
          </div>
        </div>

        {/* Create Form */}
        <form onSubmit={handleCreate} className="anim-item bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Semester
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Name (e.g. Sem 1)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
            />
            <input
              type="text"
              placeholder="Academic Year (e.g. 2025-26)"
              value={form.academic_year}
              onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
            />
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
            />
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="mt-3 px-4 py-2 text-sm font-medium text-white bg-[#0052FF] rounded-lg hover:bg-[#0041cc] transition-colors disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Semester"}
          </button>
        </form>

        {/* Semesters List */}
        <div className="anim-item bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <Spinner text="Loading semesters..." />
          ) : semesters.length === 0 ? (
            <p className="text-sm text-slate-400 p-6 text-center">No semesters created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Name</th>
                    <th className="text-left px-5 py-3 font-medium">Academic Year</th>
                    <th className="text-left px-5 py-3 font-medium">Start</th>
                    <th className="text-left px-5 py-3 font-medium">End</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-right px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {semesters.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
                      <td className="px-5 py-3 text-slate-600">{s.academic_year}</td>
                      <td className="px-5 py-3 text-slate-500">{fmtDate(s.start_date)}</td>
                      <td className="px-5 py-3 text-slate-500">{fmtDate(s.end_date)}</td>
                      <td className="px-5 py-3">
                        {s.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <Star className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {!s.is_active && (
                            <button
                              onClick={() => handleActivate(s.id)}
                              disabled={actionLoading === s.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Set Active"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          {!s.is_active && (
                            <button
                              onClick={() => setDeleteModal({ open: true, semester: s })}
                              disabled={actionLoading === s.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {s.is_active && (
                            <span className="text-xs text-emerald-600 font-medium">Current</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        <ConfirmModal
          open={deleteModal.open}
          title="Delete Semester"
          message={`Are you sure you want to delete "${deleteModal.semester?.name}"? Marks and attendance linked to this semester will lose their semester reference.`}
          confirmLabel="Delete"
          destructive
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal({ open: false, semester: null })}
        />
      </div>
    </DashboardLayout>
  );
}

