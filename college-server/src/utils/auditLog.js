// Audit log helper — fire-and-forget insert into audit_logs.
// Used by admin controllers to track actions.
// Must NOT throw or block the calling function.
import db from "../config/db.js";

/**
 * @param {string} adminId - UUID of the admin performing the action
 * @param {string} action  - e.g. "reset_password", "delete_user", "toggle_status"
 * @param {string} targetType - e.g. "user", "teacher", "student"
 * @param {string} targetId - UUID of the target entity
 * @param {object} details - any extra context (JSON)
 */
export const logAudit = (adminId, action, targetType, targetId, details = {}) => {
  db.query(
    `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [adminId, action, targetType, targetId, JSON.stringify(details)]
  ).catch((err) => {
    console.error("Audit log write failed:", err.message);
  });
};


