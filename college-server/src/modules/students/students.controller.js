// Students controller: database CRUD for students only.
// Must NOT define routes or implement auth logic.
const db = require("../../config/db");

exports.createStudent = async (req, res) => {
  const { roll_no, name, class_id, year } = req.body;

  if (!roll_no || !name || !class_id || !year) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const result = await db.query(
      "INSERT INTO students (roll_no, name, class_id, year) VALUES ($1, $2, $3, $4) RETURNING id, roll_no, name, class_id, year, created_at",
      [roll_no, name, class_id, year]
    );

    return res.status(201).json({ student: result.rows[0] });
  } catch (error) {
    console.error("Create student error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listStudents = async (req, res) => {
  const role = String(req.user?.role || "").toLowerCase();
  const userId = req.user?.userId;

  try {
    if (role === "hod") {
      const departmentResult = await db.query(
        "SELECT department_id FROM teachers WHERE user_id = $1",
        [userId]
      );

      if (departmentResult.rowCount === 0) {
        return res.status(403).json({ message: "HOD profile not found." });
      }

      const departmentId = departmentResult.rows[0].department_id;

      const result = await db.query(
        "SELECT s.id, s.name, s.roll_no " +
          "FROM students s " +
          "JOIN classes c ON c.id = s.class_id " +
          "JOIN teachers t ON t.id = c.teacher_id " +
          "WHERE t.department_id = $1 " +
          "ORDER BY s.name ASC",
        [departmentId]
      );

      return res.json({ students: result.rows });
    }

    const result = await db.query(
      "SELECT id, name, roll_no FROM students ORDER BY name ASC"
    );

    return res.json({ students: result.rows });
  } catch (error) {
    console.error("List students error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.getStudentById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      "SELECT id, roll_no, name, class_id, year, created_at FROM students WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Student not found." });
    }

    return res.json({ student: result.rows[0] });
  } catch (error) {
    console.error("Get student error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.getMyProfile = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const result = await db.query(
      "SELECT s.id, s.roll_no, s.name, s.class_id, s.year, u.email " +
        "FROM students s JOIN users u ON u.id = s.user_id " +
        "WHERE s.user_id = $1",
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    return res.json({ student: result.rows[0] });
  } catch (error) {
    console.error("Get student profile error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
