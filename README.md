# 🎓 College Management System with Performance Monitoring

## 📋 Project Description

A **full-stack College Management System** built to digitize and streamline academic operations across multiple roles — **Admin, HOD, Teacher, and Student**. The platform enables end-to-end management of classes, enrollments, attendance, marks, announcements, and student performance analytics with a clean, role-based access control (RBAC) architecture.

Teachers can create classes, approve student enrollments, record attendance via an interactive GitHub-style heatmap, enter and edit marks with validation, and broadcast class-scoped announcements. Students can discover and request to join classes, view their attendance visually, track marks with percentage calculations, and monitor their academic performance through trend charts and summary dashboards. HODs oversee department-level data including class performance, enrollment management, and departmental analytics.

The system enforces strict separation of concerns across the codebase — API calls, routing, auth state, and UI are isolated into dedicated layers — making it production-grade, maintainable, and scalable.

---

## 🛠️ Tech Stack

| Layer            | Technology                                                                              |
|------------------|-----------------------------------------------------------------------------------------|
| **Frontend**     | React 19, Vite 7, Tailwind CSS, React Router v7, Axios, Recharts, GSAP, Lucide React   |
| **Backend**      | Node.js, Express 5, JWT Authentication, bcrypt                                          |
| **Database**     | PostgreSQL with parameterized SQL queries, UUID primary keys, pgcrypto                  |
| **Auth**         | JSON Web Tokens (JWT) with role-based access control (RBAC)                             |
| **Dev Tools**    | ESLint, Nodemon, PostCSS, Autoprefixer, Vite HMR                                       |
| **Architecture** | Monorepo (client + server), Modular MVC, Layered separation of concerns                 |

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based login with secure token storage
- Role-based registration (Student & Teacher flows with profile creation)
- Protected routes with frontend RBAC guards
- Role-specific dashboards (Admin, HOD, Teacher, Student)

### 👨‍🏫 Teacher Module
- **Class Management** — Create classes with subject name and year; view all owned classes
- **Enrollment Approval** — View pending student join requests; approve/reject with one click
- **Marks Entry** — Enter marks per class with student dropdowns sorted by roll number; enforces max marks validation
- **Marks Editing** — Edit previously entered marks with inline editing; disables re-entry for already graded students
- **Attendance Tracking** — Interactive GitHub-style heatmap for marking attendance; bulk select with present/absent toggles
- **Class-Scoped Announcements** — Create announcements targeted to specific classes
- **Dashboard Analytics** — Top 5 students by attendance, class performance overview
- **Teacher Profile** — View personal profile information

### 👨‍🎓 Student Module
- **Class Discovery & Enrollment** — Search and request to join classes; view pending enrollment status
- **My Classes** — View all approved/enrolled classes
- **View Marks** — Marks displayed with subject name, teacher name, score, total marks, and percentage
- **Performance Summary** — Avg score %, attendance %, subjects enrolled, class rank
- **Performance Trend Chart** — Exam-wise line chart showing academic progress over time (Recharts)
- **Attendance Heatmap** — GitHub-style visual attendance per class with Sunday holiday markers
- **Class-Scoped Announcements** — View announcements posted by teachers for enrolled classes
- **Student Profile** — Basic info (name, roll no, class) with subject-wise attendance summary
- **At-Risk Alerts** — Flagged if marks < 20% or attendance < 30% for a subject

### 🏛️ HOD Module
- **Department Overview** — View all classes and teachers under the department
- **Department Classes** — Drill into class details with student lists
- **Enrollment Management** — Manage department-level enrollment requests
- **Performance Analytics** — Department-wide class performance monitoring
- **Announcements** — View and manage department-scoped announcements

### 📊 Analytics & Performance
- Subject difficulty analysis (top 5 hardest subjects by average score)
- Class-wise performance aggregation for teachers and HODs
- Student performance trend (exam-wise percentage line chart)
- Attendance-based ranking system
- At-risk student detection (marks < 20%, attendance < 30%)

### 🏗️ Architecture & Code Quality
- **Strict separation of concerns** — API layer, routing, auth state, and UI are fully isolated
- **Modular backend** — Each feature has dedicated `routes.js` and `controller.js`
- **Parameterized SQL** — All queries use parameterized inputs to prevent SQL injection
- **JWT-derived authorization** — Teacher/student IDs derived from JWT on the backend; never accepted from the frontend
- **Database integrity** — UUID PKs, foreign key constraints, unique indexes, CHECK constraints
- **Memory monitoring** — Server-side memory usage logging for performance profiling
- **Animated UI** — GSAP-powered page transitions and component animations

---

## 📁 Project Structure

```
college-client/                  # Frontend (React + Vite)
├── src/
│   ├── api/                     # Axios API layer (http, auth, marks, attendance, etc.)
│   ├── auth/                    # AuthContext, useAuth hook
│   ├── components/              # Reusable UI (Sidebar, AttendanceHeatmap, DashboardLayout)
│   ├── hooks/                   # Custom hooks (usePageAnimation, useStudentEnrollments)
│   ├── pages/                   # Role-based pages (admin, hod, teacher, student)
│   └── routes/                  # AppRoutes, ProtectedRoute (RBAC guard)
│
college-server/                  # Backend (Express + PostgreSQL)
├── src/
│   ├── config/                  # Database connection, environment config
│   ├── middlewares/              # JWT auth middleware, role-based access middleware
│   ├── modules/                 # Feature modules (auth, classes, marks, attendance, etc.)
│   └── utils/                   # Lookup helpers
├── sql/                         # Database migration scripts
└── schema.dbml                  # Visual database schema (dbdiagram.io compatible)
```

---

## 🗄️ Database Schema

10 tables with full relational integrity:

**users** → **teachers** / **students** → **departments**, **classes**, **subjects** → **class_enrollments**, **marks**, **attendance**, **announcements**

> Visual schema available in `college-server/schema.dbml` — paste into [dbdiagram.io](https://dbdiagram.io) to view.

---

## 🚀 Getting Started

```bash
# Frontend
cd college-client
npm install
npm run dev          # http://localhost:5173

# Backend
cd college-server
npm install
node src/server.js   # http://localhost:5000
```

**Environment Variables** (`.env` in `college-server/`):
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=college_db
JWT_SECRET=your_secret_key
```

---

## 📚 Documentation & Guides

### Quick References
- **[FINAL_VERIFICATION_GUIDE.md](./FINAL_VERIFICATION_GUIDE.md)** — Complete walkthrough for local testing, API endpoints, and troubleshooting
- **[DEPLOYMENT_FIXES_SUMMARY.md](./DEPLOYMENT_FIXES_SUMMARY.md)** — All fixes applied, verified working components, and deployment checklist

### Student Registration with Departments
Students can select from **8 pre-configured departments** during registration:
1. Computer Science
2. Mechanical Engineering
3. Electrical Engineering
4. Civil Engineering
5. Information Technology
6. Electronics & Communication
7. Chemical Engineering
8. Biomedical Engineering

---

## ✅ Recent Fixes (April 18, 2026)

- ✅ **Fixed Attendance Routes** — Removed undefined `markAttendance` variable  
- ✅ **Verified All Exports** — All 18 controller files use proper ES6 syntax
- ✅ **Student Registration** — Department selection fully functional
- ✅ **Database** — 8 departments pre-configured and ready
- ✅ **API Responses** — All endpoints return correct formats
- ✅ **Module Loading** — No ESM/CommonJS conflicts

**Status:** 🟢 **READY FOR PRODUCTION DEPLOYMENT**

See [FINAL_VERIFICATION_GUIDE.md](./FINAL_VERIFICATION_GUIDE.md) for complete testing walkthrough.
