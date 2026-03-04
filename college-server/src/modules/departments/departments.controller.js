// Departments controller: database queries for department lookups only.
// Must NOT define routes or implement auth logic.
const db = require("../../config/db");

exports.listDepartments = async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name FROM departments ORDER BY name ASC"
    );
    return res.json({ departments: result.rows });
  } catch (error) {
    console.error("List departments error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

