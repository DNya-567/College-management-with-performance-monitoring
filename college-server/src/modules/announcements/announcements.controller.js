// Announcements controller: database logic for announcements only.
// Must NOT define routes or implement auth logic
const db = require("../../config/db");

const getTeacherId = async (userId) => {
  const result = await db.query("SELECT id FROM teachers WHERE user_id = $1", [
    userId,
  ]);
  return result.rowCount ? result.rows[0].id : null;
};

exports.createAnnouncement = async (req, res) => {
  const { title, body } = req.body;
  const teacherUserId = req.user?.userId;

  if (!title || !body) {
    return res.status(400).json({ message: "Title and body are required." });
  }

  if (!teacherUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const teacherId = await getTeacherId(teacherUserId);
    if (!teacherId) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }

    const result = await db.query(
      "INSERT INTO announcements (teacher_id, title, body) VALUES ($1, $2, $3) RETURNING id, teacher_id, title, body, created_at",
      [teacherId, title, body]
    );

    return res.status(201).json({ announcement: result.rows[0] });
  } catch (error) {
    console.error("Create announcement error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.listAnnouncements = async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT a.id, a.title, a.body, a.created_at, t.name AS teacher_name " +
        "FROM announcements a " +
        "JOIN teachers t ON t.id = a.teacher_id " +
        "ORDER BY a.created_at DESC"
    );

    return res.json({ announcements: result.rows });
  } catch (error) {
    console.error("List announcements error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
