import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";

// Teacher Dashboard: landing page for teacher role
// Responsibility: show quick actions for teachers
// Must NOT fetch data or contain business logic

export default function TeacherDashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <h1>Teacher Dashboard</h1>
      <p>Quick actions</p>

      <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
        <button onClick={() => navigate("/teacher/marks")}>
          Enter Marks
        </button>

        <button onClick={() => navigate("/teacher/attendance")}>
          Attendance
        </button>
      </div>
    </DashboardLayout>
  );
}
