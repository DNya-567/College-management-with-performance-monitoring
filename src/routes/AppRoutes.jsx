// Defines the application's route structure only.
// Must NOT perform API calls, manage auth state, or implement UI logic.
import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import AdminDashboard from "../pages/admin/Dashboard";
import ManageUsers from "../pages/admin/ManageUsers";
import ManageDepartments from "../pages/admin/ManageDepartments";
import ManageTeachers from "../pages/admin/ManageTeachers";
import ManageStudents from "../pages/admin/ManageStudents";
import SystemOverview from "../pages/admin/SystemOverview";
import ManageSemesters from "../pages/admin/ManageSemesters";
import AdminProfile from "../pages/admin/Profile";
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
import TeacherAnnouncements from "../pages/teacher/Announcements";
import StudentAnnouncements from "../pages/student/Announcements";
import HodDepartmentClasses from "../pages/hod/DepartmentClasses";
import HodClassDetails from "../pages/hod/ClassDetails";
import HodEnrollmentRequests from "../pages/hod/EnrollmentRequests";
import HodAnnouncements from "../pages/hod/Announcements";
import HodPerformance from "../pages/hod/Performance";
import TeacherManagement from "../pages/hod/Teachers";
import TeacherSchedules from "../pages/teacher/Schedules";
import HodSchedules from "../pages/hod/Schedules";
import StudentSchedules from "../pages/student/Schedules";
import NotFound from "../pages/NotFound";

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="*" element={<NotFound />} />
    <Route
      path="/admin"
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/users"
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <ManageUsers />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/departments"
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <ManageDepartments />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/teachers"
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <ManageTeachers />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/students"
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <ManageStudents />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/overview"
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <SystemOverview />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/semesters"
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <ManageSemesters />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/profile"
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminProfile />
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
      path="/hod/classes"
      element={
        <ProtectedRoute allowedRoles={["hod"]}>
          <HodDepartmentClasses />
        </ProtectedRoute>
      }
    />
    <Route
      path="/hod/classes/:classId"
      element={
        <ProtectedRoute allowedRoles={["hod"]}>
          <HodClassDetails />
        </ProtectedRoute>
      }
    />
    <Route
      path="/hod/requests"
      element={
        <ProtectedRoute allowedRoles={["hod"]}>
          <HodEnrollmentRequests />
        </ProtectedRoute>
      }
    />
    <Route
      path="/hod/announcements"
      element={
        <ProtectedRoute allowedRoles={["hod"]}>
          <HodAnnouncements />
        </ProtectedRoute>
      }
    />
    <Route
      path="/hod/performance"
      element={
        <ProtectedRoute allowedRoles={["hod"]}>
          <HodPerformance />
        </ProtectedRoute>
      }
    />
    <Route
      path="/hod/teachers"
      element={
        <ProtectedRoute allowedRoles={["hod"]}>
          <TeacherManagement />
        </ProtectedRoute>
      }
    />
    <Route
      path="/hod/profile"
      element={
        <ProtectedRoute allowedRoles={["hod"]}>
          <TeacherProfile />
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
    <Route
      path="/teacher/announcements"
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherAnnouncements />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student/announcements"
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentAnnouncements />
        </ProtectedRoute>
      }
    />
    <Route
      path="/teacher/schedules"
      element={
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherSchedules />
        </ProtectedRoute>
      }
    />
    <Route
      path="/hod/schedules"
      element={
        <ProtectedRoute allowedRoles={["hod"]}>
          <HodSchedules />
        </ProtectedRoute>
      }
    />
    <Route
      path="/student/schedules"
      element={
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentSchedules />
        </ProtectedRoute>
      }
    />
  </Routes>
);

export default AppRoutes;
