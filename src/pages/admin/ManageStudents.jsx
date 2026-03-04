// Admin: Manage Students — list students with delete action.
// Must NOT define routes, API clients, or auth logic.
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { fetchAllStudents } from "../../api/admin.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import Spinner from "../../components/ui/Spinner";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { UserCheck, Search, Trash2, Eye, Check, X } from "lucide-react";

export default function ManageStudents() {
  const { scopeRef } = usePageAnimation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [toast, setToast] = useState(null);

  // Detail drawer
  const [detailStudent, setDetailStudent] = useState(null);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ open: false, student: null });

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAllStudents();
      setStudents(res.data?.students || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = search
    ? students.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
          (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
          (s.roll_no || "").toLowerCase().includes(search.toLowerCase())
      )
    : students;

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
            <div className="bg-emerald-50 rounded-lg p-2.5">
              <UserCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">All Students</h1>
              <p className="text-sm text-slate-500">
                {filtered.length} student{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="anim-item bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <Spinner text="Loading students..." />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-400 p-6 text-center">No students found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Name</th>
                    <th className="text-left px-5 py-3 font-medium">Roll No</th>
                    <th className="text-left px-5 py-3 font-medium">Email</th>
                    <th className="text-left px-5 py-3 font-medium">Year</th>
                    <th className="text-left px-5 py-3 font-medium">Enrolled Classes</th>
                    <th className="text-right px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
                      <td className="px-5 py-3 text-slate-600">{s.roll_no}</td>
                      <td className="px-5 py-3 text-slate-600">{s.email}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {s.year ? `Year ${s.year}` : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {s.enrollment_count}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailStudent(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0052FF] hover:bg-blue-50 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, student: s })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Student"
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

        {/* Student Detail Drawer */}
        {detailStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900">Student Details</h3>
                <button
                  onClick={() => setDetailStudent(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Name</span>
                  <span className="font-medium text-slate-800">{detailStudent.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Roll No</span>
                  <span className="font-medium text-slate-800">{detailStudent.roll_no}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium text-slate-800">{detailStudent.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Year</span>
                  <span className="font-medium text-slate-800">{detailStudent.year ? `Year ${detailStudent.year}` : "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Enrolled Classes</span>
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {detailStudent.enrollment_count}
                  </span>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setDetailStudent(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation — redirect to Manage Users */}
        <ConfirmModal
          open={deleteModal.open}
          title="Delete Student"
          message={`To delete ${deleteModal.student?.name || "this student"} and all their data (marks, attendance, enrollments), go to Manage Users and delete their account. This ensures proper cascading cleanup.`}
          confirmLabel="Go to Users"
          onConfirm={() => {
            setDeleteModal({ open: false, student: null });
            window.location.href = "/admin/users";
          }}
          onCancel={() => setDeleteModal({ open: false, student: null })}
        />
      </div>
    </DashboardLayout>
  );
}
