// Utility: returns the currently active semester's ID from the database.
// Used by controllers to auto-inject semester_id into inserts.
// Returns null if no active semester is set.
import db from '../config/db.js';

let cached = null;
let cachedAt = 0;
const TTL = 30_000; // 30s cache to reduce DB hits

export const getActiveSemester = async () => {
  const now = Date.now();
  if (cached && now - cachedAt < TTL) return cached;

  const result = await db.query(
    "SELECT id, name, academic_year FROM semesters WHERE is_active = true LIMIT 1"
  );

  cached = result.rowCount > 0 ? result.rows[0] : null;
  cachedAt = now;
  return cached;
};

// Call after admin changes the active semester to bust cache immediately
export const bustSemesterCache = () => {
  cached = null;
  cachedAt = 0;
};


