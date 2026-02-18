const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const authRoutes = require("./modules/auth/auth.routes");
const marksRoutes = require("./modules/marks/marks.routes");
const classesRoutes = require("./modules/classes/classes.routes");
const enrollmentsRoutes = require("./modules/enrollments/enrollments.routes");
const attendanceRoutes = require("./modules/attendance/attendance.routes");
const subjectsRoutes = require("./modules/subjects/subjects.routes");
const teachersRoutes = require("./modules/teachers/teachers.routes");
const studentsRoutes = require("./modules/students/students.routes");
const announcementsRoutes = require("./modules/announcements/announcements.routes");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(express.json());

// Request logger (temporary)
// TODO: replace with proper logger
app.use((req, _res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// Health check (DB)
app.get("/api/health/db", async (req, res) => {
  const result = await db.query("SELECT 1 AS ok");
  res.json({ ok: true, db: result.rows[0] });
});

// Routes only: mounts module routers, no business logic here.
app.use("/api/auth", authRoutes);
app.use("/api", marksRoutes);
app.use("/api/classes", classesRoutes);
app.use("/api/enrollments", enrollmentsRoutes);
app.use("/api", attendanceRoutes);
app.use("/api/subjects", subjectsRoutes);
app.use("/api/teachers", teachersRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/announcements", announcementsRoutes);
module.exports = app;
