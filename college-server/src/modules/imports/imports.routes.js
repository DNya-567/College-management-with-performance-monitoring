// Imports routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
const router = require("express").Router();
const multer = require("multer");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");
const {
  importStudents,
  importMarks,
  getStudentTemplate,
  getMarksTemplate,
} = require("./imports.controller");

// Multer: store files in memory (CSV files are small)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed."), false);
    }
  },
});

// Admin: bulk import students
router.post(
  "/students",
  authMiddleware,
  requireRole(["admin"]),
  upload.single("file"),
  importStudents
);

// Teacher: bulk import marks for a class
router.post(
  "/marks/:classId",
  authMiddleware,
  requireRole(["teacher"]),
  upload.single("file"),
  importMarks
);

// Templates (any authenticated user can download)
router.get("/templates/students", authMiddleware, getStudentTemplate);
router.get("/templates/marks", authMiddleware, getMarksTemplate);

module.exports = router;

