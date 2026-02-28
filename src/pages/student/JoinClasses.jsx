// UI-only page for students to request class enrollment.
// Must NOT define routes or implement auth logic.
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { http } from "../../api/http";
import { listPendingEnrollments } from "../../api/enrollments.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";

const JoinClasses = () => {
  const { scopeRef } = usePageAnimation();
  const [classes, setClasses] = useState([]);
  const [pending, setPending] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filteredClasses = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];
    return classes.filter((item) => {
      const haystack = `${item.name} ${item.subject_name} ${item.teacher_name}`
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [classes, query]);

  const loadClasses = async () => {
    try {
      const [classesRes, pendingRes] = await Promise.all([
        http.get("/classes"),
        listPendingEnrollments(),
      ]);
      setClasses(classesRes.data?.classes || []);
      setPending(pendingRes.data?.classes || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load classes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [classesRes, pendingRes] = await Promise.all([
          http.get("/classes"),
          listPendingEnrollments(),
        ]);
        if (isMounted) {
          setClasses(classesRes.data?.classes || []);
          setPending(pendingRes.data?.classes || []);
        }
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Failed to load classes.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();
    return () => { isMounted = false; };
  }, []);

  const handleJoin = async (classId) => {
    try {
      await http.post(`/classes/${classId}/join`);
      setClasses((prev) => prev.filter((item) => item.id !== classId));
      const joined = classes.find((item) => item.id === classId);
      if (joined) {
        setPending((prev) => [
          {
            class_id: joined.id,
            class_name: joined.name,
            subject_name: joined.subject_name,
            teacher_name: joined.teacher_name,
            year: joined.year,
            status: "pending",
          },
          ...prev,
        ]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request enrollment.");
    }
  };

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">Join Classes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search for a class and request to join.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Pending requests
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Waiting for teacher approval.
            </p>

            {loading && <p className="mt-4 text-sm text-slate-500">Loading...</p>}
            {error && (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            {!loading && !error && pending.length === 0 && (
              <p className="mt-4 text-sm text-slate-500">
                No pending classes.
              </p>
            )}

            {!loading && !error && pending.length > 0 && (
              <ul className="mt-4 space-y-3">
                {pending.map((item) => (
                  <li
                    key={item.class_id}
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <p className="text-sm font-medium text-slate-900">
                      {item.class_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.subject_name} · {item.teacher_name} · Year {item.year}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="classSearch">
                Search classes
              </label>
              <input
                id="classSearch"
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Search by class, subject, or teacher"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <p className="text-xs text-slate-500">
                Type at least 2 characters to see results.
              </p>
            </div>

            {!loading && !error && query.trim().length < 2 && (
              <p className="mt-6 text-sm text-slate-500">
                Start typing to search for available classes.
              </p>
            )}

            {!loading && !error && query.trim().length >= 2 && (
              <div className="mt-6 space-y-3">
                {filteredClasses.length === 0 ? (
                  <p className="text-sm text-slate-500">No classes found.</p>
                ) : (
                  filteredClasses.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.subject_name} · {item.teacher_name} · Year {item.year}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-full bg-[#0052FF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
                        onClick={() => handleJoin(item.id)}
                      >
                        Request to Join
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JoinClasses;
