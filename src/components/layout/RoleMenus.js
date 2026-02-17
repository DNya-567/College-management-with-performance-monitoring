// Role menu configuration only.
// Must NOT contain UI, routing logic, or data fetching.
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  Shield,
  User,
  GraduationCap,
  PlusCircle,
} from "lucide-react";

export const roleMenus = {
  admin: [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Marks", path: "/admin/marks", icon: ClipboardList },
  ],
  teacher: [
    { label: "Dashboard", path: "/teacher", icon: LayoutDashboard },
    { label: "Profile", path: "/teacher/profile", icon: User },
    { label: "Enter Marks", path: "/teacher/marks", icon: ClipboardList },
    { label: "My Classes", path: "/teacher/classes", icon: BookOpen },
    { label: "Enrollment Requests", path: "/teacher/requests", icon: Inbox },
    { label: "Attendance", path: "/teacher/attendance", icon: CalendarCheck },
  ],
  student: [
    { label: "Dashboard", path: "/student", icon: LayoutDashboard },
    { label: "Profile", path: "/student/profile", icon: User },
    { label: "My Marks", path: "/student/marks", icon: GraduationCap },
    { label: "Join Classes", path: "/student/join", icon: PlusCircle },
    { label: "My Classes", path: "/student/classes", icon: BookOpen },
    { label: "My Attendance", path: "/student/attendance", icon: CalendarCheck },
  ],
  hod: [
    { label: "Dashboard", path: "/hod", icon: LayoutDashboard },
    { label: "Marks", path: "/hod/marks", icon: Shield },
  ],
};
