import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { listDepartmentClasses } from "../../api/classes.api";
import { listEnrollmentRequests } from "../../api/enrollments.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";

// HOD dashboard UI only.
// Must NOT define routes or API clients.
export default function HodDashboard() {
  const { scopeRef } = usePageAnimation();
  const [classes, setClasses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [classesRes, requestsRes] = await Promise.all([
          listDepartmentClasses(),
          listEnrollmentRequests(),
        ]);

        if (!isMounted) return;
        setClasses(classesRes.data?.classes || []);
        setRequests(requestsRes.data?.requests || []);
      } catch (err) {
        console.error("HOD dashboard load error:", err);
        if (isMounted) {
          setError("Unable to load department data.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasContent = useMemo(
    () => classes.length > 0 || requests.length > 0,
    [classes, requests]
  );

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">
            HOD Dashboard
          </h1>
          <p className="text-slate-500">Department overview</p>
        </div>

        {loading && (
          <p className="text-slate-500">Loading department data...</p>
        )}
        {!loading && error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="anim-item grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Department Classes
              </h2>
              <p className="text-sm text-slate-500">
                Classes owned by this department
              </p>

              {classes.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No classes yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {classes.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl border border-slate-100 p-3"
                    >
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-sm text-slate-500">
                        {item.subject_name} · {item.teacher_name} · Year {item.year}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Enrollment Requests
              </h2>
              <p className="text-sm text-slate-500">
                Pending requests in this department
              </p>

              {requests.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No pending requests.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {requests.map((request) => (
                    <li
                      key={request.id}
                      className="rounded-xl border border-slate-100 p-3"
                    >
                      <div className="font-medium text-slate-900">
                        {request.student_name} ({request.roll_no})
                      </div>
                      <div className="text-sm text-slate-500">
                        {request.class_name}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {!loading && !error && !hasContent && (
          <p className="text-sm text-slate-500">
            No department data available yet.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
