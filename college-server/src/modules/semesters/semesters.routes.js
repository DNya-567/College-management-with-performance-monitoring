// Semesters routes: maps HTTP endpoints to controller functions.
// GET /active is public to authenticated users; write ops are admin-only.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");
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
router.get("/", listSemesters);
router.get("/active", getActiveSemester);

// Admin-only write operations
router.post("/", requireRole(["admin"]), createSemester);
router.put("/:id", requireRole(["admin"]), updateSemester);
router.delete("/:id", requireRole(["admin"]), deleteSemester);
router.put("/:id/activate", requireRole(["admin"]), setActiveSemester);

module.exports = router;

