// Subjects controller: database CRUD for subjects only.
// Must NOT define routes or implement auth logic.
const db = require("../../config/db");

exports.createSubject = async (req, res) => {
  const { name } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: "Name is required." });
  }

  try {
    const result = await db.query(
      "INSERT INTO subjects (name) VALUES ($1) RETURNING id, name",
      [String(name).trim()]
    );

    return res.status(201).json({ subject: result.rows[0] });
  } catch (error) {
    console.error("Create subject error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listSubjects = async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name FROM subjects ORDER BY name ASC"
    );

    return res.json({ subjects: result.rows });
  } catch (error) {
    console.error("List subjects error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.getSubjectById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      "SELECT id, name, class_id, teacher_id FROM subjects WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Subject not found." });
    }

    return res.json({ subject: result.rows[0] });
  } catch (error) {
    console.error("Get subject error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
