// HOD Department Classes: lists all classes in the department.
// Must NOT define routes or API clients.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { listDepartmentClasses } from "../../api/classes.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";

export default function DepartmentClasses() {
  const navigate = useNavigate();
  const { scopeRef } = usePageAnimation();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await listDepartmentClasses();
        if (isMounted) setClasses(res.data?.classes || []);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Failed to load classes.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">Department Classes</h1>
          <p className="mt-1 text-sm text-slate-500">All classes in your department. Click a class to view details.</p>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        {!loading && !error && classes.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">No classes in your department yet.</p>
          </div>
        )}

        {!loading && !error && classes.length > 0 && (
          <div className="anim-item grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/hod/classes/${c.id}`)}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-[#0052FF]/40 hover:shadow-md"
              >
                <h3 className="text-base font-semibold text-slate-900">{c.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{c.subject_name}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                    Year {c.year}
                  </span>
                  <span>Teacher: {c.teacher_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

