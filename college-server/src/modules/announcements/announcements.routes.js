// Announcements routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
//
// Mounted at /api/announcements for the listing route.
// Class-scoped routes are mounted separately at /api/classes in app.js.
import express from 'express';
import asyncHandler from '../../utils/asyncHandler.js';
import logger from '../../config/logger.js';
import {
  createAnnouncement,
  listClassAnnouncements,
  listMyAnnouncements,
} from './announcements.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';
import { validate, createAnnouncementSchema } from '../../utils/validation.js';
import { validatePagination } from '../../utils/pagination.js';

const router = express.Router();
const classRouter = express.Router({ mergeParams: true });

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

export default router;
export { classRouter };

