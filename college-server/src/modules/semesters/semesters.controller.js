// Semesters controller: CRUD + set-active for academic semesters.
// Must NOT define routes or implement auth logic.
const db = require("../../config/db");
const { bustSemesterCache } = require("../../utils/getActiveSemester");

/**
 * GET /api/semesters
 * Lists all semesters ordered by start_date DESC.
 */
exports.listSemesters = async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, academic_year, start_date, end_date, is_active, created_at FROM semesters ORDER BY start_date DESC"
    );
    return res.json({ semesters: result.rows });
  } catch (error) {
    console.error("List semesters error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/semesters/active
 * Returns only the currently active semester.
 */
exports.getActiveSemester = async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, academic_year, start_date, end_date, is_active FROM semesters WHERE is_active = true LIMIT 1"
    );
    return res.json({ semester: result.rows[0] || null });
  } catch (error) {
    console.error("Get active semester error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * POST /api/semesters
 * Creates a new semester. Admin only.
 */
exports.createSemester = async (req, res) => {
  const { name, academic_year, start_date, end_date } = req.body;

  if (!name || !academic_year || !start_date || !end_date) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (new Date(start_date) >= new Date(end_date)) {
    return res.status(400).json({ message: "Start date must be before end date." });
  }

  try {
    const result = await db.query(
      `INSERT INTO semesters (name, academic_year, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id, name, academic_year, start_date, end_date, is_active`,
      [name.trim(), academic_year.trim(), start_date, end_date]
    );
    return res.status(201).json({ semester: result.rows[0] });
  } catch (error) {
    console.error("Create semester error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PUT /api/semesters/:id
 * Updates a semester. Admin only.
 */
exports.updateSemester = async (req, res) => {
  const { id } = req.params;
  const { name, academic_year, start_date, end_date } = req.body;

  if (!name || !academic_year || !start_date || !end_date) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const result = await db.query(
      `UPDATE semesters SET name = $1, academic_year = $2, start_date = $3, end_date = $4
       WHERE id = $5
       RETURNING id, name, academic_year, start_date, end_date, is_active`,
      [name.trim(), academic_year.trim(), start_date, end_date, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Semester not found." });
    }

    bustSemesterCache();
    return res.json({ semester: result.rows[0] });
  } catch (error) {
    console.error("Update semester error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * DELETE /api/semesters/:id
 * Deletes a semester. Cannot delete the active one.
 */
exports.deleteSemester = async (req, res) => {
  const { id } = req.params;

  try {
    const check = await db.query("SELECT is_active FROM semesters WHERE id = $1", [id]);
    if (check.rowCount === 0) {
      return res.status(404).json({ message: "Semester not found." });
    }
    if (check.rows[0].is_active) {
      return res.status(409).json({ message: "Cannot delete the active semester. Set another as active first." });
    }

    await db.query("DELETE FROM semesters WHERE id = $1", [id]);
    return res.json({ message: "Semester deleted." });
  } catch (error) {
    console.error("Delete semester error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PUT /api/semesters/:id/activate
 * Sets this semester as active, deactivates all others (transaction).
 */
exports.setActiveSemester = async (req, res) => {
  const { id } = req.params;

  try {
    const check = await db.query("SELECT id FROM semesters WHERE id = $1", [id]);
    if (check.rowCount === 0) {
      return res.status(404).json({ message: "Semester not found." });
    }

    await db.query("BEGIN");
    await db.query("UPDATE semesters SET is_active = false WHERE is_active = true");
    await db.query("UPDATE semesters SET is_active = true WHERE id = $1", [id]);
    await db.query("COMMIT");

    bustSemesterCache();

    return res.json({ message: "Semester activated." });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Set active semester error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

