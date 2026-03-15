// Semesters routes: maps HTTP endpoints to controller functions.
// GET /active is public to authenticated users; write ops are admin-only.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const asyncHandler = require("../../utils/asyncHandler");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");
const { validate, createSemesterSchema } = require("../../utils/validation");
const {
  listSemesters,
  getActiveSemester,
  createSemester,
  updateSemester,
  deleteSemester,
  setActiveSemester,
} = require("./semesters.controller");

// All routes require auth
router.use(authMiddleware);

// Any authenticated user can read semesters
router.get("/", asyncHandler(listSemesters));
router.get("/active", asyncHandler(getActiveSemester));

// Admin-only write operations
router.post("/", requireRole(["admin"]), asyncHandler(createSemester));
router.put("/:id", requireRole(["admin"]), asyncHandler(updateSemester));
router.delete("/:id", requireRole(["admin"]), asyncHandler(deleteSemester));
router.put("/:id/activate", requireRole(["admin"]), asyncHandler(setActiveSemester));

module.exports = router;

