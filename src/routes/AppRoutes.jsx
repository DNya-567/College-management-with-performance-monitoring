// Defines the application's route structure only.
// Must NOT perform API calls, manage auth state, or implement UI logic.
import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import AdminDashboard from "../pages/admin/Dashboard";
import TeacherDashboard from "../pages/teacher/Dashboard";
import StudentDashboard from "../pages/student/Dashboard";
import HodDashboard from "../pages/hod/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import { Navigate } from "react-router-dom";
import TeacherMarks from "../pages/teacher/Marks";
import StudentMarks from "../pages/student/MyMarks";
import TeacherClasses from "../pages/teacher/Classes";
import EnrollmentRequests from "../pages/teacher/EnrollmentRequests";
import JoinClasses from "../pages/student/JoinClasses";
import MyClasses from "../pages/student/MyClasses";
import Attendance from "../pages/teacher/Attendance";
import MyAttendance from "../pages/student/MyAttendance";
import TeacherProfile from "../pages/teacher/Profile";
import StudentProfile from "../pages/student/Profile";
import ClassDetails from "../pages/teacher/ClassDetails";

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
    <Route
      path="/admin"
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/teacher"
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherDashboard />
        </ProtectedRoute>
      }
    />

    <Route
      path="/teacher/marks"
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherMarks />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student"
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student/marks"
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentMarks />
        </ProtectedRoute>
      }
    />
    <Route
      path="/hod"
      element={
        <ProtectedRoute allowedRoles={["hod"]}>
          <HodDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/teacher/classes"
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherClasses />
        </ProtectedRoute>
      }
    />
    <Route
      path="/teacher/requests"
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <EnrollmentRequests />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student/join"
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <JoinClasses />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student/classes"
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <MyClasses />
        </ProtectedRoute>
      }
    />
    <Route
      path="/teacher/attendance"
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <Attendance />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student/attendance"
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <MyAttendance />
        </ProtectedRoute>
      }
    />
    <Route
      path="/teacher/profile"
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherProfile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student/profile"
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentProfile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/teacher/classes/:classId"
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <ClassDetails />
        </ProtectedRoute>
      }
    />
  </Routes>
);

export default AppRoutes;
