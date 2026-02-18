// Marks routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const {
  createMark,
  listMarks,
  getMarkById,
  listMyMarks,
  createClassMark,
  listMarksByClass,
  listMyMarksByClass,
  updateMark,
} = require("./marks.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

router.post(
  "/classes/:classId/marks",
  authMiddleware,
  requireRole(["teacher"]),
  createClassMark
);
router.get(
  "/classes/:classId/marks",
  authMiddleware,
  requireRole(["teacher"]),
  listMarksByClass
);
router.get(
  "/classes/:classId/my-marks",
  authMiddleware,
  requireRole(["student"]),
  listMyMarksByClass
);

router.post(
  "/marks",
  authMiddleware,
  requireRole(["teacher"]),
  createMark
);
router.get(
  "/marks",
  authMiddleware,
  requireRole(["admin", "hod", "teacher"]),
  listMarks
);
router.get(
  "/marks/me",
  authMiddleware,
  requireRole(["student"]),
  listMyMarks
);
router.get(
  "/marks/:id",
  authMiddleware,
  requireRole(["admin", "hod", "teacher", "student"]),
  getMarkById
);
router.put(
  "/marks/:id",
  authMiddleware,
  requireRole(["teacher"]),
  updateMark
);

module.exports = router;
