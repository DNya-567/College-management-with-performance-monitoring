// Teachers controller: database queries for teacher profiles only.
// Must NOT define routes or implement auth logic.
const db = require("../../config/db");

exports.getMyProfile = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const result = await db.query(
      "SELECT t.id, t.name, t.department_id, u.email " +
        "FROM teachers t JOIN users u ON u.id = t.user_id " +
        "WHERE t.user_id = $1",
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Teacher profile not found." });
    }

    return res.json({ teacher: result.rows[0] });
  } catch (error) {
    console.error("Teacher profile error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

