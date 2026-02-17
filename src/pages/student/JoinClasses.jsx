// UI-only page for students to request class enrollment.
// Must NOT define routes or implement auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { http } from "../../api/http";

const JoinClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadClasses = async () => {
    try {
      const response = await http.get("/classes");
      setClasses(response.data?.classes || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load classes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClasses();
  }, []);

  const handleJoin = async (classId) => {
    try {
      await http.post(`/classes/${classId}/join`);
      setClasses((prev) => prev.filter((item) => item.id !== classId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request enrollment.");
    }
  };

  return (
    <DashboardLayout>
      <h1>Join Classes</h1>
      {loading && <p>Loading...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && (
        <ul>
          {classes.map((item) => (
            <li key={item.id}>
              {item.name} - {item.subject_name} ({item.year})
              <button type="button" onClick={() => handleJoin(item.id)}>
                Request to Join
              </button>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
};

export default JoinClasses;
