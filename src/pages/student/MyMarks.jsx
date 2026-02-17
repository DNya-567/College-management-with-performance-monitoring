// UI-only page for students to view their marks.
// Must NOT define routes or implement auth logic.
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { http } from "../../api/http";

const MyMarks = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedClassLabel = useMemo(() => {
    return classes.find((item) => item.class_id === selectedClassId)?.class_name || "";
  }, [classes, selectedClassId]);

  useEffect(() => {
    let isMounted = true;

    const loadClasses = async () => {
      try {
        const response = await http.get("/enrollments/mine");
        const classList = response.data?.classes || [];
        if (isMounted) {
          setClasses(classList);
          setSelectedClassId(classList[0]?.class_id || "");
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

    const loadMarks = async () => {
      if (!selectedClassId) {
        if (isMounted) setMarks([]);
        return;
      }

      try {
        const response = await http.get(`/classes/${selectedClassId}/my-marks`);
        if (isMounted) setMarks(response.data?.marks || []);
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load marks.");
        }
      }
    };

    void loadMarks();

    return () => {
      isMounted = false;
    };
  }, [selectedClassId]);

  return (
    <DashboardLayout>
      <h1>My Marks</h1>
      {loading && <p>Loading...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && (
        <>
          <label htmlFor="classSelect">Class</label>
          <select
            id="classSelect"
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
          >
            <option value="">Select class</option>
            {classes.map((item) => (
              <option key={item.class_id} value={item.class_id}>
                {item.class_name} ({item.year})
              </option>
            ))}
          </select>
          {selectedClassId && (
            <p>
              Showing marks for <strong>{selectedClassLabel}</strong>
            </p>
          )}
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Score</th>
                <th>Exam Type</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((mark) => (
                <tr key={mark.id}>
                  <td>{mark.subject_name}</td>
                  <td>{mark.teacher_name}</td>
                  <td>{mark.score}</td>
                  <td>{mark.exam_type}</td>
                  <td>{mark.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </DashboardLayout>
  );
};

export default MyMarks;
