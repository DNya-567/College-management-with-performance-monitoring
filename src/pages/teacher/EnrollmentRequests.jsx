// UI-only page for teachers to review enrollment requests.
// Must NOT define routes or implement auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { http } from "../../api/http";

const EnrollmentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <h1>Enrollment Requests</h1>
      {loading && <p>Loading...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && (
        <ul>
          {requests.map((req) => (
            <li key={req.id}>
              {req.student_name} ({req.roll_no}) - {req.class_name}
              <button type="button" onClick={() => handleAction(req.id, "approve")}>
                Approve
              </button>
              <button type="button" onClick={() => handleAction(req.id, "reject")}>
                Reject
              </button>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
};

export default EnrollmentRequests;
