// Admin: System Overview — view all classes system-wide.
// Must NOT define routes, API clients, or auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { fetchAllClasses } from "../../api/admin.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import Spinner from "../../components/ui/Spinner";
import { BookOpen, Search } from "lucide-react";

export default function SystemOverview() {
  const { scopeRef } = usePageAnimation();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchAllClasses();
        if (!cancelled) setClasses(res.data?.classes || []);
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
    ? classes.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
          (c.teacher_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (c.subject_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (c.department_name || "").toLowerCase().includes(search.toLowerCase())
      )
    : classes;

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        {/* Header */}
        <div className="anim-item flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-50 rounded-lg p-2.5">
              <BookOpen className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                System Overview — All Classes
              </h1>
              <p className="text-sm text-slate-500">
                {filtered.length} class{filtered.length !== 1 ? "es" : ""}
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
              placeholder="Search classes..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="anim-item bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <Spinner text="Loading classes..." />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-400 p-6 text-center">No classes found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Class Name</th>
                    <th className="text-left px-5 py-3 font-medium">Subject</th>
                    <th className="text-left px-5 py-3 font-medium">Teacher</th>
                    <th className="text-left px-5 py-3 font-medium">Department</th>
                    <th className="text-left px-5 py-3 font-medium">Year</th>
                    <th className="text-left px-5 py-3 font-medium">Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{c.name}</td>
                      <td className="px-5 py-3 text-slate-600">{c.subject_name}</td>
                      <td className="px-5 py-3 text-slate-600">{c.teacher_name}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {c.department_name || "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-600">Year {c.year}</td>
                      <td className="px-5 py-3">
                        <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          {c.student_count}
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

