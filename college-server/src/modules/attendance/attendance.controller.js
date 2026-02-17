// Attendance controller: database logic for attendance only.
// Must NOT define routes or implement auth logic.
const db = require("../../config/db");

const getTeacherId = async (userId) => {
  const result = await db.query("SELECT id FROM teachers WHERE user_id = $1", [
    userId,
  ]);
  return result.rowCount ? result.rows[0].id : null;
};

const getStudentId = async (userId) => {
  const result = await db.query("SELECT id FROM students WHERE user_id = $1", [
    userId,
  ]);
  return result.rowCount ? result.rows[0].id : null;
};

const isValidStatus = (status) => status === "present" || status === "absent";

exports.createAttendance = async (req, res) => {
  const { classId } = req.params;
  const { date, records } = req.body;
  const teacherUserId = req.user?.userId;

  if (!classId || !date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: "Missing required fields." });
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
