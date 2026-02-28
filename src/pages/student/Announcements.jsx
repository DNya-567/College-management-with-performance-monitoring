// UI-only page for students to view class-scoped announcements.
// Shows only announcements from classes the student is enrolled in.
// Must NOT define routes or implement auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { listAnnouncements } from "../../api/announcements.api";

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterClass, setFilterClass] = useState("");

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
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

  // Extract unique class names for filter dropdown
  const classNames = [...new Set(announcements.map((a) => a.class_name).filter(Boolean))];

  const filtered = filterClass
    ? announcements.filter((a) => a.class_name === filterClass)
    : announcements;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Announcements</h1>
            <p className="mt-1 text-sm text-slate-500">
              Updates from your enrolled classes.
            </p>
          </div>
          {classNames.length > 1 && (
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#0052FF] focus:outline-none"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="">All classes</option>
              {classNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500">No announcements yet.</p>
            ) : (
              <ul className="space-y-3">
                {filtered.map((item) => (
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
                      <span className="shrink-0 text-xs text-slate-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.body}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Posted by {item.teacher_name}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentAnnouncements;

