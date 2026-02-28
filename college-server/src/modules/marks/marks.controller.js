// Marks controller: database CRUD for marks only.
// Must NOT define routes or implement auth logic.
const db = require("../../config/db");
const { getTeacherId, getStudentId, getDepartmentId } = require("../../utils/lookups");

exports.createMark = async (req, res) => {
  const { student_id, subject_id, score, total_marks, exam_type, year } = req.body;
  const teacherUserId = req.user?.userId;

  if (!student_id || !subject_id || score === undefined || total_marks === undefined || !exam_type || !year) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  if (Number(score) < 0 || Number(total_marks) <= 0) {
    return res.status(400).json({ message: "Score and total marks must be positive numbers." });
  }

  if (Number(score) > Number(total_marks)) {
    return res.status(400).json({ message: "Score cannot exceed total marks." });
  }

  if (!teacherUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const teacherRes = await db.query(
      "SELECT id FROM teachers WHERE user_id = $1",
      [teacherUserId]
    );

    if (teacherRes.rowCount === 0) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }

    const teacherId = teacherRes.rows[0].id;
    const result = await db.query(
      "INSERT INTO marks (student_id, subject_id, teacher_id, score, total_marks, exam_type, year) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, student_id, subject_id, teacher_id, score, total_marks, exam_type, year",
      [student_id, subject_id, teacherId, score, total_marks, exam_type, year]
    );

    return res.status(201).json({ mark: result.rows[0] });
  } catch (error) {
    console.error("Create mark error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listMarks = async (req, res) => {
  const role = String(req.user?.role || "").toLowerCase();
  const userId = req.user?.userId;

  try {
    if (role === "hod") {
      const departmentId = await getDepartmentId(userId);
      if (!departmentId) {
        return res.status(403).json({ message: "HOD profile not found." });
      }

      const result = await db.query(
        "SELECT m.id, m.student_id, m.subject_id, m.score, m.total_marks, m.exam_type, m.year " +
          "FROM marks m " +
          "JOIN teachers t ON t.id = m.teacher_id " +
          "WHERE t.department_id = $1 " +
          "ORDER BY m.year DESC",
        [departmentId]
      );

      return res.json({ marks: result.rows });
    }

    const result = await db.query(
      "SELECT id, student_id, subject_id, score, total_marks, exam_type, year FROM marks ORDER BY year DESC"
    );

    return res.json({ marks: result.rows });
  } catch (error) {
    console.error("List marks error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.getMarkById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      "SELECT id, student_id, subject_id, score, total_marks, exam_type, year FROM marks WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Mark not found." });
    }

    return res.json({ mark: result.rows[0] });
  } catch (error) {
    console.error("Get mark error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.getSubjectDifficulty = async (req, res) => {
  const role = String(req.user?.role || "").toLowerCase();
  const userId = req.user?.userId;

  try {
    if (role === "hod") {
      const departmentId = await getDepartmentId(userId);
      if (!departmentId) {
        return res.status(403).json({ message: "HOD profile not found." });
      }

      const result = await db.query(
        "SELECT s.id AS subject_id, s.name AS subject_name, AVG(m.score) AS avg_score " +
          "FROM marks m " +
          "JOIN subjects s ON s.id = m.subject_id " +
          "JOIN teachers t ON t.id = m.teacher_id " +
          "WHERE t.department_id = $1 " +
          "GROUP BY s.id, s.name " +
          "ORDER BY avg_score ASC " +
          "LIMIT 5",
        [departmentId]
      );

      return res.json({ subjects: result.rows });
    }

    const result = await db.query(
      "SELECT s.id AS subject_id, s.name AS subject_name, AVG(m.score) AS avg_score " +
        "FROM marks m JOIN subjects s ON s.id = m.subject_id " +
        "GROUP BY s.id, s.name " +
        "ORDER BY avg_score ASC " +
        "LIMIT 5"
    );

    return res.json({ subjects: result.rows });
  } catch (error) {
    console.error("Subject difficulty error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listMyMarks = async (req, res) => {
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
      "SELECT m.id, s.name AS subject_name, t.name AS teacher_name, m.score, m.total_marks, m.exam_type, m.year " +
        "FROM marks m " +
        "JOIN subjects s ON s.id = m.subject_id " +
        "JOIN teachers t ON t.id = m.teacher_id " +
        "WHERE m.student_id = $1 " +
        "ORDER BY m.year DESC",
      [studentId]
    );

    return res.json({ marks: result.rows });
  } catch (error) {
    console.error("List my marks error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.updateMark = async (req, res) => {
  const { id } = req.params;
  const { score, total_marks } = req.body;
  const teacherUserId = req.user?.userId;

  if (!id || score === undefined) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  if (Number(score) < 0) {
    return res.status(400).json({ message: "Score must be a positive number." });
  }

  if (total_marks !== undefined && Number(total_marks) <= 0) {
    return res.status(400).json({ message: "Total marks must be a positive number." });
  }

  if (total_marks !== undefined && Number(score) > Number(total_marks)) {
    return res.status(400).json({ message: "Score cannot exceed total marks." });
  }

  if (!teacherUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const teacherId = await getTeacherId(teacherUserId);
    if (!teacherId) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }

    // If total_marks not provided, check score against existing total_marks in DB
    if (total_marks === undefined || total_marks === null) {
      const existing = await db.query("SELECT total_marks FROM marks WHERE id = $1", [id]);
      if (existing.rowCount > 0 && Number(score) > Number(existing.rows[0].total_marks)) {
        return res.status(400).json({ message: "Score cannot exceed total marks." });
      }
    }

    let result = await db.query(
      "UPDATE marks SET score = $1, total_marks = COALESCE($2, total_marks) WHERE id = $3 AND teacher_id = $4 RETURNING id, student_id, subject_id, teacher_id, score, total_marks, exam_type, year",
      [score, total_marks ?? null, id, teacherId]
    );

    if (result.rowCount === 0) {
      result = await db.query(
        "UPDATE marks m SET score = $1, total_marks = COALESCE($2, m.total_marks) FROM classes c WHERE m.id = $3 AND m.class_id = c.id AND c.teacher_id = $4 RETURNING m.id, m.student_id, m.subject_id, m.teacher_id, m.score, m.total_marks, m.exam_type, m.year",
        [score, total_marks ?? null, id, teacherId]
      );
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Mark not found." });
    }

    return res.json({ mark: result.rows[0] });
  } catch (error) {
    console.error("Update mark error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.createClassMark = async (req, res) => {
  const { classId } = req.params;
  const { student_id, subject_id, score, total_marks, exam_type, year } = req.body;
  const teacherUserId = req.user?.userId;

  if (!classId || !student_id || !subject_id || score === undefined || total_marks === undefined || !exam_type || !year) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  if (Number(score) < 0 || Number(total_marks) <= 0) {
    return res.status(400).json({ message: "Score and total marks must be positive numbers." });
  }

  if (Number(score) > Number(total_marks)) {
    return res.status(400).json({ message: "Score cannot exceed total marks." });
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
      "SELECT id, subject_id FROM classes WHERE id = $1 AND teacher_id = $2",
      [classId, teacherId]
    );

    if (classRes.rowCount === 0) {
      return res.status(403).json({ message: "Class not found for teacher." });
    }

    if (classRes.rows[0].subject_id !== subject_id) {
      return res.status(400).json({ message: "Subject does not match class." });
    }

    const enrollmentRes = await db.query(
      "SELECT id FROM class_enrollments WHERE class_id = $1 AND student_id = $2 AND status = 'approved'",
      [classId, student_id]
    );

    if (enrollmentRes.rowCount === 0) {
      return res.status(403).json({ message: "Student is not approved for this class." });
    }

    const result = await db.query(
      "INSERT INTO marks (class_id, student_id, subject_id, teacher_id, score, total_marks, exam_type, year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, class_id, student_id, subject_id, teacher_id, score, total_marks, exam_type, year",
      [classId, student_id, subject_id, teacherId, score, total_marks, exam_type, year]
    );

    return res.status(201).json({ mark: result.rows[0] });
  } catch (error) {
    console.error("Create class mark error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listMarksByClass = async (req, res) => {
  const { classId } = req.params;
  const teacherUserId = req.user?.userId;

  if (!classId || !teacherUserId) {
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
      "SELECT m.id, s.id AS student_id, s.name AS student_name, s.roll_no, sub.name AS subject_name, m.score, m.total_marks, m.exam_type, m.year " +
        "FROM marks m " +
        "JOIN students s ON s.id = m.student_id " +
        "JOIN subjects sub ON sub.id = m.subject_id " +
        "WHERE m.class_id = $1 AND m.teacher_id = $2 " +
        "ORDER BY m.year DESC",
      [classId, teacherId]
    );

    return res.json({ marks: result.rows });
  } catch (error) {
    console.error("List class marks error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listMyMarksByClass = async (req, res) => {
  const { classId } = req.params;
  const studentUserId = req.user?.userId;

  if (!classId || !studentUserId) {
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
      "SELECT m.id, s.name AS subject_name, t.name AS teacher_name, m.score, m.total_marks, m.exam_type, m.year " +
        "FROM marks m " +
        "JOIN subjects s ON s.id = m.subject_id " +
        "JOIN teachers t ON t.id = m.teacher_id " +
        "WHERE m.class_id = $1 AND m.student_id = $2 " +
        "ORDER BY m.year DESC",
      [classId, studentId]
    );

    return res.json({ marks: result.rows });
  } catch (error) {
    console.error("List my class marks error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
