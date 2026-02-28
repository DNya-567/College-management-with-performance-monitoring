// Enrollments controller: database logic for class enrollments only.
// Must NOT define routes or implement auth logic.
const db = require("../../config/db");
const { getTeacherId, getStudentId, getDepartmentId } = require("../../utils/lookups");

exports.requestEnrollment = async (req, res) => {
  const { classId } = req.params;
  const studentUserId = req.user?.userId;

  if (!studentUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const studentId = await getStudentId(studentUserId);
    if (!studentId) {
      return res.status(403).json({ message: "Student profile not found." });
    }

    const existing = await db.query(
      "SELECT id, status FROM class_enrollments WHERE class_id = $1 AND student_id = $2 AND status IN ('pending', 'approved')",
      [classId, studentId]
    );

    if (existing.rowCount) {
      return res.status(409).json({ message: "Enrollment already exists." });
    }

    const result = await db.query(
      "INSERT INTO class_enrollments (class_id, student_id, status) VALUES ($1, $2, 'pending') RETURNING id, class_id, student_id, status",
      [classId, studentId]
    );

    return res.status(201).json({ enrollment: result.rows[0] });
  } catch (error) {
    console.error("Request enrollment error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listEnrollmentRequests = async (req, res) => {
  const userId = req.user?.userId;
  const role = String(req.user?.role || "").toLowerCase();

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    if (role === "hod") {
      const departmentId = await getDepartmentId(userId);
      if (!departmentId) {
        return res.status(403).json({ message: "HOD profile not found." });
      }

      const result = await db.query(
        "SELECT ce.id, ce.class_id, ce.student_id, ce.status, c.name AS class_name, s.name AS student_name, s.roll_no " +
          "FROM class_enrollments ce " +
          "JOIN classes c ON c.id = ce.class_id " +
          "JOIN students s ON s.id = ce.student_id " +
          "JOIN teachers t ON t.id = c.teacher_id " +
          "WHERE t.department_id = $1 AND ce.status = 'pending' " +
          "ORDER BY ce.id DESC",
        [departmentId]
      );

      return res.json({ requests: result.rows });
    }

    const teacherId = await getTeacherId(userId);
    if (!teacherId) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }

    const result = await db.query(
      "SELECT ce.id, ce.class_id, ce.student_id, ce.status, c.name AS class_name, s.name AS student_name, s.roll_no " +
        "FROM class_enrollments ce " +
        "JOIN classes c ON c.id = ce.class_id " +
        "JOIN students s ON s.id = ce.student_id " +
        "WHERE c.teacher_id = $1 AND ce.status = 'pending' " +
        "ORDER BY ce.id DESC",
      [teacherId]
    );

    return res.json({ requests: result.rows });
  } catch (error) {
    console.error("List enrollment requests error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.approveEnrollment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const role = String(req.user?.role || "").toLowerCase();

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    if (role === "hod") {
      const departmentId = await getDepartmentId(userId);
      if (!departmentId) {
        return res.status(403).json({ message: "HOD profile not found." });
      }

      const result = await db.query(
        "UPDATE class_enrollments ce SET status = 'approved' " +
          "WHERE ce.id = $1 AND ce.status = 'pending' " +
          "AND ce.class_id IN (" +
          "  SELECT c.id FROM classes c JOIN teachers t ON t.id = c.teacher_id WHERE t.department_id = $2" +
          ") " +
          "RETURNING ce.id, ce.class_id, ce.student_id, ce.status",
        [id, departmentId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Enrollment not found." });
      }

      return res.json({ enrollment: result.rows[0] });
    }

    const teacherId = await getTeacherId(userId);
    if (!teacherId) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }

    const result = await db.query(
      "UPDATE class_enrollments ce SET status = 'approved' " +
        "WHERE ce.id = $1 AND ce.status = 'pending' " +
        "AND ce.class_id IN (SELECT id FROM classes WHERE teacher_id = $2) " +
        "RETURNING ce.id, ce.class_id, ce.student_id, ce.status",
      [id, teacherId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Enrollment not found." });
    }

    return res.json({ enrollment: result.rows[0] });
  } catch (error) {
    console.error("Approve enrollment error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.rejectEnrollment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const role = String(req.user?.role || "").toLowerCase();

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    if (role === "hod") {
      const departmentId = await getDepartmentId(userId);
      if (!departmentId) {
        return res.status(403).json({ message: "HOD profile not found." });
      }

      const result = await db.query(
        "UPDATE class_enrollments ce SET status = 'rejected' " +
          "WHERE ce.id = $1 AND ce.status = 'pending' " +
          "AND ce.class_id IN (" +
          "  SELECT c.id FROM classes c JOIN teachers t ON t.id = c.teacher_id WHERE t.department_id = $2" +
          ") " +
          "RETURNING ce.id, ce.class_id, ce.student_id, ce.status",
        [id, departmentId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Enrollment not found." });
      }

      return res.json({ enrollment: result.rows[0] });
    }

    const teacherId = await getTeacherId(userId);
    if (!teacherId) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }

    const result = await db.query(
      "UPDATE class_enrollments ce SET status = 'rejected' " +
        "WHERE ce.id = $1 AND ce.status = 'pending' " +
        "AND ce.class_id IN (SELECT id FROM classes WHERE teacher_id = $2) " +
        "RETURNING ce.id, ce.class_id, ce.student_id, ce.status",
      [id, teacherId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Enrollment not found." });
    }

    return res.json({ enrollment: result.rows[0] });
  } catch (error) {
    console.error("Reject enrollment error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listMyClasses = async (req, res) => {
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
      "SELECT c.id AS class_id, c.name AS class_name, c.year, s.name AS subject_name, t.name AS teacher_name, ce.status " +
        "FROM class_enrollments ce " +
        "JOIN classes c ON c.id = ce.class_id " +
        "JOIN subjects s ON s.id = c.subject_id " +
        "JOIN teachers t ON t.id = c.teacher_id " +
        "WHERE ce.student_id = $1 AND ce.status = 'approved' " +
        "ORDER BY c.year DESC",
      [studentId]
    );

    return res.json({ classes: result.rows });
  } catch (error) {
    console.error("List my classes error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listMyPendingClasses = async (req, res) => {
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
      "SELECT c.id AS class_id, c.name AS class_name, c.year, s.name AS subject_name, t.name AS teacher_name, ce.status " +
        "FROM class_enrollments ce " +
        "JOIN classes c ON c.id = ce.class_id " +
        "JOIN subjects s ON s.id = c.subject_id " +
        "JOIN teachers t ON t.id = c.teacher_id " +
        "WHERE ce.student_id = $1 AND ce.status = 'pending' " +
        "ORDER BY c.year DESC",
      [studentId]
    );

    return res.json({ classes: result.rows });
  } catch (error) {
    console.error("List my pending classes error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
