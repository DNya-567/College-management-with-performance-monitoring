// Enrollments controller: database logic for class enrollments only.
// Must NOT define routes or implement auth logic.
const db = require("../../config/db");
const logger = require("../../config/logger");
const { getTeacherId, getStudentId, getDepartmentId } = require("../../utils/lookups");
const { getActiveSemester } = require("../../utils/getActiveSemester");

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

    const activeSem = await getActiveSemester();
    const semesterId = activeSem ? activeSem.id : null;

    const result = await db.query(
      "INSERT INTO class_enrollments (class_id, student_id, status, semester_id) VALUES ($1, $2, 'pending', $3) RETURNING id, class_id, student_id, status, semester_id",
      [classId, studentId, semesterId]
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
        logger.warn('Enrollment approval failed - not found', {
          enrollmentId: id,
          departmentId,
          approvedBy: userId,
          correlationId: req.correlationId
        });
        return res.status(404).json({ message: "Enrollment not found." });
      }

      const enrollment = result.rows[0];
      logger.info('Enrollment approved', {
        enrollmentId: enrollment.id,
        studentId: enrollment.student_id,
        classId: enrollment.class_id,
        approvedBy: userId,
        approverRole: 'hod',
        correlationId: req.correlationId
      });

      return res.json({ enrollment });
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
      logger.warn('Enrollment approval failed - not found', {
        enrollmentId: id,
        teacherId,
        approvedBy: userId,
        correlationId: req.correlationId
      });
      return res.status(404).json({ message: "Enrollment not found." });
    }

    const enrollment = result.rows[0];
    logger.info('Enrollment approved', {
      enrollmentId: enrollment.id,
      studentId: enrollment.student_id,
      classId: enrollment.class_id,
      approvedBy: userId,
      approverRole: 'teacher',
      correlationId: req.correlationId
    });

    return res.json({ enrollment });
  } catch (error) {
    logger.logError(error, {
      step: 'approveEnrollment',
      enrollmentId: id,
      approvedBy: userId,
      correlationId: req.correlationId
    });
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
        logger.warn('Enrollment rejection failed - not found', {
          enrollmentId: id,
          departmentId,
          rejectedBy: userId,
          correlationId: req.correlationId
        });
        return res.status(404).json({ message: "Enrollment not found." });
      }

      const enrollment = result.rows[0];
      logger.info('Enrollment rejected', {
        enrollmentId: enrollment.id,
        studentId: enrollment.student_id,
        classId: enrollment.class_id,
        rejectedBy: userId,
        rejectorRole: 'hod',
        correlationId: req.correlationId
      });

      return res.json({ enrollment });
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
      logger.warn('Enrollment rejection failed - not found', {
        enrollmentId: id,
        teacherId,
        rejectedBy: userId,
        correlationId: req.correlationId
      });
      return res.status(404).json({ message: "Enrollment not found." });
    }

    const enrollment = result.rows[0];
    logger.info('Enrollment rejected', {
      enrollmentId: enrollment.id,
      studentId: enrollment.student_id,
      classId: enrollment.class_id,
      rejectedBy: userId,
      rejectorRole: 'teacher',
      correlationId: req.correlationId
    });

    return res.json({ enrollment });
  } catch (error) {
    logger.logError(error, {
      step: 'rejectEnrollment',
      enrollmentId: id,
      rejectedBy: userId,
      correlationId: req.correlationId
    });
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
