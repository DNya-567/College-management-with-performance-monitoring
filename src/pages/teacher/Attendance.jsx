// UI-only page for teachers to mark attendance.
// Must NOT define routes or implement auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { http } from "../../api/http";

const today = () => new Date().toISOString().slice(0, 10);

const Attendance = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadClasses = async () => {
      try {
        const response = await http.get("/classes/mine");
        if (isMounted) setClasses(response.data?.classes || []);
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load classes.");
        }
      }
    };

    void loadClasses();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadStudents = async () => {
      if (!classId) {
        if (isMounted) {
          setStudents([]);
          setRecords({});
        }
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await http.get(`/classes/${classId}/students`);
        if (isMounted) {
          const list = response.data?.students || [];
          setStudents(list);
          const defaults = {};
          list.forEach((student) => {
            defaults[student.id] = "absent";
          });
          setRecords(defaults);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || "Failed to load approved students."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadStudents();

    return () => {
      isMounted = false;
    };
  }, [classId]);

  useEffect(() => {
    let isMounted = true;

    const loadAttendance = async () => {
      if (!classId || !date) return;

      try {
        const response = await http.get(
          `/classes/${classId}/attendance?date=${date}`
        );
        if (isMounted) {
          const next = { ...records };
          (response.data?.attendance || []).forEach((item) => {
            next[item.student_id] = item.status;
          });
          setRecords(next);
        }
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
  }, [classId, date, records]);

  const toggleStatus = (studentId) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    setError("");

    try {
      const payload = {
        date,
        records: students.map((student) => ({
          student_id: student.id,
          status: records[student.id] || "absent",
        })),
      };

      await http.post(`/classes/${classId}/attendance`, payload);
      setStatus("Attendance saved.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save attendance.");
    }
  };

  return (
    <DashboardLayout>
      <h1>Attendance</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="classSelect">Class</label>
        <select
          id="classSelect"
          value={classId}
          onChange={(event) => setClassId(event.target.value)}
        >
          <option value="">Select class</option>
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.year})
            </option>
          ))}
        </select>

        <label htmlFor="dateSelect">Date</label>
        <input
          id="dateSelect"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          disabled={!classId}
        />

        <button type="submit" disabled={!classId || loading}>
          Save Attendance
        </button>
      </form>

      {status && <p>{status}</p>}
      {error && <p role="alert">{error}</p>}

      <ul>
        {students.map((student) => (
          <li key={student.id}>
            {student.name} ({student.roll_no})
            <button type="button" onClick={() => toggleStatus(student.id)}>
              {records[student.id] === "present" ? "Present" : "Absent"}
            </button>
          </li>
        ))}
      </ul>
    </DashboardLayout>
  );
};

export default Attendance;
