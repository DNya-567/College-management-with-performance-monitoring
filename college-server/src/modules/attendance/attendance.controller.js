// Attendance controller: database logic for attendance only.
// Must NOT define routes or implement auth logic.
const db = require("../../config/db");
const { getTeacherId, getStudentId, getDepartmentId } = require("../../utils/lookups");

const isValidStatus = (status) => status === "present" || status === "absent";

const isSunday = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === 0;
};

exports.createAttendance = async (req, res) => {
  const { classId } = req.params;
  const { date, records } = req.body;
  const teacherUserId = req.user?.userId;

  if (!classId || !date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  if (isSunday(date)) {
    return res.status(400).json({ message: "Attendance cannot be marked on Sundays." });
  }

  if (!teacherUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const invalidRecord = records.find(
    (record) => !record.student_id || !isValidStatus(record.status)
  );

  if (invalidRecord) {
    return res.status(400).json({ message: "Invalid attendance record." });
  }

  try {
    const teacherId = await getTeacherId(teacherUserId);
    if (!teacherId) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }

    const classRes = await db.query(
      "SELECT id FROM classes WHERE id = $1 AND teacher_id = $2",
      [classId, teacherId]
    );

    if (classRes.rowCount === 0) {
      return res.status(403).json({ message: "Class not found for teacher." });
    }

    const studentIds = records.map((record) => record.student_id);
    const approvedRes = await db.query(
      "SELECT student_id FROM class_enrollments WHERE class_id = $1 AND status = 'approved' AND student_id = ANY($2)",
      [classId, studentIds]
    );

    const approvedSet = new Set(approvedRes.rows.map((row) => row.student_id));
    const hasUnapproved = studentIds.some((id) => !approvedSet.has(id));

    if (hasUnapproved) {
      return res.status(403).json({ message: "Student not approved for class." });
    }

    const client = await db.connect();

    try {
      await client.query("BEGIN");
      for (const record of records) {
        await client.query(
          "INSERT INTO attendance (class_id, student_id, date, status) VALUES ($1, $2, $3, $4) ON CONFLICT (class_id, student_id, date) DO UPDATE SET status = EXCLUDED.status",
          [classId, record.student_id, date, record.status]
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return res.status(201).json({ message: "Attendance saved." });
  } catch (error) {
    console.error("Create attendance error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.markAttendance = async (req, res) => {
  const { class_id, student_id, date, status } = req.body;
  const teacherUserId = req.user?.userId;

  if (!class_id || !student_id || !date || !status) {
    return res
      .status(400)
      .json({ message: "class_id, student_id, date, and status are required." });
  }

  if (isSunday(date)) {
    return res.status(400).json({ message: "Attendance cannot be marked on Sundays." });
  }

  if (!isValidStatus(status)) {
    return res.status(400).json({ message: "Invalid status value." });
  }

  if (!teacherUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const teacherId = await getTeacherId(teacherUserId);
    if (!teacherId) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }

    const classRes = await db.query(
      "SELECT id FROM classes WHERE id = $1 AND teacher_id = $2",
      [class_id, teacherId]
    );

    if (classRes.rowCount === 0) {
      return res.status(403).json({ message: "Class not found for teacher." });
    }

    const enrollmentRes = await db.query(
      "SELECT id FROM class_enrollments WHERE class_id = $1 AND student_id = $2 AND status = 'approved'",
      [class_id, student_id]
    );

    if (enrollmentRes.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "Student not approved for this class." });
    }

    const result = await db.query(
      "INSERT INTO attendance (class_id, student_id, date, status) VALUES ($1, $2, $3, $4) RETURNING id, class_id, student_id, date, status",
      [class_id, student_id, date, status]
    );

    return res.status(201).json({ attendance: result.rows[0] });
  } catch (error) {
    console.error("Mark attendance error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listAttendanceByDate = async (req, res) => {
  const { classId } = req.params;
  const { date } = req.query;
  const teacherUserId = req.user?.userId;

  if (!classId || !date) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  if (!teacherUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const teacherId = await getTeacherId(teacherUserId);
    if (!teacherId) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }

    const classRes = await db.query(
      "SELECT id FROM classes WHERE id = $1 AND teacher_id = $2",
      [classId, teacherId]
    );

    if (classRes.rowCount === 0) {
      return res.status(403).json({ message: "Class not found for teacher." });
    }

    const result = await db.query(
      "SELECT a.id, a.student_id, s.name AS student_name, s.roll_no, a.status, a.date " +
        "FROM attendance a " +
        "JOIN students s ON s.id = a.student_id " +
        "WHERE a.class_id = $1 AND a.date = $2 " +
        "ORDER BY s.name ASC",
      [classId, date]
    );

    return res.json({ attendance: result.rows });
  } catch (error) {
    console.error("List attendance error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listMyAttendance = async (req, res) => {
  const { classId } = req.params;
  const studentUserId = req.user?.userId;

  if (!classId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  if (!studentUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const studentId = await getStudentId(studentUserId);
    if (!studentId) {
      return res.status(403).json({ message: "Student profile not found." });
    }

    const enrollmentRes = await db.query(
      "SELECT id FROM class_enrollments WHERE class_id = $1 AND student_id = $2 AND status = 'approved'",
      [classId, studentId]
    );

    if (enrollmentRes.rowCount === 0) {
      return res.status(403).json({ message: "Not approved for this class." });
    }

    const result = await db.query(
      "SELECT id, date, status FROM attendance WHERE class_id = $1 AND student_id = $2 ORDER BY date DESC",
      [classId, studentId]
    );

    return res.json({ attendance: result.rows });
  } catch (error) {
    console.error("List my attendance error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listMyAttendanceRange = async (req, res) => {
  const studentUserId = req.user?.userId;
  const { from, to } = req.query;

  if (!studentUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const studentId = await getStudentId(studentUserId);
    if (!studentId) {
      return res.status(403).json({ message: "Student profile not found." });
    }

    const params = [studentId];
    let whereClause = "WHERE student_id = $1";

    if (from) {
      params.push(from);
      whereClause += ` AND date >= $${params.length}`;
    }

    if (to) {
      params.push(to);
      whereClause += ` AND date <= $${params.length}`;
    }

    const result = await db.query(
      `SELECT id, class_id, date, status
       FROM attendance
       ${whereClause}
       ORDER BY date DESC`,
      params
    );

    return res.json({ attendance: result.rows });
  } catch (error) {
    console.error("List my attendance range error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Teacher: get all attendance records for a specific student in a class the teacher owns.
exports.listStudentAttendanceForClass = async (req, res) => {
  const { classId, studentId } = req.params;
  const teacherUserId = req.user?.userId;

  if (!classId || !studentId) {
    return res.status(400).json({ message: "Missing classId or studentId." });
  }

  if (!teacherUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const teacherId = await getTeacherId(teacherUserId);
    if (!teacherId) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }

    const classRes = await db.query(
      "SELECT id FROM classes WHERE id = $1 AND teacher_id = $2",
      [classId, teacherId]
    );

    if (classRes.rowCount === 0) {
      return res.status(403).json({ message: "Class not found for teacher." });
    }

    const result = await db.query(
      "SELECT id, date, status FROM attendance WHERE class_id = $1 AND student_id = $2 ORDER BY date DESC",
      [classId, studentId]
    );

    return res.json({ attendance: result.rows });
  } catch (error) {
    console.error("List student attendance error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Returns per-student attendance summary (total, present, absent, rate) for a class.
exports.getAttendanceSummary = async (req, res) => {
  const { classId } = req.params;
  const teacherUserId = req.user?.userId;
  const role = String(req.user?.role || "").toLowerCase();

  if (!classId) {
    return res.status(400).json({ message: "Missing classId." });
  }

  if (!teacherUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    if (role === "hod") {
      const departmentId = await getDepartmentId(teacherUserId);
      if (!departmentId) {
        return res.status(403).json({ message: "HOD profile not found." });
      }
      const classRes = await db.query(
        "SELECT c.id FROM classes c JOIN teachers t ON t.id = c.teacher_id WHERE c.id = $1 AND t.department_id = $2",
        [classId, departmentId]
      );
      if (classRes.rowCount === 0) {
        return res.status(403).json({ message: "Class not in your department." });
      }
    } else {
      const teacherId = await getTeacherId(teacherUserId);
      if (!teacherId) {
        return res.status(403).json({ message: "Teacher profile not found." });
      }
      const classRes = await db.query(
        "SELECT id FROM classes WHERE id = $1 AND teacher_id = $2",
        [classId, teacherId]
      );
      if (classRes.rowCount === 0) {
        return res.status(403).json({ message: "Class not found for teacher." });
      }
    }

    const result = await db.query(
      "SELECT s.id AS student_id, s.name, s.roll_no, " +
        "COUNT(a.id) AS total_sessions, " +
        "SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count, " +
        "SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count, " +
        "ROUND(100.0 * SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0), 1) AS attendance_rate " +
        "FROM class_enrollments ce " +
        "JOIN students s ON s.id = ce.student_id " +
        "LEFT JOIN attendance a ON a.class_id = ce.class_id AND a.student_id = ce.student_id " +
        "WHERE ce.class_id = $1 AND ce.status = 'approved' " +
        "GROUP BY s.id, s.name, s.roll_no " +
        "ORDER BY s.roll_no ASC",
      [classId]
    );

    return res.json({ summary: result.rows });
  } catch (error) {
    console.error("Attendance summary error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listTopAttendance = async (req, res) => {
  const { classId } = req.params;
  const teacherUserId = req.user?.userId;

  if (!classId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  if (!teacherUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const teacherId = await getTeacherId(teacherUserId);
    if (!teacherId) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }

    const classRes = await db.query(
      "SELECT id FROM classes WHERE id = $1 AND teacher_id = $2",
      [classId, teacherId]
    );

    if (classRes.rowCount === 0) {
      return res.status(403).json({ message: "Class not found for teacher." });
    }

    const result = await db.query(
      "SELECT s.id, s.name, s.roll_no, " +
        "COUNT(a.id) AS total_sessions, " +
        "SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_sessions, " +
        "ROUND(100.0 * SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0), 1) AS attendance_rate " +
        "FROM attendance a " +
        "JOIN students s ON s.id = a.student_id " +
        "WHERE a.class_id = $1 " +
        "GROUP BY s.id, s.name, s.roll_no " +
        "ORDER BY attendance_rate DESC, s.roll_no ASC " +
        "LIMIT 5",
      [classId]
    );

    return res.json({ students: result.rows });
  } catch (error) {
    console.error("List top attendance error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
