// Reports controller: generates PDF report cards.
// Must NOT define routes or implement auth logic.
// Streams PDFs directly as HTTP response.
const PDFDocument = require("pdfkit");
const db = require("../../config/db");
const { getStudentId, getTeacherId } = require("../../utils/lookups");
const { getActiveSemester } = require("../../utils/getActiveSemester");

// ── Helpers ──

const drawLine = (doc, y, x1, x2) => {
  doc.moveTo(x1, y).lineTo(x2, y).strokeColor("#cbd5e1").lineWidth(0.5).stroke();
};

const pct = (score, total) => {
  if (!total || total <= 0) return 0;
  return Math.min(Math.round((score / total) * 100), 100);
};

// ── Main controller ──

/**
 * GET /api/reports/student/:studentId/reportcard?semester_id=
 *
 * Authorization:
 *   - student role → can only download their OWN report card
 *   - teacher role → can only download for students in their OWN classes
 *
 * Queries: student info, marks (with subjects), attendance per class,
 *          rank among classmates, semester details.
 *
 * Streams a PDF with Content-Type: application/pdf.
 */
exports.generateReportCard = async (req, res) => {
  const { studentId } = req.params;
  const role = String(req.user?.role || "").toLowerCase();
  const userId = req.user?.userId;
  let semesterId = req.query.semester_id || null;

  if (!studentId) {
    return res.status(400).json({ message: "Student ID is required." });
  }

  try {
    // ── Authorization ──
    if (role === "student") {
      const myStudentId = await getStudentId(userId);
      if (myStudentId !== studentId) {
        return res.status(403).json({ message: "You can only download your own report card." });
      }
    } else if (role === "teacher") {
      const teacherId = await getTeacherId(userId);
      if (!teacherId) {
        return res.status(403).json({ message: "Teacher profile not found." });
      }
      // Check student is enrolled in at least one class owned by this teacher
      const enrollCheck = await db.query(
        `SELECT ce.id FROM class_enrollments ce
         JOIN classes c ON c.id = ce.class_id
         WHERE ce.student_id = $1 AND c.teacher_id = $2 AND ce.status = 'approved'
         LIMIT 1`,
        [studentId, teacherId]
      );
      if (enrollCheck.rowCount === 0) {
        return res.status(403).json({ message: "Student is not in any of your classes." });
      }
    } else {
      return res.status(403).json({ message: "Forbidden." });
    }

    // ── Resolve semester ──
    if (!semesterId) {
      const active = await getActiveSemester();
      semesterId = active ? active.id : null;
    }

    let semesterInfo = null;
    if (semesterId) {
      const semRes = await db.query(
        "SELECT name, academic_year, start_date, end_date FROM semesters WHERE id = $1",
        [semesterId]
      );
      if (semRes.rowCount > 0) semesterInfo = semRes.rows[0];
    }

    // ── Student info ──
    const studentRes = await db.query(
      `SELECT s.id, s.name, s.roll_no, s.year, u.email
       FROM students s JOIN users u ON u.id = s.user_id
       WHERE s.id = $1`,
      [studentId]
    );
    if (studentRes.rowCount === 0) {
      return res.status(404).json({ message: "Student not found." });
    }
    const student = studentRes.rows[0];

    // ── Marks ──
    const marksParams = [studentId];
    let marksSemFilter = "";
    if (semesterId) {
      marksParams.push(semesterId);
      marksSemFilter = ` AND (m.semester_id = $${marksParams.length} OR m.semester_id IS NULL)`;
    }
    const marksRes = await db.query(
      `SELECT m.id, s.name AS subject_name, m.score, m.total_marks, m.exam_type, m.year,
              t.name AS teacher_name, c.name AS class_name
       FROM marks m
       JOIN subjects s ON s.id = m.subject_id
       JOIN teachers t ON t.id = m.teacher_id
       LEFT JOIN classes c ON c.id = m.class_id
       WHERE m.student_id = $1${marksSemFilter}
       ORDER BY s.name ASC, m.exam_type ASC`,
      marksParams
    );
    const marks = marksRes.rows;

    // ── Attendance per class ──
    const attParams = [studentId];
    let attSemFilter = "";
    if (semesterId) {
      attParams.push(semesterId);
      attSemFilter = ` AND (a.semester_id = $${attParams.length} OR a.semester_id IS NULL)`;
    }
    const attRes = await db.query(
      `SELECT c.name AS class_name,
              COUNT(a.id) AS total_sessions,
              SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count
       FROM attendance a
       JOIN classes c ON c.id = a.class_id
       WHERE a.student_id = $1${attSemFilter}
       GROUP BY c.id, c.name
       ORDER BY c.name ASC`,
      attParams
    );
    const attendance = attRes.rows.map((r) => ({
      class_name: r.class_name,
      total: Number(r.total_sessions),
      present: Number(r.present_count),
      pct: pct(Number(r.present_count), Number(r.total_sessions)),
    }));

    // ── Overall rank (among peers who share at least one class) ──
    const rankParams = [studentId];
    let rankSemFilter = "";
    if (semesterId) {
      rankParams.push(semesterId);
      rankSemFilter = ` AND (m.semester_id = $${rankParams.length} OR m.semester_id IS NULL)`;
    }
    const rankRes = await db.query(
      `WITH peer_scores AS (
         SELECT m.student_id,
                ROUND(100.0 * SUM(m.score) / NULLIF(SUM(m.total_marks), 0), 1) AS avg_score
         FROM marks m
         WHERE m.student_id IN (
           SELECT DISTINCT ce2.student_id
           FROM class_enrollments ce1
           JOIN class_enrollments ce2 ON ce2.class_id = ce1.class_id AND ce2.status = 'approved'
           WHERE ce1.student_id = $1 AND ce1.status = 'approved'
         )${rankSemFilter}
         GROUP BY m.student_id
       )
       SELECT
         (SELECT COUNT(*) FROM peer_scores WHERE avg_score >
           (SELECT avg_score FROM peer_scores WHERE student_id = $1)) + 1 AS rank,
         (SELECT COUNT(*) FROM peer_scores) AS total_students`,
      rankParams
    );
    const rank = Number(rankRes.rows[0]?.rank ?? 0);
    const totalStudents = Number(rankRes.rows[0]?.total_students ?? 0);

    // ── Overall averages ──
    const totalScore = marks.reduce((sum, m) => sum + Number(m.score || 0), 0);
    const totalMax = marks.reduce((sum, m) => sum + Number(m.total_marks || 0), 0);
    const overallPct = pct(totalScore, totalMax);
    const overallAttPct = attendance.length > 0
      ? Math.round(attendance.reduce((s, a) => s + a.pct, 0) / attendance.length)
      : 0;

    // ── Pass / Fail ──
    const failedByMarks = marks.some((m) => pct(m.score, m.total_marks) < 20);
    const failedByAttendance = attendance.some((a) => a.pct < 30);
    const hasFailed = failedByMarks || failedByAttendance;

    // ════════════════════════════════════════════════════════
    // PDF GENERATION
    // ════════════════════════════════════════════════════════

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Set response headers
    const filename = `ReportCard_${student.roll_no}_${(semesterInfo?.name || "all").replace(/\s+/g, "_")}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    doc.pipe(res);

    const pageW = doc.page.width;
    const marginL = 50;
    const marginR = pageW - 50;
    const contentW = marginR - marginL;
    let y = 50;

    // ── College Header ──
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#0f172a")
      .text("College Management System", marginL, y, { align: "center", width: contentW });
    y += 28;
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#0052FF")
      .text("Student Report Card", marginL, y, { align: "center", width: contentW });
    y += 24;
    drawLine(doc, y, marginL, marginR);
    y += 16;

    // ── Student Info ──
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#334155").text("Student Information", marginL, y);
    y += 16;

    const infoCol1 = marginL;
    const infoCol2 = marginL + contentW / 2;

    doc.fontSize(9).font("Helvetica").fillColor("#64748b");
    doc.text("Name:", infoCol1, y); doc.font("Helvetica-Bold").fillColor("#0f172a").text(student.name, infoCol1 + 60, y);
    doc.font("Helvetica").fillColor("#64748b").text("Roll No:", infoCol2, y); doc.font("Helvetica-Bold").fillColor("#0f172a").text(student.roll_no, infoCol2 + 60, y);
    y += 16;
    doc.font("Helvetica").fillColor("#64748b").text("Year:", infoCol1, y); doc.font("Helvetica-Bold").fillColor("#0f172a").text(String(student.year), infoCol1 + 60, y);
    doc.font("Helvetica").fillColor("#64748b").text("Email:", infoCol2, y); doc.font("Helvetica-Bold").fillColor("#0f172a").text(student.email, infoCol2 + 60, y);
    y += 16;

    if (semesterInfo) {
      doc.font("Helvetica").fillColor("#64748b").text("Semester:", infoCol1, y);
      doc.font("Helvetica-Bold").fillColor("#0f172a").text(`${semesterInfo.name} (${semesterInfo.academic_year})`, infoCol1 + 60, y);
    }
    y += 20;
    drawLine(doc, y, marginL, marginR);
    y += 16;

    // ── Marks Table ──
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#334155").text("Academic Performance", marginL, y);
    y += 18;

    if (marks.length === 0) {
      doc.fontSize(9).font("Helvetica").fillColor("#94a3b8").text("No marks recorded.", marginL, y);
      y += 16;
    } else {
      // Table header
      const cols = [marginL, marginL + 150, marginL + 230, marginL + 290, marginL + 350, marginL + 410];
      const colLabels = ["Subject", "Exam Type", "Score", "Total", "Percentage", "Status"];
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#64748b");
      colLabels.forEach((label, i) => doc.text(label, cols[i], y));
      y += 14;
      drawLine(doc, y, marginL, marginR);
      y += 6;

      doc.font("Helvetica").fontSize(8);
      marks.forEach((m) => {
        if (y > 740) {
          doc.addPage();
          y = 50;
        }
        const markPct = pct(m.score, m.total_marks);
        const isFail = markPct < 20;

        doc.fillColor("#0f172a").text(m.subject_name, cols[0], y, { width: 145 });
        doc.text(m.exam_type, cols[1], y);
        doc.text(String(m.score), cols[2], y);
        doc.text(String(m.total_marks), cols[3], y);
        doc.text(`${markPct}%`, cols[4], y);
        doc.fillColor(isFail ? "#dc2626" : "#16a34a").text(isFail ? "FAIL" : "PASS", cols[5], y);
        y += 14;
      });

      y += 4;
      drawLine(doc, y, marginL, marginR);
      y += 12;

      // Overall average row
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155")
        .text(`Overall Average: ${overallPct}%`, marginL, y);
      doc.text(`Rank: ${rank} / ${totalStudents}`, marginL + 200, y);
      y += 20;
    }

    // ── Attendance Summary ──
    if (y > 680) { doc.addPage(); y = 50; }
    drawLine(doc, y, marginL, marginR);
    y += 12;

    doc.fontSize(10).font("Helvetica-Bold").fillColor("#334155").text("Attendance Summary", marginL, y);
    y += 18;

    if (attendance.length === 0) {
      doc.fontSize(9).font("Helvetica").fillColor("#94a3b8").text("No attendance records.", marginL, y);
      y += 16;
    } else {
      const aCols = [marginL, marginL + 180, marginL + 270, marginL + 350, marginL + 420];
      const aLabels = ["Class", "Present", "Total", "Percentage", "Status"];
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#64748b");
      aLabels.forEach((label, i) => doc.text(label, aCols[i], y));
      y += 14;
      drawLine(doc, y, marginL, marginR);
      y += 6;

      doc.font("Helvetica").fontSize(8);
      attendance.forEach((a) => {
        if (y > 740) { doc.addPage(); y = 50; }
        const isFail = a.pct < 30;
        doc.fillColor("#0f172a").text(a.class_name, aCols[0], y, { width: 175 });
        doc.text(String(a.present), aCols[1], y);
        doc.text(String(a.total), aCols[2], y);
        doc.text(`${a.pct}%`, aCols[3], y);
        doc.fillColor(isFail ? "#dc2626" : "#16a34a").text(isFail ? "FAIL" : "PASS", aCols[4], y);
        y += 14;
      });

      y += 4;
      drawLine(doc, y, marginL, marginR);
      y += 12;

      doc.fontSize(9).font("Helvetica-Bold").fillColor("#334155")
        .text(`Overall Attendance: ${overallAttPct}%`, marginL, y);
      y += 24;
    }

    // ── Final Result ──
    if (y > 700) { doc.addPage(); y = 50; }
    drawLine(doc, y, marginL, marginR);
    y += 16;

    const resultColor = hasFailed ? "#dc2626" : "#16a34a";
    const resultText = hasFailed ? "FAIL" : "PASS";
    const resultNote = hasFailed
      ? "Student has failed due to " +
        [failedByMarks && "marks below 20%", failedByAttendance && "attendance below 30%"].filter(Boolean).join(" and ") + "."
      : "Student has passed all subjects and meets attendance requirements.";

    doc.fontSize(14).font("Helvetica-Bold").fillColor(resultColor)
      .text(`Overall Result: ${resultText}`, marginL, y, { align: "center", width: contentW });
    y += 20;
    doc.fontSize(9).font("Helvetica").fillColor("#64748b")
      .text(resultNote, marginL, y, { align: "center", width: contentW });
    y += 30;

    // ── Footer ──
    drawLine(doc, y, marginL, marginR);
    y += 10;
    doc.fontSize(7).font("Helvetica").fillColor("#94a3b8")
      .text(`Generated on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} — College Management System`, marginL, y, { align: "center", width: contentW });

    doc.end();
  } catch (error) {
    console.error("Generate report card error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Failed to generate report card." });
    }
  }
};

