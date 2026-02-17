// Auth controller: handles login and current-user lookup.
// Must NOT define routes or read Authorization headers.

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("../../config/db");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const result = await db.query(
      "SELECT id, email, role, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = result.rows[0];
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
      { expiresIn: "1h" }
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
