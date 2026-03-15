// Marks routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const asyncHandler = require("../../utils/asyncHandler");
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
const { validate, createMarkSchema, updateMarkSchema } = require("../../utils/validation");
const { validatePagination } = require("../../utils/pagination");

router.post(
  "/classes/:classId/marks",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(createClassMark)
);
router.get(
  "/classes/:classId/marks",
  authMiddleware,
  requireRole(["teacher", "hod"]),
  asyncHandler(listMarksByClass)
);
router.get(
  "/classes/:classId/my-marks",
  authMiddleware,
  requireRole(["student"]),
  asyncHandler(listMyMarksByClass)
);

router.post(
  "/marks",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(createMark)
);
router.get(
  "/marks",
  authMiddleware,
  requireRole(["admin", "hod", "teacher"]),
  asyncHandler(listMarks)
);
router.get(
  "/marks/me",
  authMiddleware,
  requireRole(["student"]),
  validatePagination,
  asyncHandler(listMyMarks)
);
router.get(
  "/marks/:id",
  authMiddleware,
  requireRole(["admin", "hod", "teacher", "student"]),
  asyncHandler(getMarkById)
);
router.put(
  "/marks/:id",
  authMiddleware,
  requireRole(["teacher"]),
  asyncHandler(updateMark)
);

module.exports = router;
