// Imports controller: handles CSV bulk import for students and marks.
// Must NOT define routes or implement auth logic.
// Validates every row individually — invalid rows are skipped, not fatal.
import Papa from "papaparse";
import bcrypt from "bcrypt";
import db from "../../config/db.js";
import { getTeacherId } from "../../utils/lookups.js";
import { getActiveSemester } from "../../utils/getActiveSemester.js";

const DEFAULT_PASSWORD = "changeme123";

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const parseCSVBuffer = (buffer) => {
  const text = buffer.toString("utf-8");
  const { data, errors } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });
  return { rows: data, parseErrors: errors };
};

// ════════════════════════════════════════════════════════
// 1) IMPORT STUDENTS — POST /api/imports/students
//    Admin only. CSV columns: name, email, roll_no, year, department
// ════════════════════════════════════════════════════════

export const importStudents = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "CSV file is required." });
  }

  try {
    const { rows, parseErrors } = parseCSVBuffer(req.file.buffer);

    if (rows.length === 0) {
      return res.status(400).json({ message: "CSV file is empty or has no valid rows." });
    }

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const results = { total: rows.length, created: 0, failed: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-based + header
      const name = (row.name || "").trim();
      const email = (row.email || "").trim().toLowerCase();
      const rollNo = (row.roll_no || "").trim();
      const year = parseInt(row.year, 10);

      // Validate
      if (!name) {
        results.errors.push({ row: rowNum, reason: "Missing name" });
        results.failed++;
        continue;
      }
      if (!isValidEmail(email)) {
        results.errors.push({ row: rowNum, reason: `Invalid email: ${email || "(empty)"}` });
        results.failed++;
        continue;
      }
      if (!rollNo) {
        results.errors.push({ row: rowNum, reason: "Missing roll_no" });
        results.failed++;
        continue;
      }
      if (!year || year < 1 || year > 6) {
        results.errors.push({ row: rowNum, reason: `Invalid year: ${row.year || "(empty)"}` });
        results.failed++;
        continue;
      }

      try {
        await db.query("BEGIN");

        // Create user
        const userRes = await db.query(
          "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'student') RETURNING id",
          [email, passwordHash]
        );
        const userId = userRes.rows[0].id;

        // Create student profile
        await db.query(
          "INSERT INTO students (roll_no, name, year, user_id) VALUES ($1, $2, $3, $4)",
          [rollNo, name, year, userId]
        );

        await db.query("COMMIT");
        results.created++;
      } catch (err) {
        await db.query("ROLLBACK");
        if (err.code === "23505") {
          results.errors.push({ row: rowNum, reason: `Duplicate email: ${email}` });
        } else {
          results.errors.push({ row: rowNum, reason: err.message });
        }
        results.failed++;
      }
    }

    if (parseErrors.length > 0) {
      results.parseWarnings = parseErrors.map((e) => e.message);
    }

    return res.json({
      message: `Import complete: ${results.created} created, ${results.failed} failed.`,
      summary: results,
    });
  } catch (error) {
    console.error("Import students error:", error);
    return res.status(500).json({ message: "Failed to import students." });
  }
};

// ════════════════════════════════════════════════════════
// 2) IMPORT MARKS — POST /api/imports/marks/:classId
//    Teacher only. CSV columns: roll_no, subject, exam_type, score, total_marks
//    Matches students by roll_no in the class. Auto-injects teacher_id and semester_id.
// ════════════════════════════════════════════════════════

export const importMarks = async (req, res) => {
  const { classId } = req.params;
  const teacherUserId = req.user?.userId;

  if (!req.file) {
    return res.status(400).json({ message: "CSV file is required." });
  }
  if (!classId) {
    return res.status(400).json({ message: "Class ID is required." });
  }

  try {
    // Auth: teacher must own the class
    const teacherId = await getTeacherId(teacherUserId);
    if (!teacherId) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }

    const classRes = await db.query(
      "SELECT id, subject_id FROM classes WHERE id = $1 AND teacher_id = $2",
      [classId, teacherId]
    );
    if (classRes.rowCount === 0) {
      return res.status(403).json({ message: "Class not found or not owned by you." });
    }
    const classSubjectId = classRes.rows[0].subject_id;

    // Active semester
    const activeSem = await getActiveSemester();
    const semesterId = activeSem ? activeSem.id : null;

    // Approved students in this class (keyed by roll_no)
    const enrolledRes = await db.query(
      `SELECT s.id, s.roll_no
       FROM class_enrollments ce
       JOIN students s ON s.id = ce.student_id
       WHERE ce.class_id = $1 AND ce.status = 'approved'`,
      [classId]
    );
    const studentMap = {};
    enrolledRes.rows.forEach((s) => {
      studentMap[String(s.roll_no).trim().toLowerCase()] = s.id;
    });

    // All subjects (keyed by lowercase name)
    const subjectsRes = await db.query("SELECT id, name FROM subjects");
    const subjectMap = {};
    subjectsRes.rows.forEach((s) => {
      subjectMap[s.name.trim().toLowerCase()] = s.id;
    });

    // Parse CSV
    const { rows, parseErrors } = parseCSVBuffer(req.file.buffer);

    if (rows.length === 0) {
      return res.status(400).json({ message: "CSV file is empty or has no valid rows." });
    }

    const results = { total: rows.length, created: 0, failed: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      const rollNo = (row.roll_no || "").trim().toLowerCase();
      const subjectName = (row.subject || "").trim().toLowerCase();
      const examType = (row.exam_type || "").trim().toLowerCase();
      const score = parseInt(row.score, 10);
      const totalMarks = parseInt(row.total_marks, 10);

      // Validate roll_no
      const studentId = studentMap[rollNo];
      if (!studentId) {
        results.errors.push({ row: rowNum, reason: `Student not found or not enrolled: ${row.roll_no || "(empty)"}` });
        results.failed++;
        continue;
      }

      // Resolve subject — use CSV value or fall back to class subject
      let subjectId = subjectMap[subjectName];
      if (!subjectId && !subjectName) {
        subjectId = classSubjectId; // default to class subject
      }
      if (!subjectId) {
        results.errors.push({ row: rowNum, reason: `Subject not found: ${row.subject}` });
        results.failed++;
        continue;
      }

      // Validate exam_type
      const validTypes = ["internal", "midterm", "final", "unit_test", "assignment"];
      if (!validTypes.includes(examType)) {
        results.errors.push({ row: rowNum, reason: `Invalid exam_type: ${row.exam_type || "(empty)"}. Use: ${validTypes.join(", ")}` });
        results.failed++;
        continue;
      }

      // Validate score and total
      if (isNaN(score) || score < 0) {
        results.errors.push({ row: rowNum, reason: `Invalid score: ${row.score || "(empty)"}` });
        results.failed++;
        continue;
      }
      if (isNaN(totalMarks) || totalMarks <= 0) {
        results.errors.push({ row: rowNum, reason: `Invalid total_marks: ${row.total_marks || "(empty)"}` });
        results.failed++;
        continue;
      }
      if (score > totalMarks) {
        results.errors.push({ row: rowNum, reason: `Score (${score}) exceeds total_marks (${totalMarks})` });
        results.failed++;
        continue;
      }

      try {
        await db.query(
          `INSERT INTO marks (class_id, student_id, subject_id, teacher_id, score, total_marks, exam_type, year, semester_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [classId, studentId, subjectId, teacherId, score, totalMarks, examType, new Date().getFullYear(), semesterId]
        );
        results.created++;
      } catch (err) {
        if (err.code === "23505") {
          results.errors.push({ row: rowNum, reason: `Duplicate mark for student ${row.roll_no}, exam ${examType}` });
        } else {
          results.errors.push({ row: rowNum, reason: err.message });
        }
        results.failed++;
      }
    }

    if (parseErrors.length > 0) {
      results.parseWarnings = parseErrors.map((e) => e.message);
    }

    return res.json({
      message: `Import complete: ${results.created} created, ${results.failed} failed.`,
      summary: results,
    });
  } catch (error) {
    console.error("Import marks error:", error);
    return res.status(500).json({ message: "Failed to import marks." });
  }
};

// ════════════════════════════════════════════════════════
// 3) DOWNLOAD CSV TEMPLATES
// ════════════════════════════════════════════════════════

export const getStudentTemplate = (_req, res) => {
  const csv = "name,email,roll_no,year\nJohn Doe,john@example.com,CS001,1\nJane Smith,jane@example.com,CS002,2";
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="student_import_template.csv"');
  res.send(csv);
};

export const getMarksTemplate = (_req, res) => {
  const csv = "roll_no,subject,exam_type,score,total_marks\nCS001,Mathematics,internal,42,50\nCS001,Mathematics,midterm,65,100\nCS002,Physics,final,78,100";
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="marks_import_template.csv"');
  res.send(csv);
};

