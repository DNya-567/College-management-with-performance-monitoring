// UI-only page for teachers to create class-scoped announcements.
// Must NOT define routes or implement auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { createClassAnnouncement, listAnnouncements } from "../../api/announcements.api";
import { useTeacherClasses } from "../../hooks/useTeacherClasses";
import { usePageAnimation } from "../../hooks/usePageAnimation";

const TeacherAnnouncements = () => {
  const { classes } = useTeacherClasses();
  const { scopeRef } = usePageAnimation();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAnnouncements = async () => {
      try {
        const response = await listAnnouncements();
        if (isMounted) {
          setAnnouncements(response.data?.announcements || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load announcements.");
        }
      }
    };

    void loadAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedClassId) {
      setError("Please select a class.");
      return;
    }

    setStatus("Publishing...");
    setError("");

    try {
      const response = await createClassAnnouncement(selectedClassId, { title, body });
      const created = response.data?.announcement;
      if (created) {
        // Enrich with class name for immediate display
        const cls = classes.find((c) => c.id === selectedClassId);
        created.class_name = cls?.name || "";
        setAnnouncements((prev) => [created, ...prev]);
      }
      setTitle("");
      setBody("");
      setStatus("Announcement published.");
    } catch (err) {
      setStatus("");
      setError(err.response?.data?.message || "Failed to publish announcement.");
    }
  };

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">Announcements</h1>
          <p className="mt-1 text-sm text-slate-500">
            Share updates with students in a specific class.
          </p>
        </div>

        <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">New announcement</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="classSelect">
                Class
              </label>
              <select
                id="classSelect"
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#0052FF] focus:outline-none"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                required
              >
                <option value="">Select a class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Year {c.year})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#0052FF] focus:outline-none"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="body">
                Message
              </label>
              <textarea
                id="body"
                className="min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#0052FF] focus:outline-none"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-[#0052FF] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
            >
              Publish
            </button>
            {status && <p className="text-sm text-emerald-600">{status}</p>}
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </form>
        </section>

        <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">My announcements</h2>
          {announcements.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No announcements yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {announcements.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                      {item.class_name && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-[#0052FF]">
                          {item.class_name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default TeacherAnnouncements;

