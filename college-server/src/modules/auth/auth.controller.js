// Auth controller: handles login and current-user lookup.
// Must NOT define routes or read Authorization headers.

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../../config/db");
const env = require("../../config/env");
const { sendEmail } = require("../../utils/email");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const result = await db.query(
      "SELECT id, email, role, password_hash, is_active FROM users WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = result.rows[0];

    // Block deactivated accounts
    if (user.is_active === false) {
      return res.status(403).json({ message: "Account is deactivated. Contact admin." });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server misconfiguration." });
    }

    const normalizedRole = String(user.role || "").toLowerCase();

    const token = jwt.sign(
      { userId: user.id, role: normalizedRole },
      process.env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: normalizedRole },
    });
  } catch (error) {
    console.error("Auth login error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.me = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const result = await db.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = result.rows[0];
    return res.json({
      user: {
        ...user,
        role: String(user.role || "").toLowerCase(),
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.registerTeacher = async (req, res) => {
  const { name, email, password, department_id } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  const normalizedDepartmentId = department_id ? String(department_id).trim() : "";
  const isUuid = (value) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

  if (normalizedDepartmentId && !isUuid(normalizedDepartmentId)) {
    return res.status(400).json({ message: "Department ID must be a valid UUID." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    await db.query("BEGIN");

    const userResult = await db.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'teacher') RETURNING id, email, role",
      [email, passwordHash]
    );

    const user = userResult.rows[0];

    const teacherResult = await db.query(
      "INSERT INTO teachers (name, department_id, user_id) VALUES ($1, $2, $3) RETURNING id, name, department_id, user_id",
      [name, normalizedDepartmentId || null, user.id]
    );

    await db.query("COMMIT");

    return res.status(201).json({
      user: { id: user.id, email: user.email, role: String(user.role).toLowerCase() },
      teacher: teacherResult.rows[0],
    });
  } catch (error) {
    await db.query("ROLLBACK");
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already in use." });
    }
    console.error("Register teacher error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * POST /api/auth/register/hod
 * HOD is a teacher with role='hod'. Requires department_id so the system
 * can scope all department queries to this HOD's department.
 */
exports.registerHod = async (req, res) => {
  const { name, email, password, department_id } = req.body;

  if (!name || !email || !password || !department_id) {
    return res.status(400).json({
      message: "Name, email, password, and department are required.",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    await db.query("BEGIN");

    const userResult = await db.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'hod') RETURNING id, email, role",
      [email, passwordHash]
    );

    const user = userResult.rows[0];

    const teacherResult = await db.query(
      "INSERT INTO teachers (name, department_id, user_id) VALUES ($1, $2, $3) RETURNING id, name, department_id, user_id",
      [name, department_id, user.id]
    );

    await db.query("COMMIT");

    return res.status(201).json({
      user: { id: user.id, email: user.email, role: String(user.role).toLowerCase() },
      teacher: teacherResult.rows[0],
    });
  } catch (error) {
    await db.query("ROLLBACK");
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already in use." });
    }
    console.error("Register HOD error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.registerStudent = async (req, res) => {
  const { name, email, password, roll_no, year, class_id } = req.body;

  if (!name || !email || !password || !roll_no || year === undefined) {
    return res.status(400).json({
      message: "Name, email, password, roll number, and year are required.",
    });
  }

  const normalizedClassId = class_id ? String(class_id).trim() : "";
  const isUuid = (value) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

  if (normalizedClassId && !isUuid(normalizedClassId)) {
    return res.status(400).json({ message: "Class ID must be a valid UUID." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    await db.query("BEGIN");

    const userResult = await db.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'student') RETURNING id, email, role",
      [email, passwordHash]
    );

    const user = userResult.rows[0];

    const studentResult = await db.query(
      "INSERT INTO students (roll_no, name, class_id, year, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, roll_no, name, class_id, year, user_id",
      [roll_no, name, normalizedClassId || null, Number(year), user.id]
    );

    await db.query("COMMIT");

    return res.status(201).json({
      user: { id: user.id, email: user.email, role: String(user.role).toLowerCase() },
      student: studentResult.rows[0],
    });
  } catch (error) {
    await db.query("ROLLBACK");
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already in use." });
    }
    console.error("Register student error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PUT /api/auth/change-password
 * Self-service password change for student, teacher, and HOD only (not admin).
 * Requires current password for verification.
 * Sends email notification after successful change.
 */
exports.changePassword = async (req, res) => {
  const userId = req.user?.userId;
  const role = String(req.user?.role || "").toLowerCase();
  const { current_password, new_password } = req.body;

  // Only student, teacher, hod can self-reset
  if (!["student", "teacher", "hod"].includes(role)) {
    return res.status(403).json({ message: "Password change not available for this role." });
  }

  if (!current_password || !new_password) {
    return res.status(400).json({ message: "Current password and new password are required." });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters." });
  }

  if (current_password === new_password) {
    return res.status(400).json({ message: "New password must be different from current password." });
  }

  try {
    // Fetch current user
    const userRes = await db.query(
      "SELECT id, email, password_hash, role FROM users WHERE id = $1",
      [userId]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = userRes.rows[0];

    // Verify current password
    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    // Hash and update
    const newHash = await bcrypt.hash(new_password, 10);
    await db.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [newHash, userId]
    );

    // Resolve display name for the email
    let displayName = user.email;
    if (role === "teacher" || role === "hod") {
      const t = await db.query("SELECT name FROM teachers WHERE user_id = $1", [userId]);
      if (t.rowCount > 0) displayName = t.rows[0].name;
    } else if (role === "student") {
      const s = await db.query("SELECT name FROM students WHERE user_id = $1", [userId]);
      if (s.rowCount > 0) displayName = s.rows[0].name;
    }

    // Send email notification (fire-and-forget)
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const roleName = role.charAt(0).toUpperCase() + role.slice(1);

    sendEmail({
      to: user.email,
      subject: "Password Changed — College Management System",
      text: [
        `Hello ${displayName},`,
        "",
        `Your password for your ${roleName} account was successfully changed on ${now}.`,
        "",
        "Details:",
        `  • Email: ${user.email}`,
        `  • Role: ${roleName}`,
        `  • Changed at: ${now}`,
        "",
        "If you did not make this change, please contact your administrator immediately.",
        "",
        "— College Management System",
      ].join("\n"),
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-bottom: 8px;">Password Changed</h2>
          <p style="color: #64748b; font-size: 14px;">Hello <strong>${displayName}</strong>,</p>
          <p style="color: #64748b; font-size: 14px;">
            Your password for your <strong>${roleName}</strong> account was successfully changed.
          </p>
          <table style="width: 100%; font-size: 14px; color: #334155; margin: 16px 0;">
            <tr><td style="padding: 4px 0; color: #94a3b8;">Email</td><td style="padding: 4px 0;">${user.email}</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Role</td><td style="padding: 4px 0;">${roleName}</td></tr>
            <tr><td style="padding: 4px 0; color: #94a3b8;">Changed at</td><td style="padding: 4px 0;">${now}</td></tr>
          </table>
          <p style="color: #dc2626; font-size: 13px; margin-top: 16px;">
            If you did not make this change, contact your administrator immediately.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">— College Management System</p>
        </div>
      `,
    });

    return res.json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

