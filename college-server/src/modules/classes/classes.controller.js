// Classes controller: database CRUD for classes only.
// Must NOT define routes or implement auth logic.
const db = require("../../config/db");
const { getTeacherId, getStudentId, getDepartmentId } = require("../../utils/lookups");

exports.createClass = async (req, res) => {
  const { name, subject_id, year } = req.body;
  const teacherUserId = req.user?.userId;

  if (!name || !subject_id || !year) {
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

    const result = await db.query(
      "INSERT INTO classes (name, subject_id, teacher_id, year) VALUES ($1, $2, $3, $4) RETURNING id, name, subject_id, teacher_id, year",
      [name, subject_id, teacherId, year]
    );

    return res.status(201).json({ class: result.rows[0] });
  } catch (error) {
    console.error("Create class error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listMyClasses = async (req, res) => {
  const teacherUserId = req.user?.userId;

  if (!teacherUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const teacherId = await getTeacherId(teacherUserId);
    if (!teacherId) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }

    const result = await db.query(
      "SELECT c.id, c.name, c.subject_id, c.teacher_id, c.year FROM classes c WHERE c.teacher_id = $1 ORDER BY c.year DESC",
      [teacherId]
    );

    return res.json({ classes: result.rows });
  } catch (error) {
    console.error("List my classes error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listAvailableClasses = async (req, res) => {
  const studentUserId = req.user?.userId;

  if (!studentUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const studentId = await getStudentId(studentUserId);
    if (!studentId) {
      return res.status(403).json({ message: "Student profile not found." });
    }

    const result = await db.query(
      "SELECT c.id, c.name, c.year, s.name AS subject_name, t.name AS teacher_name " +
        "FROM classes c " +
        "JOIN subjects s ON s.id = c.subject_id " +
        "JOIN teachers t ON t.id = c.teacher_id " +
        "WHERE NOT EXISTS (" +
        "  SELECT 1 FROM class_enrollments ce " +
        "  WHERE ce.class_id = c.id AND ce.student_id = $1 AND ce.status IN ('pending', 'approved')" +
        ") " +
        "ORDER BY c.year DESC",
      [studentId]
    );

    return res.json({ classes: result.rows });
  } catch (error) {
    console.error("List available classes error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listApprovedStudents = async (req, res) => {
  const { classId } = req.params;
  const userId = req.user?.userId;
  const role = String(req.user?.role || "").toLowerCase();

  if (!classId || !userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    if (role === "hod") {
      const departmentId = await getDepartmentId(userId);
      if (!departmentId) {
        return res.status(403).json({ message: "HOD profile not found." });
      }

      const classRes = await db.query(
        "SELECT c.id FROM classes c JOIN teachers t ON t.id = c.teacher_id WHERE c.id = $1 AND t.department_id = $2",
        [classId, departmentId]
      );

      if (classRes.rowCount === 0) {
        return res.status(403).json({ message: "Class not found for department." });
      }
    } else {
      const teacherId = await getTeacherId(userId);
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
      "SELECT s.id, s.name, s.roll_no " +
        "FROM class_enrollments ce " +
        "JOIN students s ON s.id = ce.student_id " +
        "WHERE ce.class_id = $1 AND ce.status = 'approved' " +
        "ORDER BY s.name ASC",
      [classId]
    );

    return res.json({ students: result.rows });
  } catch (error) {
    console.error("List approved students error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listDepartmentClasses = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const departmentId = await getDepartmentId(userId);
    if (!departmentId) {
      return res.status(403).json({ message: "HOD profile not found." });
    }

    const result = await db.query(
      "SELECT c.id, c.name, c.year, s.name AS subject_name, t.name AS teacher_name " +
        "FROM classes c " +
        "JOIN subjects s ON s.id = c.subject_id " +
        "JOIN teachers t ON t.id = c.teacher_id " +
        "WHERE t.department_id = $1 " +
        "ORDER BY c.year DESC, c.name ASC",
      [departmentId]
    );

    return res.json({ classes: result.rows });
  } catch (error) {
    console.error("List department classes error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
