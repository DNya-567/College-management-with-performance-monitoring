// Admin: View All Students — read-only list with enrollment info.
// Must NOT define routes, API clients, or auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { fetchAllStudents } from "../../api/admin.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import Spinner from "../../components/ui/Spinner";
import { UserCheck, Search } from "lucide-react";

export default function ManageStudents() {
  const { scopeRef } = usePageAnimation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchAllStudents();
        if (!cancelled) setStudents(res.data?.students || []);
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

