// Performance controller: aggregates marks + attendance data for analytics.
// Must NOT define routes or implement auth logic.
// Must NOT read Authorization headers — uses req.user set by auth middleware.
const db = require("../../config/db");
const { getStudentId, getTeacherId } = require("../../utils/lookups");

/**
 * GET /api/performance/me
 * Returns the logged-in student's performance summary:
 *   avg_score (%), attendance_pct, subject_count, rank, total_students,
 *   subjects: [{ name, avg_score, attendance_pct }]
 */
exports.getMyPerformance = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const studentId = await getStudentId(userId);
    if (!studentId) {
      return res.status(403).json({ message: "Student profile not found." });
    }

    // 1) Overall avg score across all marks
    const scoreRes = await db.query(
      `SELECT
         COUNT(DISTINCT subject_id) AS subject_count,
         ROUND(100.0 * SUM(score) / NULLIF(SUM(total_marks), 0), 1) AS avg_score
       FROM marks
       WHERE student_id = $1`,
      [studentId]
    );

    const avgScore = Math.min(Number(scoreRes.rows[0]?.avg_score ?? 0), 100);
    const subjectCount = Number(scoreRes.rows[0]?.subject_count ?? 0);

    // 2) Overall attendance %
    const attendanceRes = await db.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present
       FROM attendance
       WHERE student_id = $1`,
      [studentId]
    );

    const totalSessions = Number(attendanceRes.rows[0]?.total ?? 0);
    const presentSessions = Number(attendanceRes.rows[0]?.present ?? 0);
    const attendancePct = totalSessions
      ? Math.round((presentSessions / totalSessions) * 100)
      : 0;

    // 3) Rank among classmates (students who share at least one class via class_enrollments)
    //    Rank is based on avg score %.
    const rankRes = await db.query(
      `WITH peer_scores AS (
         SELECT
           m.student_id,
           ROUND(100.0 * SUM(m.score) / NULLIF(SUM(m.total_marks), 0), 1) AS avg_score
         FROM marks m
         WHERE m.student_id IN (
           SELECT DISTINCT ce2.student_id
           FROM class_enrollments ce1
           JOIN class_enrollments ce2
             ON ce2.class_id = ce1.class_id AND ce2.status = 'approved'
           WHERE ce1.student_id = $1 AND ce1.status = 'approved'
         )
         GROUP BY m.student_id
       )
       SELECT
         (SELECT COUNT(*) FROM peer_scores WHERE avg_score > (SELECT avg_score FROM peer_scores WHERE student_id = $1)) + 1 AS rank,
         (SELECT COUNT(*) FROM peer_scores) AS total_students`,
      [studentId]
    );

    const rank = Number(rankRes.rows[0]?.rank ?? 0);
    const totalStudents = Number(rankRes.rows[0]?.total_students ?? 0);

    // 4) Per-subject breakdown
    const subjectsRes = await db.query(
      `SELECT
         s.name,
         ROUND(100.0 * SUM(m.score) / NULLIF(SUM(m.total_marks), 0), 1) AS avg_score
       FROM marks m
       JOIN subjects s ON s.id = m.subject_id
       WHERE m.student_id = $1
       GROUP BY s.id, s.name
       ORDER BY s.name ASC`,
      [studentId]
    );

    // Per-subject attendance (attendance is per class, subjects map via classes.subject_id)
    const subjectAttendanceRes = await db.query(
      `SELECT
         s.name,
         COUNT(a.id) AS total,
         SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present
       FROM attendance a
       JOIN classes c ON c.id = a.class_id
       JOIN subjects s ON s.id = c.subject_id
       WHERE a.student_id = $1
       GROUP BY s.id, s.name
       ORDER BY s.name ASC`,
      [studentId]
    );

    const attendanceMap = {};
    subjectAttendanceRes.rows.forEach((row) => {
      const t = Number(row.total || 0);
      attendanceMap[row.name] = t ? Math.min(Math.round((Number(row.present) / t) * 100), 100) : 0;
    });

    const subjects = subjectsRes.rows.map((row) => ({
      name: row.name,
      avg_score: Math.min(Number(row.avg_score ?? 0), 100),
      attendance_pct: Math.min(attendanceMap[row.name] ?? 0, 100),
    }));

    return res.json({
      avg_score: avgScore,
      attendance_pct: attendancePct,
      subject_count: subjectCount,
      rank,
      total_students: totalStudents,
      subjects,
    });
  } catch (error) {
    console.error("Get my performance error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/performance/class/:classId
 * Returns performance of every approved student in a class (teacher view).
 * Each student: { student_id, name, roll_no, avg_score, attendance_pct, rank }
 */
exports.getClassPerformance = async (req, res) => {
  const { classId } = req.params;
  const userId = req.user?.userId;

  if (!classId || !userId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const teacherId = await getTeacherId(userId);
    if (!teacherId) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }

    // Verify teacher owns this class
    const classRes = await db.query(
      "SELECT id FROM classes WHERE id = $1 AND teacher_id = $2",
      [classId, teacherId]
    );
    if (classRes.rowCount === 0) {
      return res.status(403).json({ message: "Class not found for teacher." });
    }

    // All approved students in this class with marks + attendance
    const result = await db.query(
      `SELECT
         s.id AS student_id,
         s.name,
         s.roll_no,
         COALESCE(ROUND(100.0 * SUM(m.score) / NULLIF(SUM(m.total_marks), 0), 1), 0) AS avg_score,
         COALESCE(att.attendance_pct, 0) AS attendance_pct
       FROM class_enrollments ce
       JOIN students s ON s.id = ce.student_id
       LEFT JOIN marks m ON m.student_id = s.id AND m.class_id = $1
       LEFT JOIN LATERAL (
         SELECT
           ROUND(100.0 * SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) AS attendance_pct
         FROM attendance a
         WHERE a.class_id = $1 AND a.student_id = s.id
       ) att ON true
       WHERE ce.class_id = $1 AND ce.status = 'approved'
       GROUP BY s.id, s.name, s.roll_no, att.attendance_pct
       ORDER BY avg_score DESC, s.roll_no ASC`,
      [classId]
    );

    // Add rank (already sorted by avg_score DESC)
    const students = result.rows.map((row, index) => ({
      ...row,
      avg_score: Math.min(Number(row.avg_score), 100),
      attendance_pct: Math.min(Number(row.attendance_pct), 100),
      rank: index + 1,
    }));

    return res.json({ students });
  } catch (error) {
    console.error("Get class performance error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/performance/me/trend
 * Returns exam-wise performance trend for the logged-in student.
 * Response: { trend: [{ exam, percentage }] }
 * percentage = SUM(score) / SUM(total_marks) * 100 grouped by exam_type
 */
exports.getMyTrend = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const studentId = await getStudentId(userId);
    if (!studentId) {
      return res.status(403).json({ message: "Student profile not found." });
    }

    const result = await db.query(
      `SELECT
         exam_type AS exam,
         ROUND(100.0 * SUM(score) / NULLIF(SUM(total_marks), 0), 1) AS percentage
       FROM marks
       WHERE student_id = $1
       GROUP BY exam_type
       ORDER BY
         CASE exam_type
           WHEN 'internal' THEN 1
           WHEN 'midterm'  THEN 2
           WHEN 'final'    THEN 3
           ELSE 4
         END`,
      [studentId]
    );

    const trend = result.rows.map((row) => ({
      exam: row.exam,
      percentage: Math.min(Number(row.percentage ?? 0), 100),
    }));

    return res.json({ trend });
  } catch (error) {
    console.error("Get my trend error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

