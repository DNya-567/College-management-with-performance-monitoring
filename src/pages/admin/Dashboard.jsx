// Admin Dashboard: system-wide statistics and recent activity.
// Must NOT define routes, API clients, or auth logic.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { fetchAdminStats, fetchRecentActivity } from "../../api/admin.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import Spinner from "../../components/ui/Spinner";
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  Bell,
  ShieldCheck,
  UserCheck,
  ClipboardList,
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { scopeRef } = usePageAnimation();

  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [statsRes, actRes] = await Promise.all([
          fetchAdminStats(),
          fetchRecentActivity(),
        ]);
        if (cancelled) return;
        setStats(statsRes.data);
        setActivities(actRes.data?.activities || []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <DashboardLayout><Spinner text="Loading dashboard..." /></DashboardLayout>;

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.total_users, icon: Users, color: "text-[#0052FF]", bg: "bg-blue-50" },
        { label: "Teachers", value: stats.total_teachers, icon: GraduationCap, color: "text-violet-600", bg: "bg-violet-50" },
        { label: "Students", value: stats.total_students, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "HODs", value: stats.total_hods, icon: ShieldCheck, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Departments", value: stats.total_departments, icon: Building2, color: "text-rose-600", bg: "bg-rose-50" },
        { label: "Classes", value: stats.total_classes, icon: BookOpen, color: "text-cyan-600", bg: "bg-cyan-50" },
        { label: "Pending Enrollments", value: stats.pending_enrollments, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50" },
        { label: "Announcements", value: stats.total_announcements, icon: Bell, color: "text-indigo-600", bg: "bg-indigo-50" },
      ]
    : [];

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        {/* Header */}
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">System-wide overview and management</p>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="anim-item bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 shadow-sm"
            >
              <div className={`${card.bg} rounded-lg p-2.5`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="anim-item grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Manage Users", path: "/admin/users", icon: Users },
            { label: "Departments", path: "/admin/departments", icon: Building2 },
            { label: "All Teachers", path: "/admin/teachers", icon: GraduationCap },
            { label: "All Students", path: "/admin/students", icon: UserCheck },
          ].map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:border-[#0052FF] hover:text-[#0052FF] transition-colors shadow-sm"
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="anim-item bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
          {activities.length === 0 ? (
            <p className="text-sm text-slate-400">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <div className="bg-blue-50 rounded-lg p-2 mt-0.5">
                    <Bell className="w-4 h-4 text-[#0052FF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {a.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      by {a.teacher_name}
                      {a.class_name ? ` · ${a.class_name}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
