// UI-only page for viewing the teacher profile.
// Must NOT define routes or implement auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getMyTeacherProfile } from "../../api/teachers.api";

const TeacherProfile = () => {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const response = await getMyTeacherProfile();
        if (isMounted) {
          setTeacher(response.data?.teacher || null);
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
      {teacher && !loading && (
        <div>
          <p>Name: {teacher.name}</p>
          <p>Email: {teacher.email}</p>
          <p>Department: {teacher.department_id || "-"}</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeacherProfile;

