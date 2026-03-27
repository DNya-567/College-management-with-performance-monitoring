// Auth controller: handles login, current-user lookup, and password management.
// Must NOT define routes or read Authorization headers.

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../../config/db.js';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { sendEmail } from '../../utils/email.js';

// Helper: Hash reset token
const hashToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

// Helper: Resolve display name
const resolveDisplayName = async (userId, role) => {
  try {
    if (role === 'student') {
      const res = await pool.query('SELECT name FROM students WHERE user_id = $1', [userId]);
      return res.rowCount > 0 ? res.rows[0].name : null;
    } else if (['teacher', 'hod'].includes(role)) {
      const res = await pool.query('SELECT name FROM teachers WHERE user_id = $1', [userId]);
      return res.rowCount > 0 ? res.rows[0].name : null;
    }
  } catch (error) {
    console.error('Error resolving display name:', error);
  }
  return null;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Authenticates user and returns JWT token
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn('Login attempt with missing credentials', { email });
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    logger.info('Login attempt', { email, ip: req.ip, correlationId: req.correlationId });

    const result = await pool.query(
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

/**
 * GET /api/auth/me
 * Returns current authenticated user
 */
export const me = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const result = await pool.query(
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

/**
 * POST /api/auth/register/teacher
 * Register a new teacher
 */
export const registerTeacher = async (req, res) => {
  const { name, email, password, department_id } = req.body;

  if (!name || !email || !password || !department_id) {
    return res.status(400).json({
      message: "Name, email, password, and department are required.",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query("BEGIN");

    const userResult = await pool.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'teacher') RETURNING id, email, role",
      [email, passwordHash]
    );

    const user = userResult.rows[0];

    const teacherResult = await pool.query(
      "INSERT INTO teachers (name, department_id, user_id) VALUES ($1, $2, $3) RETURNING id, name, department_id, user_id",
      [name, department_id, user.id]
    );

    await pool.query("COMMIT");

    return res.status(201).json({
      user: { id: user.id, email: user.email, role: String(user.role).toLowerCase() },
      teacher: teacherResult.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK").catch(() => {});
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already in use." });
    }
    console.error("Register teacher error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * POST /api/auth/register/student
 * Register a new student
 */
export const registerStudent = async (req, res) => {
  const { name, email, password, roll_no, year, department_id } = req.body;

  if (!name || !email || !password || !roll_no || year === undefined || !department_id) {
    return res.status(400).json({
      message: "Name, email, password, roll number, year, and department are required.",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query("BEGIN");

    const userResult = await pool.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'student') RETURNING id, email, role",
      [email, passwordHash]
    );

    const user = userResult.rows[0];

    const studentResult = await pool.query(
      "INSERT INTO students (roll_no, name, year, department_id, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, roll_no, name, year, user_id",
      [roll_no, name, Number(year), department_id, user.id]
    );

    await pool.query("COMMIT");

    return res.status(201).json({
      user: { id: user.id, email: user.email, role: String(user.role).toLowerCase() },
      student: studentResult.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK").catch(() => {});
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already in use." });
    }
    console.error("Register student error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * POST /api/auth/register/hod
 * Register a new HOD (Head of Department)
 */
export const registerHod = async (req, res) => {
  const { name, email, password, department_id } = req.body;

  if (!name || !email || !password || !department_id) {
    return res.status(400).json({
      message: "Name, email, password, and department are required.",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query("BEGIN");

    const userResult = await pool.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'hod') RETURNING id, email, role",
      [email, passwordHash]
    );

    const user = userResult.rows[0];

    const teacherResult = await pool.query(
      "INSERT INTO teachers (name, department_id, user_id) VALUES ($1, $2, $3) RETURNING id, name, department_id, user_id",
      [name, department_id, user.id]
    );

    await pool.query("COMMIT");

    return res.status(201).json({
      user: { id: user.id, email: user.email, role: String(user.role).toLowerCase() },
      teacher: teacherResult.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK").catch(() => {});
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already in use." });
    }
    console.error("Register HOD error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PUT /api/auth/change-password
 * Self-service password change
 */
export const changePassword = async (req, res) => {
  const userId = req.user?.userId;
  const role = String(req.user?.role || "").toLowerCase();
  const { current_password, new_password } = req.body;

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
    const userRes = await pool.query(
      "SELECT id, email, password_hash, role FROM users WHERE id = $1",
      [userId]
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = userRes.rows[0];

    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [newHash, userId]
    );

    const displayName = (await resolveDisplayName(userId, role)) || user.email;
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const roleName = role.charAt(0).toUpperCase() + role.slice(1);

    sendEmail({
      to: user.email,
      subject: "Password Changed — College Management System",
      text: `Hello ${displayName},\n\nYour password for your ${roleName} account was successfully changed on ${now}.\n\nIf you did not make this change, please contact your administrator immediately.\n\n— College Management System`,
    });

    return res.json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * POST /api/auth/forgot-password
 * Request password reset link
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ message: "Email is required." });
  }

  const OK = () => res.json({
    message: "If that email is registered, a reset link has been sent.",
  });

  try {
    const userRes = await pool.query(
      "SELECT id, email, role, is_active FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    if (userRes.rowCount === 0) return OK();

    const user = userRes.rows[0];
    const role = String(user.role || "").toLowerCase();

    if (!["student", "teacher", "hod"].includes(role)) return OK();
    if (user.is_active === false) return OK();

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      "DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL",
      [user.id]
    );

    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [user.id, tokenHash, expiresAt]
    );

    const name = (await resolveDisplayName(user.id, role)) || user.email;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    sendEmail({
      to: user.email,
      subject: "Reset Your Password — College Management System",
      text: `Hello ${name},\n\nWe received a request to reset your password.\n\nReset link (valid for 15 minutes):\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.\n\n— College Management System`,
    });

    return OK();
  } catch (error) {
    console.error("Forgot password error:", error);
    return OK();
  }
};

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
export const resetPassword = async (req, res) => {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    return res.status(400).json({ message: "Token and new password are required." });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  try {
    const tokenHash = hashToken(token);

    const tokenRes = await pool.query(
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

    if (row.used_at !== null) {
      return res.status(400).json({ message: "This reset link has already been used." });
    }

    if (new Date() > new Date(row.expires_at)) {
      return res.status(400).json({ message: "Reset link has expired. Please request a new one." });
    }

    if (row.is_active === false) {
      return res.status(403).json({ message: "Account is deactivated. Contact admin." });
    }

    const role = String(row.role || "").toLowerCase();
    const newHash = await bcrypt.hash(new_password, 10);

    await pool.query("BEGIN");
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, row.user_id]);
    await pool.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1",
      [row.id]
    );
    await pool.query("COMMIT");

    const name = (await resolveDisplayName(row.user_id, role)) || row.email;
    const roleName = role.charAt(0).toUpperCase() + role.slice(1);
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    sendEmail({
      to: row.email,
      subject: "Password Reset Successful — College Management System",
      text: `Hello ${name},\n\nYour ${roleName} account password was successfully reset on ${now}.\n\nYou can now sign in with your new password.\n\nIf you did not make this change, contact your administrator immediately.\n\n— College Management System`,
    });

    return res.json({ message: "Password reset successful. You can now sign in." });
  } catch (error) {
    await pool.query("ROLLBACK").catch(() => {});
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

