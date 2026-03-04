// Admin: View All Teachers — read-only list with department and class count.
// Must NOT define routes, API clients, or auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { fetchAllTeachers } from "../../api/admin.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import Spinner from "../../components/ui/Spinner";
import { GraduationCap, Search } from "lucide-react";

export default function ManageTeachers() {
  const { scopeRef } = usePageAnimation();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchAllTeachers();
        if (!cancelled) setTeachers(res.data?.teachers || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

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
        {/* Header */}
        <div className="anim-item flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-violet-50 rounded-lg p-2.5">
              <GraduationCap className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">All Teachers</h1>
              <p className="text-sm text-slate-500">
                {filtered.length} teacher{filtered.length !== 1 ? "s" : ""}
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{t.name}</td>
                      <td className="px-5 py-3 text-slate-600">{t.email}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            t.role === "hod"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-violet-100 text-violet-700"
                          }`}
                        >
                          {t.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {t.department_name || "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{t.class_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

