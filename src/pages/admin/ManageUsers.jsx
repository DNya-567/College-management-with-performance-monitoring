// Admin: Manage Users — list all users with role filter.
// Must NOT define routes, API clients, or auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { fetchAllUsers } from "../../api/admin.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import Spinner from "../../components/ui/Spinner";
import { Users, Search } from "lucide-react";

const ROLES = ["all", "admin", "teacher", "student", "hod"];

const roleBadge = (role) => {
  const colors = {
    admin: "bg-rose-100 text-rose-700",
    teacher: "bg-violet-100 text-violet-700",
    student: "bg-emerald-100 text-emerald-700",
    hod: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || "bg-slate-100 text-slate-600"}`}
    >
      {role}
    </span>
  );
};

export default function ManageUsers() {
  const { scopeRef } = usePageAnimation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        const res = await fetchAllUsers(roleFilter === "all" ? "" : roleFilter);
        if (!cancelled) setUsers(res.data?.users || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [roleFilter]);

  const filtered = search
    ? users.filter(
        (u) =>
          (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
          (u.name || "").toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        {/* Header */}
        <div className="anim-item flex items-center gap-3">
          <div className="bg-blue-50 rounded-lg p-2.5">
            <Users className="w-6 h-6 text-[#0052FF]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Manage Users</h1>
            <p className="text-sm text-slate-500">
              {filtered.length} user{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="anim-item flex flex-wrap gap-3">
          {/* Role pills */}
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

          {/* Search */}
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
                    <th className="text-left px-5 py-3 font-medium">Roll No</th>
                    <th className="text-left px-5 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {u.name || "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{u.email}</td>
                      <td className="px-5 py-3">{roleBadge(u.role)}</td>
                      <td className="px-5 py-3 text-slate-500">{u.roll_no || "—"}</td>
                      <td className="px-5 py-3 text-slate-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
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

