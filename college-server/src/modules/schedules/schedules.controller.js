// Schedules controller: DB logic for class schedules only.
// Must NOT define routes or implement auth middleware logic.
const db = require("../../config/db");
const { getTeacherId, getStudentId, getDepartmentId } = require("../../utils/lookups");

const VALID_STATUS = new Set(["scheduled", "cancelled", "rescheduled"]);

const normalizeStatus = (status) => String(status || "").trim().toLowerCase();

const ensureTeacherOrHodClassAccess = async (userId, role, classId) => {
  if (role === "teacher") {
    const teacherId = await getTeacherId(userId);
    if (!teacherId) {
      return { error: { code: 403, message: "Teacher profile not found." } };
    }

    const classRes = await db.query(
      "SELECT c.id FROM classes c WHERE c.id = $1 AND c.teacher_id = $2",
      [classId, teacherId]
    );

    if (classRes.rowCount === 0) {
      return { error: { code: 403, message: "Class not found for teacher." } };
    }

    return { teacherId };
  }

  if (role === "hod") {
    const departmentId = await getDepartmentId(userId);
    if (!departmentId) {
      return { error: { code: 403, message: "HOD profile not found." } };
    }

    const hodTeacherId = await getTeacherId(userId);
    if (!hodTeacherId) {
      return { error: { code: 403, message: "HOD teacher profile not found." } };
    }

    const classRes = await db.query(
      "SELECT c.id FROM classes c JOIN teachers t ON t.id = c.teacher_id WHERE c.id = $1 AND t.department_id = $2",
      [classId, departmentId]
    );

    if (classRes.rowCount === 0) {
      return { error: { code: 403, message: "Class not in your department." } };
    }

    return { teacherId: hodTeacherId };
  }

  return { error: { code: 403, message: "Forbidden" } };
};

const ensureStudentClassAccess = async (userId, classId) => {
  const studentId = await getStudentId(userId);
  if (!studentId) {
    return { error: { code: 403, message: "Student profile not found." } };
  }

  const enrollmentRes = await db.query(
    "SELECT id FROM class_enrollments WHERE class_id = $1 AND student_id = $2 AND status = 'approved'",
    [classId, studentId]
  );

  if (enrollmentRes.rowCount === 0) {
    return { error: { code: 403, message: "Not enrolled in this class." } };
  }

  return { studentId };
};

const hasOverlap = async (classId, sessionDate, startTime, endTime, skipScheduleId = null) => {
  const params = [classId, sessionDate, endTime, startTime];
  let whereSkip = "";

  if (skipScheduleId) {
    params.push(skipScheduleId);
    whereSkip = "AND id <> $5";
  }

  const overlapRes = await db.query(
    "SELECT id FROM class_schedules WHERE class_id = $1 AND session_date = $2 AND status = 'scheduled' " +
      "AND NOT ($3 <= start_time OR $4 >= end_time) " +
      whereSkip +
      " LIMIT 1",
    params
  );

  return overlapRes.rowCount > 0;
};

// POST /api/classes/:classId/schedules
exports.createClassSchedule = async (req, res) => {
  const { classId } = req.params;
  const { session_date, start_time, end_time, topic } = req.body;
  const userId = req.user?.userId;
  const role = normalizeStatus(req.user?.role);

  if (!classId || !session_date || !start_time || !end_time) {
    return res.status(400).json({ message: "Class, date, start time, and end time are required." });
  }

  if (start_time >= end_time) {
    return res.status(400).json({ message: "End time must be after start time." });
  }

  try {
    const access = await ensureTeacherOrHodClassAccess(userId, role, classId);
    if (access.error) {
      return res.status(access.error.code).json({ message: access.error.message });
    }

    const overlap = await hasOverlap(classId, session_date, start_time, end_time);
    if (overlap) {
      return res.status(409).json({ message: "Schedule overlaps with an existing session." });
    }

    const result = await db.query(
      "INSERT INTO class_schedules (class_id, session_date, start_time, end_time, topic, status, updated_by_teacher_id) " +
        "VALUES ($1, $2, $3, $4, $5, 'scheduled', $6) " +
        "RETURNING id, class_id, session_date, start_time, end_time, topic, status, reason, rescheduled_date, rescheduled_start_time, rescheduled_end_time, created_at, updated_at",
      [classId, session_date, start_time, end_time, topic || null, access.teacherId]
    );

    return res.status(201).json({ schedule: result.rows[0] });
  } catch (error) {
    console.error("Create class schedule error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// PATCH /api/schedules/:scheduleId
exports.updateClassSchedule = async (req, res) => {
  const { scheduleId } = req.params;
  const {
    status,
    reason,
    topic,
    session_date,
    start_time,
    end_time,
    rescheduled_date,
    rescheduled_start_time,
    rescheduled_end_time,
  } = req.body;
  const userId = req.user?.userId;
  const role = normalizeStatus(req.user?.role);

  if (!scheduleId) {
    return res.status(400).json({ message: "Schedule id is required." });
  }

  const normalizedStatus = status ? normalizeStatus(status) : null;
  if (normalizedStatus && !VALID_STATUS.has(normalizedStatus)) {
    return res.status(400).json({ message: "Invalid status value." });
  }

  if (start_time && end_time && start_time >= end_time) {
    return res.status(400).json({ message: "End time must be after start time." });
  }

  if (normalizedStatus === "rescheduled") {
    if (!rescheduled_date || !rescheduled_start_time || !rescheduled_end_time) {
      return res.status(400).json({ message: "Rescheduled date and times are required." });
    }
    if (rescheduled_start_time >= rescheduled_end_time) {
      return res.status(400).json({ message: "Rescheduled end time must be after start time." });
    }
  }

  try {
    const scheduleRes = await db.query(
      "SELECT id, class_id, session_date, start_time, end_time FROM class_schedules WHERE id = $1",
      [scheduleId]
    );

    if (scheduleRes.rowCount === 0) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    const schedule = scheduleRes.rows[0];

    const access = await ensureTeacherOrHodClassAccess(userId, role, schedule.class_id);
    if (access.error) {
      return res.status(access.error.code).json({ message: access.error.message });
    }

    const nextDate = session_date || schedule.session_date;
    const nextStart = start_time || schedule.start_time;
    const nextEnd = end_time || schedule.end_time;

    if ((session_date || start_time || end_time) && nextStart >= nextEnd) {
      return res.status(400).json({ message: "End time must be after start time." });
    }

    // Prevent collisions for active scheduled sessions
    const nextStatus = normalizedStatus || "scheduled";
    if (nextStatus === "scheduled") {
      const overlap = await hasOverlap(schedule.class_id, nextDate, nextStart, nextEnd, scheduleId);
      if (overlap) {
        return res.status(409).json({ message: "Schedule overlaps with an existing session." });
      }
    }

    const result = await db.query(
      "UPDATE class_schedules SET " +
        "status = COALESCE($1, status), " +
        "reason = COALESCE($2, reason), " +
        "topic = COALESCE($3, topic), " +
        "session_date = COALESCE($4, session_date), " +
        "start_time = COALESCE($5, start_time), " +
        "end_time = COALESCE($6, end_time), " +
        "rescheduled_date = CASE WHEN $1 = 'rescheduled' THEN $7 ELSE rescheduled_date END, " +
        "rescheduled_start_time = CASE WHEN $1 = 'rescheduled' THEN $8 ELSE rescheduled_start_time END, " +
        "rescheduled_end_time = CASE WHEN $1 = 'rescheduled' THEN $9 ELSE rescheduled_end_time END, " +
        "updated_by_teacher_id = $10, " +
        "updated_at = NOW() " +
        "WHERE id = $11 " +
        "RETURNING id, class_id, session_date, start_time, end_time, topic, status, reason, rescheduled_date, rescheduled_start_time, rescheduled_end_time, created_at, updated_at",
      [
        normalizedStatus,
        reason || null,
        topic || null,
        session_date || null,
        start_time || null,
        end_time || null,
        rescheduled_date || null,
        rescheduled_start_time || null,
        rescheduled_end_time || null,
        access.teacherId,
        scheduleId,
      ]
    );

    return res.json({ schedule: result.rows[0] });
  } catch (error) {
    console.error("Update class schedule error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// GET /api/classes/:classId/schedules
exports.listClassSchedules = async (req, res) => {
  const { classId } = req.params;
  const userId = req.user?.userId;
  const role = normalizeStatus(req.user?.role);

  if (!classId || !userId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    if (role === "student") {
      const access = await ensureStudentClassAccess(userId, classId);
      if (access.error) {
        return res.status(access.error.code).json({ message: access.error.message });
      }
    } else if (role === "teacher" || role === "hod") {
      const access = await ensureTeacherOrHodClassAccess(userId, role, classId);
      if (access.error) {
        return res.status(access.error.code).json({ message: access.error.message });
      }
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await db.query(
      "SELECT cs.id, cs.class_id, cs.session_date, cs.start_time, cs.end_time, cs.topic, cs.status, cs.reason, " +
        "cs.rescheduled_date, cs.rescheduled_start_time, cs.rescheduled_end_time, cs.created_at, cs.updated_at, " +
        "c.name AS class_name, s.name AS subject_name, t.name AS teacher_name " +
        "FROM class_schedules cs " +
        "JOIN classes c ON c.id = cs.class_id " +
        "JOIN subjects s ON s.id = c.subject_id " +
        "JOIN teachers t ON t.id = c.teacher_id " +
        "WHERE cs.class_id = $1 " +
        "ORDER BY cs.session_date ASC, cs.start_time ASC",
      [classId]
    );

    return res.json({ schedules: result.rows });
  } catch (error) {
    console.error("List class schedules error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// GET /api/schedules
exports.listMySchedules = async (req, res) => {
  const userId = req.user?.userId;
  const role = normalizeStatus(req.user?.role);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    let result;

    if (role === "teacher") {
      const teacherId = await getTeacherId(userId);
      if (!teacherId) {
        return res.status(403).json({ message: "Teacher profile not found." });
      }

      result = await db.query(
        "SELECT cs.id, cs.class_id, cs.session_date, cs.start_time, cs.end_time, cs.topic, cs.status, cs.reason, " +
          "cs.rescheduled_date, cs.rescheduled_start_time, cs.rescheduled_end_time, c.name AS class_name, s.name AS subject_name " +
          "FROM class_schedules cs " +
          "JOIN classes c ON c.id = cs.class_id " +
          "JOIN subjects s ON s.id = c.subject_id " +
          "WHERE c.teacher_id = $1 " +
          "ORDER BY cs.session_date ASC, cs.start_time ASC",
        [teacherId]
      );
    } else if (role === "hod") {
      const departmentId = await getDepartmentId(userId);
      if (!departmentId) {
        return res.status(403).json({ message: "HOD profile not found." });
      }

      result = await db.query(
        "SELECT cs.id, cs.class_id, cs.session_date, cs.start_time, cs.end_time, cs.topic, cs.status, cs.reason, " +
          "cs.rescheduled_date, cs.rescheduled_start_time, cs.rescheduled_end_time, c.name AS class_name, s.name AS subject_name, t.name AS teacher_name " +
          "FROM class_schedules cs " +
          "JOIN classes c ON c.id = cs.class_id " +
          "JOIN subjects s ON s.id = c.subject_id " +
          "JOIN teachers t ON t.id = c.teacher_id " +
          "WHERE t.department_id = $1 " +
          "ORDER BY cs.session_date ASC, cs.start_time ASC",
        [departmentId]
      );
    } else if (role === "student") {
      const studentId = await getStudentId(userId);
      if (!studentId) {
        return res.status(403).json({ message: "Student profile not found." });
      }

      result = await db.query(
        "SELECT cs.id, cs.class_id, cs.session_date, cs.start_time, cs.end_time, cs.topic, cs.status, cs.reason, " +
          "cs.rescheduled_date, cs.rescheduled_start_time, cs.rescheduled_end_time, c.name AS class_name, s.name AS subject_name, t.name AS teacher_name " +
          "FROM class_schedules cs " +
          "JOIN classes c ON c.id = cs.class_id " +
          "JOIN subjects s ON s.id = c.subject_id " +
          "JOIN teachers t ON t.id = c.teacher_id " +
          "JOIN class_enrollments ce ON ce.class_id = c.id AND ce.status = 'approved' " +
          "WHERE ce.student_id = $1 " +
          "ORDER BY cs.session_date ASC, cs.start_time ASC",
        [studentId]
      );
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({ schedules: result.rows });
  } catch (error) {
    console.error("List my schedules error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

