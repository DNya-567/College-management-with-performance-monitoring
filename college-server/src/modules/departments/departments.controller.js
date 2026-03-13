// Departments controller: database queries for department lookups only.
// Must NOT define routes or implement auth logic.
const db = require("../../config/db");

exports.listDepartments = async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name FROM departments ORDER BY name ASC"
    );
    return res.json({ departments: result.rows });
  } catch (error) {
    console.error("List departments error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/departments/:departmentId/teachers
 * HOD-only: List all teachers in the department
 */
exports.getTeachersByDepartment = async (req, res) => {
  const { departmentId } = req.params;

  if (!departmentId) {
    return res.status(400).json({ message: "Department ID is required." });
  }

  try {
    const result = await db.query(
      `SELECT t.id, t.name, t.user_id, u.email, u.is_active,
              COUNT(DISTINCT c.id) as total_classes,
              COUNT(DISTINCT ce.student_id) as total_students
       FROM teachers t
       JOIN users u ON u.id = t.user_id
       LEFT JOIN classes c ON c.teacher_id = t.id
       LEFT JOIN class_enrollments ce ON ce.class_id = c.id AND ce.status = 'approved'
       WHERE t.department_id = $1
       GROUP BY t.id, t.name, t.user_id, u.email, u.is_active
       ORDER BY t.name ASC`,
      [departmentId]
    );

    return res.json({ teachers: result.rows });
  } catch (error) {
    console.error("Get teachers by department error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/teachers/:teacherId/performance
 * HOD-only: Get average performance stats for a teacher's classes
 */
exports.getTeacherPerformance = async (req, res) => {
  const { teacherId } = req.params;

  if (!teacherId) {
    return res.status(400).json({ message: "Teacher ID is required." });
  }

  try {
    // Get teacher's classes and their average performance
    const result = await db.query(
      `SELECT c.id, c.name, c.year, s.name as subject_name,
              COUNT(DISTINCT ce.student_id) as enrolled_students,
              ROUND(AVG(m.score), 2) as avg_marks,
              ROUND(AVG(CAST(m.score AS FLOAT) / NULLIF(m.total_marks, 0) * 100), 2) as avg_percentage,
              ROUND(100 * COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.student_id END)
                    / NULLIF(COUNT(DISTINCT a.student_id), 0), 2) as avg_attendance_pct
       FROM classes c
       JOIN subjects s ON s.id = c.subject_id
       LEFT JOIN class_enrollments ce ON ce.class_id = c.id AND ce.status = 'approved'
       LEFT JOIN marks m ON m.class_id = c.id
       LEFT JOIN attendance a ON a.class_id = c.id
       WHERE c.teacher_id = $1
       GROUP BY c.id, c.name, c.year, s.name
       ORDER BY c.name ASC`,
      [teacherId]
    );

    return res.json({ classes: result.rows });
  } catch (error) {
    console.error("Get teacher performance error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
