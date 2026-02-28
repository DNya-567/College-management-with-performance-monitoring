// UI-only page for teachers to review enrollment requests.
// Must NOT define routes or implement auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { http } from "../../api/http";
import { usePageAnimation } from "../../hooks/usePageAnimation";

const EnrollmentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { scopeRef } = usePageAnimation();

  const loadRequests = async () => {
    try {
      const response = await http.get("/enrollments/requests");
      setRequests(response.data?.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await http.post(`/enrollments/${id}/${action}`);
      setRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    }
  };

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">
            Enrollment Requests
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and approve student enrollment requests.
          </p>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="anim-item grid gap-3">
            {requests.length === 0 ? (
              <p className="text-sm text-slate-500">No pending requests.</p>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {req.student_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {req.roll_no} · {req.class_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAction(req.id, "approve")}
                      className="rounded-full bg-[#0052FF] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-600"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(req.id, "reject")}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EnrollmentRequests;
