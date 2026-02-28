// Announcements routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
//
// Mounted at /api/announcements for the listing route.
// Class-scoped routes are mounted separately at /api/classes in app.js.
const router = require("express").Router();
const classRouter = require("express").Router({ mergeParams: true });
const {
  createAnnouncement,
  listClassAnnouncements,
  listMyAnnouncements,
} = require("./announcements.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

// GET /api/announcements — all announcements relevant to the current user
router.get(
  "/",
  authMiddleware,
  requireRole(["student", "teacher", "admin", "hod"]),
  listMyAnnouncements
);

// POST /api/classes/:classId/announcements — teacher creates for their class
classRouter.post(
  "/:classId/announcements",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  createAnnouncement
);

// GET /api/classes/:classId/announcements — list announcements for a class
classRouter.get(
  "/:classId/announcements",
  authMiddleware,
  requireRole(["student", "teacher", "admin", "hod"]),
  listClassAnnouncements
);

module.exports = router;
module.exports.classRouter = classRouter;

