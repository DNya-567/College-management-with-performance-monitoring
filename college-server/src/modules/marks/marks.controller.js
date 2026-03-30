// Marks controller: database CRUD for marks only.
// Must NOT define routes or implement auth logic.
import db from '../../config/db.js';
import logger from '../../config/logger.js';
import { getTeacherId, getStudentId, getDepartmentId } from '../../utils/lookups.js';
import { getActiveSemester } from '../../utils/getActiveSemester.js';
import { formatPaginatedResponse } from '../../utils/pagination.js';

export const createMark = async (req, res) => {
  const { student_id, subject_id, score, total_marks, exam_type, year } = req.body;
  const teacherUserId = req.user?.userId;

  if (!student_id || !subject_id || score === undefined || total_marks === undefined || !exam_type || !year) {
    logger.warn('Mark creation failed - missing fields', {
      student_id, subject_id, exam_type, correlationId: req.correlationId
    });
    return res.status(400).json({ message: "Missing required fields." });
  }

  if (Number(score) < 0 || Number(total_marks) <= 0) {
    logger.warn('Mark creation failed - invalid score/total', {
      score, total_marks, correlationId: req.correlationId
    });
    return res.status(400).json({ message: "Score and total marks must be positive numbers." });
  }

  if (Number(score) > Number(total_marks)) {
    logger.warn('Mark creation failed - score exceeds total', {
      score, total_marks, correlationId: req.correlationId
    });
    return res.status(400).json({ message: "Score cannot exceed total marks." });
  }

  if (!teacherUserId) {
    logger.warn('Mark creation failed - unauthorized', { correlationId: req.correlationId });
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    logger.info('Creating mark', {
      student_id, subject_id, score, total_marks, exam_type, year,
      teacherUserId, correlationId: req.correlationId
    });

    const teacherRes = await db.query(
      "SELECT id FROM teachers WHERE user_id = $1",
      [teacherUserId]
    );

    if (teacherRes.rowCount === 0) {
      logger.warn('Mark creation failed - teacher not found', {
        teacherUserId, correlationId: req.correlationId
      });
      return res.status(403).json({ message: "Teacher profile not found." });
    }

    const teacherId = teacherRes.rows[0].id;
    const activeSem = await getActiveSemester();
    const semesterId = activeSem ? activeSem.id : null;

    const result = await db.query(
      "INSERT INTO marks (student_id, subject_id, teacher_id, score, total_marks, exam_type, year, semester_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, student_id, subject_id, teacher_id, score, total_marks, exam_type, year, semester_id",
      [student_id, subject_id, teacherId, score, total_marks, exam_type, year, semesterId]
    );

    logger.info('Mark created successfully', {
      markId: result.rows[0].id, student_id, subject_id, score,
      correlationId: req.correlationId
    });

    return res.status(201).json({ mark: result.rows[0] });
  } catch (error) {
    logger.logError(error, {
      student_id, subject_id, score, exam_type,
      step: 'createMark', correlationId: req.correlationId
    });
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const listMarks = async (req, res) => {
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
    logger.logError(error, {
      step: 'listMarks', correlationId: req.correlationId
    });
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getMarkById = async (req, res) => {
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
    logger.logError(error, {
      markId: id, step: 'getMarkById', correlationId: req.correlationId
    });
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const getSubjectDifficulty = async (req, res) => {
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
    logger.logError(error, {
      role, userId, step: 'getSubjectDifficulty', correlationId: req.correlationId
    });
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const listMyMarks = async (req, res) => {
  const userId = req.user?.userId;
  const { semester_id } = req.query;
  const { limit, offset } = req.pagination;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const studentId = await getStudentId(userId);
    if (!studentId) {
      return res.status(403).json({ message: "Student profile not found." });
    }

    // Resolve semester: use query param, fall back to active, or null for all
    let semId = semester_id || null;
    if (!semId) {
      const activeSem = await getActiveSemester();
      semId = activeSem ? activeSem.id : null;
    }

    // Count query
    const countParams = [studentId];
    let semFilter = "";
    if (semId) {
      countParams.push(semId);
      semFilter = ` AND (m.semester_id = $${countParams.length} OR m.semester_id IS NULL)`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM marks m WHERE m.student_id = $1${semFilter}`,
      countParams
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Data query with pagination
    const dataParams = [studentId];
    let dataFilter = "";
    if (semId) {
      dataParams.push(semId);
      dataFilter = ` AND (m.semester_id = $${dataParams.length} OR m.semester_id IS NULL)`;
    }
    dataParams.push(limit, offset);

    const result = await db.query(
      `SELECT m.id, s.name AS subject_name, t.name AS teacher_name, m.score, m.total_marks, m.exam_type, m.year, m.semester_id
       FROM marks m
       JOIN subjects s ON s.id = m.subject_id
       JOIN teachers t ON t.id = m.teacher_id
       WHERE m.student_id = $1${dataFilter}
       ORDER BY m.year DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    return res.json(formatPaginatedResponse(result.rows, total, limit, offset));
  } catch (error) {
    logger.logError(error, {
      userId, semester_id, step: 'listMyMarks',
      correlationId: req.correlationId
    });
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const updateMark = async (req, res) => {
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
    logger.logError(error, {
      markId: id, score, total_marks, step: 'updateMark', correlationId: req.correlationId
    });
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const createClassMark = async (req, res) => {
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

    const activeSem = await getActiveSemester();
    const semesterId = activeSem ? activeSem.id : null;

    const result = await db.query(
      "INSERT INTO marks (class_id, student_id, subject_id, teacher_id, score, total_marks, exam_type, year, semester_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, class_id, student_id, subject_id, teacher_id, score, total_marks, exam_type, year, semester_id",
      [classId, student_id, subject_id, teacherId, score, total_marks, exam_type, year, semesterId]
    );

    return res.status(201).json({ mark: result.rows[0] });
  } catch (error) {
    // Handle duplicate mark constraint
    if (error.code === '23505' && error.constraint && error.constraint.includes('unique')) {
      logger.warn('Duplicate mark attempted', {
        classId, student_id, subject_id, error: error.message,
        step: 'createClassMark', correlationId: req.correlationId
      });
      return res.status(409).json({ message: "Mark already exists for this student/subject/class. Use PUT to update instead." });
    }

    logger.logError(error, {
      classId, student_id, subject_id, step: 'createClassMark', correlationId: req.correlationId
    });
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const listMarksByClass = async (req, res) => {
  const { classId } = req.params;
  const { semester_id } = req.query;
  const teacherUserId = req.user?.userId;
  const role = String(req.user?.role || "").toLowerCase();

  if (!classId || !teacherUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    let teacherId;

    if (role === "hod") {
      const departmentId = await getDepartmentId(teacherUserId);
      if (!departmentId) {
        return res.status(403).json({ message: "HOD profile not found." });
      }
      const classRes = await db.query(
        "SELECT c.id, c.teacher_id FROM classes c JOIN teachers t ON t.id = c.teacher_id WHERE c.id = $1 AND t.department_id = $2",
        [classId, departmentId]
      );
      if (classRes.rowCount === 0) {
        return res.status(403).json({ message: "Class not in your department." });
      }
      teacherId = classRes.rows[0].teacher_id;
    } else {
      teacherId = await getTeacherId(teacherUserId);
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

    // Resolve semester filter
    let semId = semester_id || null;
    if (!semId) {
      const activeSem = await getActiveSemester();
      semId = activeSem ? activeSem.id : null;
    }

    const params = [classId];
    let semFilter = "";
    if (semId) {
      params.push(semId);
      semFilter = ` AND (m.semester_id = $${params.length} OR m.semester_id IS NULL)`;
    }

    const result = await db.query(
      `SELECT m.id, s.id AS student_id, s.name AS student_name, s.roll_no, sub.name AS subject_name, m.score, m.total_marks, m.exam_type, m.year, m.semester_id
       FROM marks m
       JOIN students s ON s.id = m.student_id
       JOIN subjects sub ON sub.id = m.subject_id
       WHERE m.class_id = $1${semFilter}
       ORDER BY m.year DESC`,
      params
    );

    return res.json({ marks: result.rows });
  } catch (error) {
    logger.logError(error, {
      classId: req.params.classId, step: 'listClassMarks', correlationId: req.correlationId
    });
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const listMyMarksByClass = async (req, res) => {
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
    logger.logError(error, {
      classId: req.params.classId, step: 'listMyClassMarks', correlationId: req.correlationId
    });
    return res.status(500).json({ message: "Internal server error." });
  }
};
