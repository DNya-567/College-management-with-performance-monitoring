// UI-only page for students to view attendance.
// Must NOT define routes or implement auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { http } from "../../api/http";

const MyAttendance = () => {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadClasses = async () => {
      try {
        const response = await http.get("/enrollments/mine");
        const list = response.data?.classes || [];
        if (isMounted) {
          setClasses(list);
          setClassId(list[0]?.class_id || "");
        }
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

  useEffect(() => {
    let isMounted = true;

    const loadAttendance = async () => {
      if (!classId) {
        if (isMounted) setAttendance([]);
        return;
      }

      try {
        const response = await http.get(`/classes/${classId}/my-attendance`);
        if (isMounted) setAttendance(response.data?.attendance || []);
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load attendance.");
        }
      }
    };

    void loadAttendance();

    return () => {
      isMounted = false;
    };
  }, [classId]);

  return (
    <DashboardLayout>
      <h1>My Attendance</h1>
      {loading && <p>Loading...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && (
        <>
          <label htmlFor="classSelect">Class</label>
          <select
            id="classSelect"
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
          >
            <option value="">Select class</option>
            {classes.map((item) => (
              <option key={item.class_id} value={item.class_id}>
                {item.class_name} ({item.year})
              </option>
            ))}
          </select>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </DashboardLayout>
  );
};

export default MyAttendance;
