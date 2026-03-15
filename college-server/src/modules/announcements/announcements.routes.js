// Announcements routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
//
// Mounted at /api/announcements for the listing route.
// Class-scoped routes are mounted separately at /api/classes in app.js.
const router = require("express").Router();
const classRouter = require("express").Router({ mergeParams: true });
const asyncHandler = require("../../utils/asyncHandler");
const logger = require("../../config/logger");
const {
  createAnnouncement,
  listClassAnnouncements,
  listMyAnnouncements,
} = require("./announcements.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");
const { validate, createAnnouncementSchema } = require("../../utils/validation");
const { validatePagination } = require("../../utils/pagination");

// GET /api/announcements — all announcements relevant to the current user
router.get(
  "/",
  authMiddleware,
  requireRole(["student", "teacher", "admin", "hod"]),
  validatePagination,
  asyncHandler(listMyAnnouncements)
);

// Debug middleware to log announcement POST requests
const debugAnnouncement = (req, res, next) => {
  logger.info('🔍 ANNOUNCEMENT POST REQUEST RECEIVED', {
    url: req.originalUrl,
    path: req.path,
    params: req.params,
    bodyKeys: Object.keys(req.body || {}),
    body: JSON.stringify(req.body),
    contentType: req.get('content-type'),
    userId: req.user?.userId
  });
  next();
};

// POST /api/classes/:classId/announcements — teacher creates for their class
classRouter.post(
  "/:classId/announcements",
  debugAnnouncement,
  authMiddleware,
  requireRole(["teacher", "hod"]),
  asyncHandler(createAnnouncement)
);

// GET /api/classes/:classId/announcements — list announcements for a class
classRouter.get(
  "/:classId/announcements",
  authMiddleware,
  requireRole(["student", "teacher", "admin", "hod"]),
  asyncHandler(listClassAnnouncements)
);

module.exports = router;
module.exports.classRouter = classRouter;

