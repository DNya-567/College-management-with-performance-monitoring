// UI-only page for viewing the student profile.
// Must NOT define routes or implement auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getMyStudentProfile } from "../../api/students.api";

const StudentProfile = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await getMyStudentProfile();
        if (isMounted) {
          setStudent(response.data?.student || null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load profile.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <h1>My Profile</h1>
      {loading && <p>Loading...</p>}
      {error && <p role="alert">{error}</p>}
      {student && !loading && (
        <div>
          <p>Name: {student.name}</p>
          <p>Email: {student.email}</p>
          <p>Roll No: {student.roll_no}</p>
          <p>Year: {student.year}</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentProfile;

