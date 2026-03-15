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
 * GET /api/departments/:departmentId/teacher/:teacherId/performance
 * HOD-only: Get average performance stats for a teacher's classes
 */
exports.getTeacherPerformance = async (req, res) => {
  const { departmentId, teacherId } = req.params;
  const { semester_id } = req.query;
  const logger = require("../../config/logger");

  if (!teacherId) {
    return res.status(400).json({ message: "Teacher ID is required." });
  }

  if (!departmentId) {
    return res.status(400).json({ message: "Department ID is required." });
  }

  try {
    logger.info("Fetching teacher performance", {
      departmentId,
      teacherId,
      semesterId: semester_id,
      correlationId: req.correlationId
    });

    // First verify teacher belongs to this department
    const teacherVerify = await db.query(
      "SELECT id FROM teachers WHERE id = $1 AND department_id = $2",
      [teacherId, departmentId]
    );

    if (teacherVerify.rowCount === 0) {
      logger.warn("Teacher not found in department", {
        teacherId,
        departmentId,
        correlationId: req.correlationId
      });
      return res.status(404).json({ message: "Teacher not found in this department." });
    }

    logger.info("Teacher verified - fetching classes", {
      teacherId,
      correlationId: req.correlationId
    });

    // Get teacher's classes and their average performance
    // Filter by semester_id if provided
    let query = `SELECT c.id, c.name, c.year, s.name as subject_name,
              COUNT(DISTINCT ce.student_id) as enrolled_students,
              CAST(AVG(COALESCE(m.score, 0)) AS NUMERIC(10,2)) as avg_marks,
              CAST(AVG(CASE
                WHEN m.score IS NOT NULL AND m.total_marks > 0
                THEN (CAST(m.score AS FLOAT) / m.total_marks * 100)
                ELSE 0
              END) AS NUMERIC(10,2)) as avg_percentage,
              CAST(100 * COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.student_id END)
                    / NULLIF(COUNT(DISTINCT a.student_id), 0) AS NUMERIC(10,2)) as avg_attendance_pct
       FROM classes c
       LEFT JOIN subjects s ON s.id = c.subject_id
       LEFT JOIN class_enrollments ce ON ce.class_id = c.id AND ce.status = 'approved'
       LEFT JOIN marks m ON m.class_id = c.id`;

    let params = [teacherId];

    // Add semester filter for marks if provided
    if (semester_id) {
      query += ` AND m.semester_id = $2`;
      params.push(semester_id);
      query += ` LEFT JOIN attendance a ON a.class_id = c.id AND a.date >= (SELECT start_date FROM semesters WHERE id = $3 LIMIT 1) AND a.date <= (SELECT end_date FROM semesters WHERE id = $3 LIMIT 1)`;
      params.push(semester_id);
    } else {
      query += ` LEFT JOIN attendance a ON a.class_id = c.id`;
    }

    query += ` WHERE c.teacher_id = $1
       GROUP BY c.id, c.name, c.year, s.id, s.name
       ORDER BY c.name ASC`;

    const result = await db.query(query, params);

    logger.info("Teacher performance fetched successfully", {
      teacherId,
      classCount: result.rowCount,
      correlationId: req.correlationId
    });

    return res.json({ classes: result.rows });
  } catch (error) {
    logger.error("Error fetching teacher performance", {
      teacherId,
      departmentId,
      errorMessage: error.message,
      errorCode: error.code,
      step: "getTeacherPerformance",
      correlationId: req.correlationId
    });
    logger.logError(error, {
      teacherId,
      departmentId,
      step: "getTeacherPerformance",
      correlationId: req.correlationId
    });
    return res.status(500).json({ message: "Internal server error." });
  }
};
