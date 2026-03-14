// Admin controller: system-wide queries for the admin dashboard.
// Only admin-role users should reach these functions (enforced by routes).
// Must NOT define routes, read Authorization headers, or implement auth logic.
const db = require("../../config/db");
const bcrypt = require("bcrypt");
const { logAudit } = require("../../utils/auditLog");

/**
 * GET /api/admin/stats
 * Returns system-wide counts for the dashboard cards.
 */
exports.getSystemStats = async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users)::int                                         AS total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'admin')::int                    AS total_admins,
        (SELECT COUNT(*) FROM users WHERE role = 'teacher')::int                  AS total_teachers,
        (SELECT COUNT(*) FROM users WHERE role = 'student')::int                  AS total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'hod')::int                      AS total_hods,
        (SELECT COUNT(*) FROM departments)::int                                   AS total_departments,
        (SELECT COUNT(*) FROM classes)::int                                       AS total_classes,
        (SELECT COUNT(*) FROM class_enrollments WHERE status = 'pending')::int    AS pending_enrollments,
        (SELECT COUNT(*) FROM class_enrollments WHERE status = 'approved')::int   AS approved_enrollments,
        (SELECT COUNT(*) FROM announcements)::int                                 AS total_announcements
    `);

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/admin/users?role=teacher|student|hod|admin
 * Lists all users with optional role filter. Joins teacher/student tables for names.
 */
exports.listAllUsers = async (req, res) => {
  const { role } = req.query;

  try {
    let query = `
      SELECT
        u.id,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        COALESCE(t.name, s.name) AS name,
        s.roll_no
      FROM users u
      LEFT JOIN teachers t ON t.user_id = u.id
      LEFT JOIN students  s ON s.user_id = u.id
    `;
    const params = [];

    if (role && ["admin", "teacher", "student", "hod"].includes(role)) {
      query += " WHERE u.role = $1";
      params.push(role);
    }

    query += " ORDER BY u.created_at DESC";

    const result = await db.query(query, params);
    return res.json({ users: result.rows });
  } catch (error) {
    console.error("Admin list users error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/admin/classes
 * Lists every class with teacher name, subject name, and enrolled student count.
 */
exports.listAllClasses = async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT
        c.id,
        c.name,
        c.year,
        sub.name   AS subject_name,
        t.name     AS teacher_name,
        d.name     AS department_name,
        (SELECT COUNT(*) FROM class_enrollments ce
         WHERE ce.class_id = c.id AND ce.status = 'approved')::int AS student_count
      FROM classes c
      JOIN subjects  sub ON sub.id = c.subject_id
      JOIN teachers  t   ON t.id   = c.teacher_id
      LEFT JOIN departments d ON d.id = t.department_id
      ORDER BY c.year DESC, c.name ASC
    `);

    return res.json({ classes: result.rows });
  } catch (error) {
    console.error("Admin list classes error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/admin/teachers
 * Lists all teachers with department name and class count.
 */
exports.listAllTeachers = async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT
        t.id,
        t.name,
        u.email,
        u.role,
        d.name AS department_name,
        (SELECT COUNT(*) FROM classes c WHERE c.teacher_id = t.id)::int AS class_count
      FROM teachers t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN departments d ON d.id = t.department_id
      ORDER BY t.name ASC
    `);

    return res.json({ teachers: result.rows });
  } catch (error) {
    console.error("Admin list teachers error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/admin/students
 * Lists all students with enrollment count.
 */
exports.listAllStudents = async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT
        s.id,
        s.name,
        s.roll_no,
        s.year,
        u.email,
        (SELECT COUNT(*) FROM class_enrollments ce
         WHERE ce.student_id = s.id AND ce.status = 'approved')::int AS enrollment_count
      FROM students s
      JOIN users u ON u.id = s.user_id
      ORDER BY s.name ASC
    `);

    return res.json({ students: result.rows });
  } catch (error) {
    console.error("Admin list students error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/admin/departments
 * Lists all departments with HOD name and teacher count.
 */
exports.listAllDepartments = async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT
        d.id,
        d.name,
        t.name AS hod_name,
        t.id   AS hod_teacher_id,
        (SELECT COUNT(*) FROM teachers t2 WHERE t2.department_id = d.id)::int AS teacher_count
      FROM departments d
      LEFT JOIN teachers t ON t.id = d.hod_id
      ORDER BY d.name ASC
    `);

    return res.json({ departments: result.rows });
  } catch (error) {
    console.error("Admin list departments error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * POST /api/admin/departments
 * Creates a new department.
 */
exports.createDepartment = async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Department name is required." });
  }

  try {
    const result = await db.query(
      "INSERT INTO departments (name) VALUES ($1) RETURNING id, name",
      [name.trim()]
    );
    return res.status(201).json({ department: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Department name already exists." });
    }
    console.error("Admin create department error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PUT /api/admin/departments/:id
 * Updates department name.
 */
exports.updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Department name is required." });
  }

  try {
    const result = await db.query(
      "UPDATE departments SET name = $1 WHERE id = $2 RETURNING id, name",
      [name.trim(), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Department not found." });
    }

    return res.json({ department: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Department name already exists." });
    }
    console.error("Admin update department error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * DELETE /api/admin/departments/:id
 * Deletes a department if it has no teachers assigned.
 */
exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    // Prevent deleting departments with assigned teachers
    const teacherCheck = await db.query(
      "SELECT COUNT(*) AS count FROM teachers WHERE department_id = $1",
      [id]
    );

    if (Number(teacherCheck.rows[0].count) > 0) {
      return res.status(409).json({
        message: "Cannot delete department with assigned teachers. Reassign them first.",
      });
    }

    const result = await db.query(
      "DELETE FROM departments WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Department not found." });
    }

    return res.json({ message: "Department deleted." });
  } catch (error) {
    console.error("Admin delete department error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PUT /api/admin/departments/:id/hod
 * Assigns a teacher as HOD of a department.
 * - Sets departments.hod_id = teacherId
 * - Updates the teacher's user role to 'hod'
 * - Reverts the previous HOD (if any) back to 'teacher' role
 */
exports.assignHod = async (req, res) => {
  const { id: departmentId } = req.params;
  const { teacher_id } = req.body;

  if (!teacher_id) {
    return res.status(400).json({ message: "teacher_id is required." });
  }

  try {
    await db.query("BEGIN");

    // Verify the department exists
    const deptRes = await db.query(
      "SELECT id, hod_id FROM departments WHERE id = $1",
      [departmentId]
    );
    if (deptRes.rowCount === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "Department not found." });
    }

    const oldHodId = deptRes.rows[0].hod_id;

    // Verify the teacher exists and belongs to this department
    const teacherRes = await db.query(
      "SELECT id, user_id FROM teachers WHERE id = $1 AND department_id = $2",
      [teacher_id, departmentId]
    );
    if (teacherRes.rowCount === 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({
        message: "Teacher not found or does not belong to this department.",
      });
    }

    const newHodUserId = teacherRes.rows[0].user_id;

    // Revert old HOD back to 'teacher' role (if different from new HOD)
    if (oldHodId && oldHodId !== teacher_id) {
      const oldHodRes = await db.query(
        "SELECT user_id FROM teachers WHERE id = $1",
        [oldHodId]
      );
      if (oldHodRes.rowCount > 0) {
        await db.query("UPDATE users SET role = 'teacher' WHERE id = $1", [
          oldHodRes.rows[0].user_id,
        ]);
      }
    }

    // Set new HOD
    await db.query("UPDATE departments SET hod_id = $1 WHERE id = $2", [
      teacher_id,
      departmentId,
    ]);

    // Promote the teacher to 'hod' role
    await db.query("UPDATE users SET role = 'hod' WHERE id = $1", [newHodUserId]);

    await db.query("COMMIT");

    return res.json({ message: "HOD assigned successfully." });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Admin assign HOD error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/admin/recent-activity
 * Returns the 10 most recent announcements as a proxy for recent activity.
 */
exports.getRecentActivity = async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT
        a.id,
        a.title,
        a.created_at,
        t.name AS teacher_name,
        c.name AS class_name
      FROM announcements a
      JOIN teachers t ON t.id = a.teacher_id
      LEFT JOIN classes c ON c.id = a.class_id
      ORDER BY a.created_at DESC
      LIMIT 10
    `);

    return res.json({ activities: result.rows });
  } catch (error) {
    console.error("Admin recent activity error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ──────────────────────────────────────────────
// CRUD Operations
// ──────────────────────────────────────────────

/**
 * PUT /api/admin/users/:id/reset-password
 * Admin resets a user's password. Cannot reset own password here.
 */
exports.resetUserPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const adminId = req.user.userId;

  if (id === adminId) {
    return res.status(400).json({ message: "Cannot reset your own password through admin panel." });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  try {
    const userCheck = await db.query("SELECT id, email FROM users WHERE id = $1", [id]);
    if (userCheck.rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const hash = await bcrypt.hash(password, 10);
    await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, id]);

    logAudit(adminId, "reset_password", "user", id, { email: userCheck.rows[0].email });

    return res.json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Admin reset password error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PUT /api/admin/users/:id/toggle-status
 * Activate or deactivate a user account. Cannot deactivate self.
 */
exports.toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.userId;

  if (id === adminId) {
    return res.status(400).json({ message: "Cannot deactivate your own account." });
  }

  try {
    const result = await db.query(
      "UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, email, is_active",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = result.rows[0];
    logAudit(adminId, user.is_active ? "activate_user" : "deactivate_user", "user", id, {
      email: user.email,
    });

    return res.json({ message: `User ${user.is_active ? "activated" : "deactivated"}.`, is_active: user.is_active });
  } catch (error) {
    console.error("Admin toggle status error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Permanently deletes a user and all cascading data. Cannot delete self.
 */
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.userId;

  if (id === adminId) {
    return res.status(400).json({ message: "Cannot delete your own account." });
  }

  try {
    const userRes = await db.query("SELECT id, email, role FROM users WHERE id = $1", [id]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = userRes.rows[0];
    await db.query("BEGIN");

    if (user.role === "student") {
      // Get student record
      const sRes = await db.query("SELECT id FROM students WHERE user_id = $1", [id]);
      if (sRes.rowCount > 0) {
        const studentId = sRes.rows[0].id;
        await db.query("DELETE FROM attendance WHERE student_id = $1", [studentId]);
        await db.query("DELETE FROM marks WHERE student_id = $1", [studentId]);
        await db.query("DELETE FROM class_enrollments WHERE student_id = $1", [studentId]);
        await db.query("DELETE FROM students WHERE id = $1", [studentId]);
      }
    }

    if (user.role === "teacher" || user.role === "hod") {
      const tRes = await db.query("SELECT id FROM teachers WHERE user_id = $1", [id]);
      if (tRes.rowCount > 0) {
        const teacherId = tRes.rows[0].id;
        // Clear HOD references
        await db.query("UPDATE departments SET hod_id = NULL WHERE hod_id = $1", [teacherId]);
        // Delete announcements by this teacher
        await db.query("DELETE FROM announcements WHERE teacher_id = $1", [teacherId]);
        // Delete marks entered by this teacher
        await db.query("DELETE FROM marks WHERE teacher_id = $1", [teacherId]);
        // Delete attendance/enrollments/marks for classes owned by this teacher
        const classIds = await db.query("SELECT id FROM classes WHERE teacher_id = $1", [teacherId]);
        for (const cls of classIds.rows) {
          await db.query("DELETE FROM attendance WHERE class_id = $1", [cls.id]);
          await db.query("DELETE FROM marks WHERE class_id = $1", [cls.id]);
          await db.query("DELETE FROM class_enrollments WHERE class_id = $1", [cls.id]);
          await db.query("DELETE FROM announcements WHERE class_id = $1", [cls.id]);
        }
        await db.query("DELETE FROM classes WHERE teacher_id = $1", [teacherId]);
        await db.query("DELETE FROM teachers WHERE id = $1", [teacherId]);
      }
    }

    await db.query("DELETE FROM users WHERE id = $1", [id]);
    await db.query("COMMIT");

    logAudit(adminId, "delete_user", "user", id, { email: user.email, role: user.role });

    return res.json({ message: "User deleted successfully." });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Admin delete user error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PUT /api/admin/teachers/:id/department
 * Reassign a teacher to a different department.
 */
exports.updateTeacherDepartment = async (req, res) => {
  const { id } = req.params; // teacher id
  const { department_id } = req.body;
  const adminId = req.user.userId;

  if (!department_id) {
    return res.status(400).json({ message: "department_id is required." });
  }

  try {
    await db.query("BEGIN");

    const teacherRes = await db.query(
      "SELECT id, department_id, user_id FROM teachers WHERE id = $1",
      [id]
    );
    if (teacherRes.rowCount === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "Teacher not found." });
    }

    const oldDeptId = teacherRes.rows[0].department_id;

    // If teacher was HOD of old department, clear that reference
    if (oldDeptId) {
      await db.query(
        "UPDATE departments SET hod_id = NULL WHERE id = $1 AND hod_id = $2",
        [oldDeptId, id]
      );
      // If they were HOD, revert role to teacher
      const hodCheck = await db.query(
        "SELECT role FROM users WHERE id = $1",
        [teacherRes.rows[0].user_id]
      );
      if (hodCheck.rows[0]?.role === "hod") {
        await db.query("UPDATE users SET role = 'teacher' WHERE id = $1", [teacherRes.rows[0].user_id]);
      }
    }

    // Verify new department exists
    const deptCheck = await db.query("SELECT id FROM departments WHERE id = $1", [department_id]);
    if (deptCheck.rowCount === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "Department not found." });
    }

    await db.query("UPDATE teachers SET department_id = $1 WHERE id = $2", [department_id, id]);
    await db.query("COMMIT");

    logAudit(adminId, "update_teacher_department", "teacher", id, {
      old_department: oldDeptId,
      new_department: department_id,
    });

    return res.json({ message: "Teacher department updated." });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Admin update teacher dept error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/admin/audit-logs
 * Returns recent audit log entries (newest first).
 */
exports.getAuditLogs = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  try {
    const result = await db.query(
      `SELECT al.*, u.email AS admin_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.admin_id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return res.json({ logs: result.rows });
  } catch (error) {
    console.error("Admin audit logs error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * POST /api/admin/indexes/create
 * Creates all production database indexes
 * CRITICAL: Run once on first deployment
 * Safe to run multiple times (indexes have IF NOT EXISTS)
 */
exports.createIndexes = async (req, res) => {
  const logger = require("../../config/logger");
  const { applyIndexes } = require("../../utils/indexing");

  try {
    logger.info('Admin triggered database indexing');
    const result = await applyIndexes();

    logger.info('Database indexing completed', {
      created: result.created,
      skipped: result.skipped
    });

    return res.json({
      message: 'Database indexes created successfully',
      created: result.created,
      skipped: result.skipped,
      total: result.created + result.skipped
    });
  } catch (error) {
    logger.logError(error, {
      step: 'createIndexes',
      action: 'admin_indexing'
    });
    return res.status(500).json({ message: "Failed to create indexes." });
  }
};

/**
 * GET /api/admin/indexes/list
 * Lists all existing database indexes
 */
exports.listIndexes = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        indexname,
        tablename,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);

    return res.json({
      total: result.rows.length,
      indexes: result.rows
    });
  } catch (error) {
    console.error("List indexes error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/admin/indexes/stats
 * Returns index usage statistics
 * Shows which indexes are being used and how effective they are
 */
exports.getIndexStats = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
      ORDER BY idx_scan DESC
    `);

    // Calculate total index size
    const totalSize = await db.query(`
      SELECT
        pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
    `);

    return res.json({
      total_indexes: result.rows.length,
      total_size: totalSize.rows[0]?.total_size || '0 bytes',
      indexes: result.rows
    });
  } catch (error) {
    console.error("Index stats error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};


