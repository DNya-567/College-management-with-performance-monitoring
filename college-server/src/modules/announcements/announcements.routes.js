// Announcements routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const {
  createAnnouncement,
  listAnnouncements,
} = require("./announcements.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

router.get(
  "/",
  authMiddleware,
  requireRole(["student", "teacher", "admin", "hod"]),
  listAnnouncements
);
router.post(
  "/",
  authMiddleware,
  requireRole(["teacher"]),
  createAnnouncement
);

module.exports = router;

