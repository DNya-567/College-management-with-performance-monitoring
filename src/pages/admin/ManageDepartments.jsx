// Admin: Manage Departments — CRUD departments and assign HOD.
// Must NOT define routes, API clients, or auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  fetchAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignHod,
  fetchAllTeachers,
} from "../../api/admin.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import Spinner from "../../components/ui/Spinner";
import { Building2, Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";

export default function ManageDepartments() {
  const { scopeRef } = usePageAnimation();
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  // HOD assign state
  const [hodDeptId, setHodDeptId] = useState(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  const loadData = async () => {
    try {
      const [dRes, tRes] = await Promise.all([
        fetchAllDepartments(),
        fetchAllTeachers(),
      ]);
      setDepartments(dRes.data?.departments || []);
      setTeachers(tRes.data?.teachers || []);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      await createDepartment({ name: newName.trim() });
      setNewName("");
      flash("Department created.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create department.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    setError("");
    try {
      await updateDepartment(id, { name: editName.trim() });
      setEditingId(null);
      setEditName("");
      flash("Department updated.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update department.");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete department "${name}"? This cannot be undone.`)) return;
    setError("");
    try {
      await deleteDepartment(id);
      flash("Department deleted.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete department.");
    }
  };

  const handleAssignHod = async () => {
    if (!selectedTeacherId || !hodDeptId) return;
    setError("");
    try {
      await assignHod(hodDeptId, selectedTeacherId);
      setHodDeptId(null);
      setSelectedTeacherId("");
      flash("HOD assigned successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign HOD.");
    }
  };

  // Teachers that belong to a specific department (for HOD assignment)
  const teachersInDept = (deptId) =>
    teachers.filter(
      (t) =>
        departments.find((d) => d.id === deptId)?.id &&
        teachers.some(
          (te) =>
            te.id === t.id &&
            t.department_name ===
              departments.find((d) => d.id === deptId)?.name
        )
    );

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        {/* Header */}
        <div className="anim-item flex items-center gap-3">
          <div className="bg-rose-50 rounded-lg p-2.5">
            <Building2 className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Manage Departments
            </h1>
            <p className="text-sm text-slate-500">
              {departments.length} department{departments.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Feedback */}
        {success && (
          <div className="anim-item bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2.5 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="anim-item bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
            {error}
          </div>
        )}

        {/* Create form */}
        <form
          onSubmit={handleCreate}
          className="anim-item bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex gap-3 items-end"
        >
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              New Department Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Computer Science"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="flex items-center gap-1.5 bg-[#0052FF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0041CC] disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {creating ? "Creating..." : "Add"}
          </button>
        </form>

        {/* Departments List */}
        {loading ? (
          <Spinner text="Loading departments..." />
        ) : departments.length === 0 ? (
          <div className="anim-item bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
            <p className="text-sm text-slate-400">No departments yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="anim-item bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  {/* Name (editable) */}
                  <div className="flex-1">
                    {editingId === dept.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
                        />
                        <button
                          onClick={() => handleUpdate(dept.id)}
                          className="text-xs bg-[#0052FF] text-white px-3 py-1.5 rounded-lg hover:bg-[#0041CC]"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditName("");
                          }}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {dept.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {dept.teacher_count} teacher{dept.teacher_count !== 1 ? "s" : ""}
                          {dept.hod_name ? ` · HOD: ${dept.hod_name}` : " · No HOD assigned"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (hodDeptId === dept.id) {
                          setHodDeptId(null);
                        } else {
                          setHodDeptId(dept.id);
                          setSelectedTeacherId("");
                        }
                      }}
                      title="Assign HOD"
                      className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(dept.id);
                        setEditName(dept.name);
                      }}
                      title="Edit"
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id, dept.name)}
                      title="Delete"
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* HOD assignment panel */}
                {hodDeptId === dept.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Select Teacher as HOD
                      </label>
                      <select
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
                      >
                        <option value="">Choose teacher...</option>
                        {teachers
                          .filter((t) => t.department_name === dept.name)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.email})
                            </option>
                          ))}
                      </select>
                    </div>
                    <button
                      onClick={handleAssignHod}
                      disabled={!selectedTeacherId}
                      className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                      Assign HOD
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

