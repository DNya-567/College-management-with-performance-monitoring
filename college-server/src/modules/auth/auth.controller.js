// Auth controller: handles login, current-user lookup, and password management.
// Must NOT define routes or read Authorization headers.

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../../config/db");
const env = require("../../config/env");
const logger = require("../../config/logger");
const { sendEmail } = require("../../utils/email");

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** SHA-256 hash of a plain token (we never store raw tokens in DB) */
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/** Resolve display name for a user (teacher/hod → teachers table, student → students table) */
const resolveDisplayName = async (userId, role) => {
  try {
    if (role === "teacher" || role === "hod") {
      const r = await db.query("SELECT name FROM teachers WHERE user_id = $1", [userId]);
      if (r.rowCount > 0) return r.rows[0].name;
    } else if (role === "student") {
      const r = await db.query("SELECT name FROM students WHERE user_id = $1", [userId]);
      if (r.rowCount > 0) return r.rows[0].name;
    }
  } catch (_) {
    /* ignore — fall back to email */
  }
  return null;
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn('Login attempt with missing credentials', { email });
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    logger.info('Login attempt', { email, ip: req.ip, correlationId: req.correlationId });

    const result = await db.query(
      "SELECT id, email, role, password_hash, is_active FROM users WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      logger.warn('Login failed - user not found', { email, ip: req.ip });
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = result.rows[0];

    // Block deactivated accounts
    if (user.is_active === false) {
      logger.warn('Login attempt on deactivated account', { userId: user.id, email, ip: req.ip });
      return res.status(403).json({ message: "Account is deactivated. Contact admin." });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      logger.warn('Login failed - invalid password', { userId: user.id, email, ip: req.ip });
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET not configured', { email });
      return res.status(500).json({ message: "Server misconfiguration." });
    }

    const normalizedRole = String(user.role || "").toLowerCase();

    const token = jwt.sign(
      { userId: user.id, role: normalizedRole },
      process.env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    logger.info('Login successful', {
      userId: user.id,
      email,
      role: normalizedRole,
      ip: req.ip,
      correlationId: req.correlationId
    });

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: normalizedRole },
    });
  } catch (error) {
    logger.logError(error, { email, step: 'login', correlationId: req.correlationId });
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
    const resolved = await resolveDisplayName(userId, role);
    const displayName = resolved || user.email;

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

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD — POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Accepts an email address.
 * If the email belongs to a student, teacher, or HOD, generates a secure
 * one-time reset token, stores its hash in the DB (15-min TTL), and emails
 * a reset link.
 *
 * Always responds 200 so attackers can't enumerate valid emails.
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ message: "Email is required." });
  }

  // Always 200 — don't reveal whether email exists
  const OK = () => res.json({
    message: "If that email is registered, a reset link has been sent.",
  });

  try {
    const userRes = await db.query(
      "SELECT id, email, role, is_active FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    // No user or wrong role — silently succeed (no info leakage)
    if (userRes.rowCount === 0) return OK();

    const user = userRes.rows[0];
    const role = String(user.role || "").toLowerCase();

    if (!["student", "teacher", "hod"].includes(role)) return OK();
    if (user.is_active === false) return OK();

    // Generate a cryptographically random 32-byte token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalidate any existing unused tokens for this user
    await db.query(
      "DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL",
      [user.id]
    );

    // Store the hashed token
    await db.query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [user.id, tokenHash, expiresAt]
    );

    // Resolve display name
    const name = (await resolveDisplayName(user.id, role)) || user.email;
    const roleName = role.charAt(0).toUpperCase() + role.slice(1);

    // Build reset URL — use env var or default to localhost
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    // Send email (fire-and-forget)
    sendEmail({
      to: user.email,
      subject: "Reset Your Password — College Management System",
      text: [
        `Hello ${name},`,
        "",
        "We received a request to reset your password.",
        "",
        `Reset link (valid for 15 minutes):`,
        resetUrl,
        "",
        "If you did not request this, you can safely ignore this email.",
        "Your password will NOT change unless you click the link above.",
        "",
        "— College Management System",
      ].join("\n"),
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="margin-bottom: 20px;">
            <div style="display:inline-flex; align-items:center; justify-content:center; width:40px; height:40px; background:#0052FF; border-radius:10px;">
              <span style="color:#fff; font-size:20px;">🔑</span>
            </div>
          </div>
          <h2 style="color: #0f172a; margin: 0 0 8px;">Reset Your Password</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 16px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">
            We received a request to reset the password for your <strong>${roleName}</strong> account.
            Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block; background:#0052FF; color:#fff; text-decoration:none;
                    padding: 12px 28px; border-radius: 999px; font-size:14px; font-weight:600;
                    margin-bottom:20px;">
            Reset Password
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin: 16px 0 0;">
            Or copy this link: <a href="${resetUrl}" style="color:#0052FF;">${resetUrl}</a>
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
          <hr style="border:none; border-top:1px solid #e2e8f0; margin:20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">— College Management System</p>
        </div>
      `,
    });

    return OK();
  } catch (error) {
    console.error("Forgot password error:", error);
    // Still return 200 — don't reveal internals
    return OK();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD — POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Accepts { token, new_password }.
 * Validates the token hash exists in DB, is not expired, and not already used.
 * Updates the user's password and marks the token as used.
 * Sends a confirmation email.
 */
exports.resetPassword = async (req, res) => {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    return res.status(400).json({ message: "Token and new password are required." });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  try {
    const tokenHash = hashToken(token);

    // Look up the token
    const tokenRes = await db.query(
      `SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at,
              u.email, u.role, u.is_active
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1`,
      [tokenHash]
    );

    if (tokenRes.rowCount === 0) {
      return res.status(400).json({ message: "Invalid or expired reset link." });
    }

    const row = tokenRes.rows[0];

    // Already used
    if (row.used_at !== null) {
      return res.status(400).json({ message: "This reset link has already been used." });
    }

    // Expired
    if (new Date() > new Date(row.expires_at)) {
      return res.status(400).json({ message: "Reset link has expired. Please request a new one." });
    }

    // Deactivated account
    if (row.is_active === false) {
      return res.status(403).json({ message: "Account is deactivated. Contact admin." });
    }

    const role = String(row.role || "").toLowerCase();

    // Hash new password and update
    const newHash = await bcrypt.hash(new_password, 10);

    await db.query("BEGIN");
    await db.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, row.user_id]);
    await db.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1",
      [row.id]
    );
    await db.query("COMMIT");

    // Send confirmation email (fire-and-forget)
    const name = (await resolveDisplayName(row.user_id, role)) || row.email;
    const roleName = role.charAt(0).toUpperCase() + role.slice(1);
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    sendEmail({
      to: row.email,
      subject: "Password Reset Successful — College Management System",
      text: [
        `Hello ${name},`,
        "",
        `Your ${roleName} account password was successfully reset on ${now}.`,
        "",
        "You can now sign in with your new password.",
        "",
        "If you did not make this change, contact your administrator immediately.",
        "",
        "— College Management System",
      ].join("\n"),
      html: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a; margin: 0 0 8px;">✅ Password Reset Successful</h2>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 16px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #64748b; font-size: 14px; margin: 0 0 16px;">
            Your <strong>${roleName}</strong> account password was successfully reset.
            You can now <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login" style="color:#0052FF;">sign in</a> with your new password.
          </p>
          <table style="width:100%; font-size:14px; color:#334155; margin:16px 0; border-collapse:collapse;">
            <tr>
              <td style="padding:4px 0; color:#94a3b8;">Email</td>
              <td style="padding:4px 0;">${row.email}</td>
            </tr>
            <tr>
              <td style="padding:4px 0; color:#94a3b8;">Role</td>
              <td style="padding:4px 0;">${roleName}</td>
            </tr>
            <tr>
              <td style="padding:4px 0; color:#94a3b8;">Reset at</td>
              <td style="padding:4px 0;">${now}</td>
            </tr>
          </table>
          <p style="color:#dc2626; font-size:13px; margin-top:16px;">
            If you did not make this change, contact your administrator immediately.
          </p>
          <hr style="border:none; border-top:1px solid #e2e8f0; margin:16px 0;" />
          <p style="color:#94a3b8; font-size:12px; margin:0;">— College Management System</p>
        </div>
      `,
    });

    return res.json({ message: "Password reset successful. You can now sign in." });
  } catch (error) {
    await db.query("ROLLBACK").catch(() => {});
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

