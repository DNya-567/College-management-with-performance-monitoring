// HOD Enrollment Requests: view and approve/reject pending requests in the department.
// Must NOT define routes or API clients.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { listEnrollmentRequests, approveEnrollment, rejectEnrollment } from "../../api/enrollments.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";

export default function HodEnrollmentRequests() {
  const { scopeRef } = usePageAnimation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listEnrollmentRequests();
      setRequests(res.data?.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const handleAction = async (id, action) => {
    setActionLoading((prev) => ({ ...prev, [id]: action }));
    try {
      if (action === "approve") await approveEnrollment(id);
      else await rejectEnrollment(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action}.`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">Enrollment Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Pending enrollment requests across your department.</p>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        {!loading && !error && requests.length === 0 && (
          <div className="anim-item rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">No pending enrollment requests.</p>
          </div>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="anim-item space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {r.student_name}{" "}
                    <span className="font-normal text-slate-400">({r.roll_no})</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    wants to join <span className="font-medium text-slate-700">{r.class_name}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(r.id, "approve")}
                    disabled={!!actionLoading[r.id]}
                    className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {actionLoading[r.id] === "approve" ? "…" : "Approve"}
                  </button>
                  <button
                    onClick={() => handleAction(r.id, "reject")}
                    disabled={!!actionLoading[r.id]}
                    className="rounded-full bg-red-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-600 disabled:opacity-50"
                  >
                    {actionLoading[r.id] === "reject" ? "…" : "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

