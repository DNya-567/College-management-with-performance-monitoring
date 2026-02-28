// Announcements controller: database logic for class-scoped announcements.
// Announcements are always tied to a specific class.
// Must NOT define routes or implement auth logic.
const db = require("../../config/db");
const { getTeacherId, getStudentId } = require("../../utils/lookups");

/**
 * POST /api/classes/:classId/announcements
 * Teacher creates an announcement scoped to a class they own.
 */
exports.createAnnouncement = async (req, res) => {
  const { classId } = req.params;
  const { title, body } = req.body;
  const teacherUserId = req.user?.userId;

  if (!classId || !title || !body) {
    return res.status(400).json({ message: "Class, title, and body are required." });
  }

  if (!teacherUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const teacherId = await getTeacherId(teacherUserId);
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

    const result = await db.query(
      "INSERT INTO announcements (teacher_id, class_id, title, body) VALUES ($1, $2, $3, $4) RETURNING id, teacher_id, class_id, title, body, created_at",
      [teacherId, classId, title, body]
    );

    return res.status(201).json({ announcement: result.rows[0] });
  } catch (error) {
    console.error("Create announcement error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/classes/:classId/announcements
 * Returns announcements for a specific class.
 * Teachers see announcements for classes they own.
 * Students see announcements for classes they are approved in.
 */
exports.listClassAnnouncements = async (req, res) => {
  const { classId } = req.params;
  const userId = req.user?.userId;
  const role = String(req.user?.role || "").toLowerCase();

  if (!classId || !userId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    // Authorization: teacher must own the class, student must be approved
    if (role === "teacher" || role === "hod") {
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
    } else if (role === "student") {
      const studentId = await getStudentId(userId);
      if (!studentId) {
        return res.status(403).json({ message: "Student profile not found." });
      }
      const enrollmentRes = await db.query(
        "SELECT id FROM class_enrollments WHERE class_id = $1 AND student_id = $2 AND status = 'approved'",
        [classId, studentId]
      );
      if (enrollmentRes.rowCount === 0) {
        return res.status(403).json({ message: "Not enrolled in this class." });
      }
    }

    const result = await db.query(
      "SELECT a.id, a.title, a.body, a.created_at, a.class_id, t.name AS teacher_name, c.name AS class_name " +
        "FROM announcements a " +
        "JOIN teachers t ON t.id = a.teacher_id " +
        "JOIN classes c ON c.id = a.class_id " +
        "WHERE a.class_id = $1 " +
        "ORDER BY a.created_at DESC",
      [classId]
    );

    return res.json({ announcements: result.rows });
  } catch (error) {
    console.error("List class announcements error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/announcements
 * Returns all announcements relevant to the current user:
 * - Teacher: announcements from all classes they own
 * - Student: announcements from all classes they are approved in
 * - Admin/HOD: all announcements
 */
exports.listMyAnnouncements = async (req, res) => {
  const userId = req.user?.userId;
  const role = String(req.user?.role || "").toLowerCase();

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    let result;

    if (role === "teacher" || role === "hod") {
      const teacherId = await getTeacherId(userId);
      if (!teacherId) {
        return res.status(403).json({ message: "Teacher profile not found." });
      }
      result = await db.query(
        "SELECT a.id, a.title, a.body, a.created_at, a.class_id, t.name AS teacher_name, c.name AS class_name " +
          "FROM announcements a " +
          "JOIN teachers t ON t.id = a.teacher_id " +
          "JOIN classes c ON c.id = a.class_id " +
          "WHERE a.teacher_id = $1 " +
          "ORDER BY a.created_at DESC",
        [teacherId]
      );
    } else if (role === "student") {
      const studentId = await getStudentId(userId);
      if (!studentId) {
        return res.status(403).json({ message: "Student profile not found." });
      }
      result = await db.query(
        "SELECT a.id, a.title, a.body, a.created_at, a.class_id, t.name AS teacher_name, c.name AS class_name " +
          "FROM announcements a " +
          "JOIN teachers t ON t.id = a.teacher_id " +
          "JOIN classes c ON c.id = a.class_id " +
          "JOIN class_enrollments ce ON ce.class_id = a.class_id AND ce.status = 'approved' " +
          "WHERE ce.student_id = $1 " +
          "ORDER BY a.created_at DESC",
        [studentId]
      );
    } else {
      // admin: all announcements
      result = await db.query(
        "SELECT a.id, a.title, a.body, a.created_at, a.class_id, t.name AS teacher_name, c.name AS class_name " +
          "FROM announcements a " +
          "JOIN teachers t ON t.id = a.teacher_id " +
          "JOIN classes c ON c.id = a.class_id " +
          "ORDER BY a.created_at DESC"
      );
    }

    return res.json({ announcements: result.rows });
  } catch (error) {
    console.error("List my announcements error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
