// Imports routes: maps HTTP endpoints to controller functions.
// Must NOT include SQL, auth logic, or business logic.
import express from 'express';
import multer from 'multer';
import asyncHandler from '../../utils/asyncHandler.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import requireRole from '../../middlewares/role.middleware.js';
import {
  importStudents,
  importMarks,
  getStudentTemplate,
  getMarksTemplate,
} from './imports.controller.js';

const router = express.Router();

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
  asyncHandler(importStudents)
);

// Teacher: bulk import marks for a class
router.post(
  "/marks/:classId",
  authMiddleware,
  requireRole(["teacher"]),
  upload.single("file"),
  asyncHandler(importMarks)
);

// Templates (any authenticated user can download)
router.get("/templates/students", authMiddleware, asyncHandler(getStudentTemplate));
router.get("/templates/marks", authMiddleware, asyncHandler(getMarksTemplate));

export default router;

