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
  BarChart3,
  Users,
} from "lucide-react";

export const roleMenus = {
  admin: [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Marks", path: "/admin/marks", icon: ClipboardList },
  ],
  teacher: [
    { label: "Dashboard", path: "/teacher", icon: LayoutDashboard },
    { label: "Profile", path: "/teacher/profile", icon: User },
    { label: "Announcements", path: "/teacher/announcements", icon: Inbox },
    { label: "Enter Marks", path: "/teacher/marks", icon: ClipboardList },
    { label: "My Classes", path: "/teacher/classes", icon: BookOpen },
    { label: "Enrollment Requests", path: "/teacher/requests", icon: Inbox },
    { label: "Attendance", path: "/teacher/attendance", icon: CalendarCheck },
  ],
  student: [
    { label: "Dashboard", path: "/student", icon: LayoutDashboard },
    { label: "Profile", path: "/student/profile", icon: User },
    { label: "Announcements", path: "/student/announcements", icon: Inbox },
    { label: "View Marks", path: "/student/marks", icon: GraduationCap },
    { label: "Join Classes", path: "/student/join", icon: PlusCircle },
    { label: "My Classes", path: "/student/classes", icon: BookOpen },
  ],
  hod: [
    { label: "Dashboard", path: "/hod", icon: LayoutDashboard },
    { label: "Dept Classes", path: "/hod/classes", icon: BookOpen },
    { label: "Enrollment Requests", path: "/hod/requests", icon: Users },
    { label: "Announcements", path: "/hod/announcements", icon: Inbox },
    { label: "Performance", path: "/hod/performance", icon: BarChart3 },
    { label: "Profile", path: "/hod/profile", icon: User },
  ],
};
