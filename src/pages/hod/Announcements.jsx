// HOD Announcements: view department announcements and create new ones.
// Must NOT define routes or API clients.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { listAnnouncements, createClassAnnouncement } from "../../api/announcements.api";
import { listDepartmentClasses } from "../../api/classes.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";

export default function HodAnnouncements() {
  const { scopeRef } = usePageAnimation();
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form state
  const [form, setForm] = useState({ classId: "", title: "", body: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [annRes, classesRes] = await Promise.all([
          listAnnouncements(),
          listDepartmentClasses(),
        ]);
        if (!isMounted) return;
        setAnnouncements(annRes.data?.announcements || []);
        setClasses(classesRes.data?.classes || []);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Failed to load.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.classId || !form.title || !form.body) return;
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");
    try {
      const res = await createClassAnnouncement(form.classId, { title: form.title, body: form.body });
      const newAnn = res.data?.announcement;
      if (newAnn) {
        const cls = classes.find((c) => c.id === form.classId);
        setAnnouncements((prev) => [
          { ...newAnn, class_name: cls?.name || "", teacher_name: "You" },
          ...prev,
        ]);
      }
      setForm({ classId: "", title: "", body: "" });
      setCreateSuccess("Announcement posted.");
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to post announcement.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">Announcements</h1>
          <p className="mt-1 text-sm text-slate-500">Department-wide announcements.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create form */}
          <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Post Announcement</h2>
            <form className="mt-4 space-y-4" onSubmit={handleCreate}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Class</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#0052FF] focus:outline-none"
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value })}
                >
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.teacher_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Title</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#0052FF] focus:outline-none"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Announcement title"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Body</label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#0052FF] focus:outline-none"
                  rows={3}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Announcement body…"
                />
              </div>
              {createError && <p className="text-sm text-red-600">{createError}</p>}
              {createSuccess && <p className="text-sm text-emerald-600">{createSuccess}</p>}
              <button
                type="submit"
                disabled={creating || !form.classId || !form.title || !form.body}
                className="rounded-full bg-[#0052FF] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 disabled:opacity-50"
              >
                {creating ? "Posting…" : "Post"}
              </button>
            </form>
          </section>

          {/* Announcements list */}
          <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Recent Announcements</h2>

            {loading && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            {!loading && !error && announcements.length === 0 && (
              <p className="mt-4 text-sm text-slate-500">No announcements yet.</p>
            )}

            {!loading && !error && announcements.length > 0 && (
              <ul className="mt-4 max-h-[500px] space-y-3 overflow-y-auto">
                {announcements.map((a) => (
                  <li key={a.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>
                      <span className="text-[10px] text-slate-400">
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{a.body}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {a.class_name} · {a.teacher_name}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

