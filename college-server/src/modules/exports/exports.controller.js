// Exports controller: generates Excel files for marks, attendance, and department performance.
// Must NOT define routes or implement auth logic.
// Streams .xlsx directly as HTTP response using exceljs.
const ExcelJS = require("exceljs");
const db = require("../../config/db");
const { getTeacherId, getDepartmentId } = require("../../utils/lookups");
const { getActiveSemester } = require("../../utils/getActiveSemester");

// ── Shared helpers ──

const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const pct = (score, total) => {
  if (!total || total <= 0) return 0;
  return Math.min(Math.round((score / total) * 100), 100);
};

const resolveSemester = async (queryParam) => {
  if (queryParam) return queryParam;
  const active = await getActiveSemester();
  return active ? active.id : null;
};

const semFilterSQL = (semesterId, alias, params) => {
  if (!semesterId) return "";
  params.push(semesterId);
  return ` AND (${alias}.semester_id = $${params.length} OR ${alias}.semester_id IS NULL)`;
};

const styleHeaderRow = (sheet) => {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0052FF" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 24;
  sheet.columns.forEach((col) => {
    col.alignment = { vertical: "middle" };
  });
};

// ════════════════════════════════════════════════════════
// 1) EXPORT MARKS — GET /api/exports/marks/:classId
// ════════════════════════════════════════════════════════

exports.exportClassMarks = async (req, res) => {
  const { classId } = req.params;
  const teacherUserId = req.user?.userId;

  if (!classId || !teacherUserId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    // Auth: teacher must own the class
    const teacherId = await getTeacherId(teacherUserId);
    if (!teacherId) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }
    const classRes = await db.query(
      "SELECT id, name FROM classes WHERE id = $1 AND teacher_id = $2",
      [classId, teacherId]
    );
    if (classRes.rowCount === 0) {
      return res.status(403).json({ message: "Class not found for teacher." });
    }
    const className = classRes.rows[0].name;

    // Resolve semester
    const semesterId = await resolveSemester(req.query.semester_id);

    // Query marks
    const params = [classId];
    const semFilter = semFilterSQL(semesterId, "m", params);

    const result = await db.query(
      `SELECT s.roll_no, s.name AS student_name, sub.name AS subject_name,
              m.exam_type, m.score, m.total_marks
       FROM marks m
       JOIN students s ON s.id = m.student_id
       JOIN subjects sub ON sub.id = m.subject_id
       WHERE m.class_id = $1${semFilter}
       ORDER BY s.roll_no ASC, sub.name ASC, m.exam_type ASC`,
      params
    );

    // Build Excel
    const wb = new ExcelJS.Workbook();
    wb.creator = "College Management System";
    wb.created = new Date();

    const ws = wb.addWorksheet("Marks");
    ws.columns = [
      { header: "Roll No", key: "roll_no", width: 14 },
      { header: "Student Name", key: "student_name", width: 24 },
      { header: "Subject", key: "subject_name", width: 22 },
      { header: "Exam Type", key: "exam_type", width: 14 },
      { header: "Score", key: "score", width: 10 },
      { header: "Total Marks", key: "total_marks", width: 14 },
      { header: "Percentage", key: "percentage", width: 14 },
    ];
    styleHeaderRow(ws);

    result.rows.forEach((row) => {
      ws.addRow({
        roll_no: row.roll_no,
        student_name: row.student_name,
        subject_name: row.subject_name,
        exam_type: row.exam_type,
        score: Number(row.score),
        total_marks: Number(row.total_marks),
        percentage: `${pct(row.score, row.total_marks)}%`,
      });
    });

    // Alternate row shading
    ws.eachRow((row, idx) => {
      if (idx > 1 && idx % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FB" } };
        });
      }
    });

    // Stream response
    const filename = `Marks_${className.replace(/\s+/g, "_")}.xlsx`;
    res.setHeader("Content-Type", XLSX_CONTENT_TYPE);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export marks error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Failed to export marks." });
    }
  }
};

// ════════════════════════════════════════════════════════
// 2) EXPORT ATTENDANCE — GET /api/exports/attendance/:classId
// ════════════════════════════════════════════════════════

exports.exportClassAttendance = async (req, res) => {
  const { classId } = req.params;
  const teacherUserId = req.user?.userId;

  if (!classId || !teacherUserId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const teacherId = await getTeacherId(teacherUserId);
    if (!teacherId) {
      return res.status(403).json({ message: "Teacher profile not found." });
    }
    const classRes = await db.query(
      "SELECT id, name FROM classes WHERE id = $1 AND teacher_id = $2",
      [classId, teacherId]
    );
    if (classRes.rowCount === 0) {
      return res.status(403).json({ message: "Class not found for teacher." });
    }
    const className = classRes.rows[0].name;

    const semesterId = await resolveSemester(req.query.semester_id);

    const params = [classId];
    const semFilter = semFilterSQL(semesterId, "a", params);

    const result = await db.query(
      `SELECT s.roll_no, s.name AS student_name, a.date, a.status
       FROM attendance a
       JOIN students s ON s.id = a.student_id
       WHERE a.class_id = $1${semFilter}
       ORDER BY a.date DESC, s.roll_no ASC`,
      params
    );

    const wb = new ExcelJS.Workbook();
    wb.creator = "College Management System";
    wb.created = new Date();

    const ws = wb.addWorksheet("Attendance");
    ws.columns = [
      { header: "Roll No", key: "roll_no", width: 14 },
      { header: "Student Name", key: "student_name", width: 24 },
      { header: "Date", key: "date", width: 14 },
      { header: "Status", key: "status", width: 12 },
    ];
    styleHeaderRow(ws);

    result.rows.forEach((row) => {
      const r = ws.addRow({
        roll_no: row.roll_no,
        student_name: row.student_name,
        date: new Date(row.date).toLocaleDateString("en-IN"),
        status: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      });
      // Color-code status cell
      const statusCell = r.getCell("status");
      if (row.status === "present") {
        statusCell.font = { color: { argb: "FF16A34A" }, bold: true };
      } else {
        statusCell.font = { color: { argb: "FFDC2626" }, bold: true };
      }
    });

    ws.eachRow((row, idx) => {
      if (idx > 1 && idx % 2 === 0) {
        row.eachCell((cell) => {
          if (!cell.font?.color) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FB" } };
          }
        });
      }
    });

    const filename = `Attendance_${className.replace(/\s+/g, "_")}.xlsx`;
    res.setHeader("Content-Type", XLSX_CONTENT_TYPE);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export attendance error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Failed to export attendance." });
    }
  }
};

// ════════════════════════════════════════════════════════
// 3) EXPORT DEPARTMENT — GET /api/exports/department/:deptId
//    HOD only: department-wide performance summary
// ════════════════════════════════════════════════════════

exports.exportDepartmentPerformance = async (req, res) => {
  const { deptId } = req.params;
  const userId = req.user?.userId;

  if (!deptId || !userId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    // Auth: HOD must belong to this department
    const departmentId = await getDepartmentId(userId);
    if (!departmentId || departmentId !== deptId) {
      return res.status(403).json({ message: "Not authorized for this department." });
    }

    // Get department name
    const deptRes = await db.query("SELECT name FROM departments WHERE id = $1", [deptId]);
    const deptName = deptRes.rowCount > 0 ? deptRes.rows[0].name : "Department";

    const semesterId = await resolveSemester(req.query.semester_id);

    // Query: per-student performance across all classes in this department
    const params = [deptId];
    let semMarksFilter = "";
    let semAttFilter = "";
    if (semesterId) {
      params.push(semesterId);
      const idx = params.length;
      semMarksFilter = ` AND (m.semester_id = $${idx} OR m.semester_id IS NULL)`;
      semAttFilter = ` AND (att.semester_id = $${idx} OR att.semester_id IS NULL)`;
    }

    const result = await db.query(
      `SELECT
         c.name AS class_name,
         sub.name AS subject_name,
         s.roll_no,
         s.name AS student_name,
         COALESCE(ROUND(100.0 * SUM(m.score) / NULLIF(SUM(m.total_marks), 0), 1), 0) AS avg_score,
         COALESCE(att_summary.attendance_pct, 0) AS attendance_pct
       FROM class_enrollments ce
       JOIN classes c ON c.id = ce.class_id
       JOIN teachers t ON t.id = c.teacher_id
       JOIN subjects sub ON sub.id = c.subject_id
       JOIN students s ON s.id = ce.student_id
       LEFT JOIN marks m ON m.student_id = s.id AND m.class_id = c.id${semMarksFilter}
       LEFT JOIN LATERAL (
         SELECT ROUND(100.0 * SUM(CASE WHEN att.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) AS attendance_pct
         FROM attendance att
         WHERE att.class_id = c.id AND att.student_id = s.id${semAttFilter}
       ) att_summary ON true
       WHERE t.department_id = $1 AND ce.status = 'approved'
       GROUP BY c.name, sub.name, s.roll_no, s.name, att_summary.attendance_pct
       ORDER BY c.name ASC, s.roll_no ASC`,
      params
    );

    const wb = new ExcelJS.Workbook();
    wb.creator = "College Management System";
    wb.created = new Date();

    const ws = wb.addWorksheet("Department Performance");
    ws.columns = [
      { header: "Class", key: "class_name", width: 22 },
      { header: "Subject", key: "subject_name", width: 20 },
      { header: "Roll No", key: "roll_no", width: 14 },
      { header: "Student Name", key: "student_name", width: 24 },
      { header: "Avg Score %", key: "avg_score", width: 14 },
      { header: "Attendance %", key: "attendance_pct", width: 14 },
      { header: "Status", key: "status", width: 12 },
    ];
    styleHeaderRow(ws);

    result.rows.forEach((row) => {
      const avgScore = Math.min(Number(row.avg_score), 100);
      const attPct = Math.min(Number(row.attendance_pct), 100);
      const hasFailed = avgScore < 20 || attPct < 30;

      const r = ws.addRow({
        class_name: row.class_name,
        subject_name: row.subject_name,
        roll_no: row.roll_no,
        student_name: row.student_name,
        avg_score: `${avgScore}%`,
        attendance_pct: `${attPct}%`,
        status: hasFailed ? "FAIL" : "PASS",
      });

      const statusCell = r.getCell("status");
      statusCell.font = { bold: true, color: { argb: hasFailed ? "FFDC2626" : "FF16A34A" } };
    });

    ws.eachRow((row, idx) => {
      if (idx > 1 && idx % 2 === 0) {
        row.eachCell((cell) => {
          if (!cell.font?.color) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FB" } };
          }
        });
      }
    });

    const filename = `Department_${deptName.replace(/\s+/g, "_")}_Performance.xlsx`;
    res.setHeader("Content-Type", XLSX_CONTENT_TYPE);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export department performance error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Failed to export department performance." });
    }
  }
};

