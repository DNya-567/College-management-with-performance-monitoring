// Shared DB lookup helpers used by multiple controllers.
// Centralizes repeated queries to avoid code duplication.
const db = require("../config/db");

const getTeacherId = async (userId) => {
  const result = await db.query("SELECT id FROM teachers WHERE user_id = $1", [userId]);
  return result.rowCount ? result.rows[0].id : null;
};

const getStudentId = async (userId) => {
  const result = await db.query("SELECT id FROM students WHERE user_id = $1", [userId]);
  return result.rowCount ? result.rows[0].id : null;
};

const getDepartmentId = async (userId) => {
  const result = await db.query(
    "SELECT department_id FROM teachers WHERE user_id = $1",
    [userId]
  );
  return result.rowCount ? result.rows[0].department_id : null;
};

module.exports = { getTeacherId, getStudentId, getDepartmentId };

