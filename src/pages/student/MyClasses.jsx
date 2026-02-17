// UI-only page for students to view approved classes.
// Must NOT define routes or implement auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { http } from "../../api/http";

const MyClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadClasses = async () => {
      try {
        const response = await http.get("/enrollments/mine");
        if (isMounted) setClasses(response.data?.classes || []);
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load classes.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadClasses();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <h1>My Classes</h1>
      {loading && <p>Loading...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && (
        <ul>
          {classes.map((item) => (
            <li key={item.class_id}>
              {item.class_name} - {item.subject_name} ({item.year})
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
};

export default MyClasses;
