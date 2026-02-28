// UI-only page for teachers to submit marks.
// Must NOT perform API setup or auth logic.
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { http } from "../../api/http";
import { useTeacherClasses } from "../../hooks/useTeacherClasses";
import { usePageAnimation } from "../../hooks/usePageAnimation";

export default function TeacherMarks() {
  const { scopeRef } = usePageAnimation();
  const [form, setForm] = useState({
    class_id: "",
    subject_id: "",
    exam_type: "internal",
    year: new Date().getFullYear(),
  });
  const { classes } = useTeacherClasses();
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [totals, setTotals] = useState({});
  const [classMarks, setClassMarks] = useState([]);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [optionsError, setOptionsError] = useState("");
  const [status, setStatus] = useState("");

  const currentMarksByStudent = useMemo(() => {
    const filtered = classMarks.filter(
      (mark) =>
        mark.exam_type === form.exam_type &&
        Number(mark.year) === Number(form.year)
    );
    const map = {};
    filtered.forEach((mark) => {
      map[mark.student_id] = mark;
    });
    return map;
  }, [classMarks, form.exam_type, form.year]);

  const existingScores = useMemo(() => {
    const map = {};
    Object.values(currentMarksByStudent).forEach((mark) => {
      map[mark.student_id] = mark.score;
    });
    return map;
  }, [currentMarksByStudent]);

  const existingTotals = useMemo(() => {
    const map = {};
    Object.values(currentMarksByStudent).forEach((mark) => {
      map[mark.student_id] = mark.total_marks;
    });
    return map;
  }, [currentMarksByStudent]);


  const handleClassChange = async (event) => {
    const classId = event.target.value;
    setForm((prev) => ({
      ...prev,
      class_id: classId,
      subject_id: classes.find((item) => item.id === classId)?.subject_id || "",
    }));
    setStudents([]);
    setScores({});
    setTotals({});
    setClassMarks([]);
    setEditingStudentId(null);
    setOptionsError("");

    if (!classId) return;

    try {
      const [studentsRes, marksRes] = await Promise.all([
        http.get(`/classes/${classId}/students`),
        http.get(`/classes/${classId}/marks`),
      ]);
      const nextStudents = studentsRes.data?.students || [];
      const nextMarks = marksRes.data?.marks || [];
      setStudents(nextStudents);
      setClassMarks(nextMarks);
    } catch (err) {
      setOptionsError(
        err.response?.data?.message || "Failed to load approved students."
      );
    }
  };

  const handleExamTypeChange = (event) => {
    setForm((prev) => ({ ...prev, exam_type: event.target.value }));
    setScores({});
    setTotals({});
    setEditingStudentId(null);
  };

  const handleYearChange = (event) => {
    setForm((prev) => ({ ...prev, year: event.target.value }));
    setScores({});
    setTotals({});
    setEditingStudentId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus("Saving...");
    setOptionsError("");

    if (!form.class_id) {
      setStatus("");
      setOptionsError("Select a class first.");
      return;
    }

    const rowsToSubmit = sortedStudents
      .filter((student) => !currentMarksByStudent[student.id])
      .map((student) => ({
        student_id: student.id,
        score: scores[student.id],
        total_marks: totals[student.id],
      }))
      .filter(
        (row) =>
          row.score !== undefined &&
          row.score !== "" &&
          row.total_marks !== undefined &&
          row.total_marks !== ""
      );

    if (rowsToSubmit.length === 0) {
      setStatus("");
      setOptionsError("Enter marks for at least one student.");
      return;
    }

    // Validate score does not exceed total marks
    const invalidRow = rowsToSubmit.find(
      (row) => Number(row.score) > Number(row.total_marks)
    );
    if (invalidRow) {
      setStatus("");
      setOptionsError("Score cannot exceed total marks for any student.");
      return;
    }

    try {
      await Promise.all(
        rowsToSubmit.map((row) =>
          http.post(`/classes/${form.class_id}/marks`, {
            student_id: row.student_id,
            subject_id: form.subject_id,
            score: Number(row.score),
            total_marks: Number(row.total_marks),
            exam_type: form.exam_type,
            year: Number(form.year),
          })
        )
      );
      setStatus("Saved successfully");
      setScores({});
      setTotals({});
      const updatedMarks = await http.get(`/classes/${form.class_id}/marks`);
      setClassMarks(updatedMarks.data?.marks || []);
    } catch (err) {
      setStatus("");
      setOptionsError(err.response?.data?.message || "Error saving marks");
    }
  };

  const handleEdit = (studentId) => {
    setEditingStudentId(studentId);
  };

  const handleUpdate = async (studentId) => {
    const existing = currentMarksByStudent[studentId];
    if (!existing) return;

    const nextScore = scores[studentId] ?? existingScores[studentId];
    const nextTotal = totals[studentId] ?? existingTotals[studentId];

    if (Number(nextScore) > Number(nextTotal)) {
      setOptionsError("Score cannot exceed total marks.");
      return;
    }

    try {
      await http.put(`/marks/${existing.id}`, {
        score: Number(nextScore),
        total_marks: Number(nextTotal),
      });
      const updatedMarks = await http.get(`/classes/${form.class_id}/marks`);
      setClassMarks(updatedMarks.data?.marks || []);
      setEditingStudentId(null);
      setStatus("Updated successfully");
    } catch (err) {
      setOptionsError(err.response?.data?.message || "Error updating marks");
    }
  };

  const sortedStudents = useMemo(
    () =>
      [...students].sort((a, b) =>
        String(a.roll_no || "").localeCompare(String(b.roll_no || ""), undefined, {
          numeric: true,
          sensitivity: "base",
        })
      ),
    [students]
  );

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">Enter Marks</h1>
          <p className="mt-1 text-sm text-slate-500">
            Select a class and enter marks for each student.
          </p>
        </div>

        <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form className="space-y-6" onSubmit={submit}>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="classSelect">
                  Class
                </label>
                <select
                  id="classSelect"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={form.class_id}
                  onChange={handleClassChange}
                >
                  <option value="">Select class</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.year})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="examType">
                  Exam type
                </label>
                <select
                  id="examType"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={form.exam_type}
                  onChange={handleExamTypeChange}
                  disabled={!form.class_id}
                >
                  <option value="internal">Internal</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="marksYear">
                  Year
                </label>
                <input
                  id="marksYear"
                  type="number"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={form.year}
                  onChange={handleYearChange}
                  disabled={!form.class_id}
                />
              </div>
            </div>

            {!form.class_id ? (
              <p className="text-sm text-slate-500">
                Select a class to load students.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-3 py-2 font-medium">Sr No</th>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Roll No</th>
                      <th className="px-3 py-2 font-medium">Enter Marks</th>
                      <th className="px-3 py-2 font-medium">Total Marks</th>
                      <th className="px-3 py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStudents.map((student, index) => {
                      const existing = currentMarksByStudent[student.id];
                      const isEditing = editingStudentId === student.id;
                      return (
                        <tr key={student.id} className="border-b border-slate-100">
                          <td className="px-3 py-3 text-slate-500">
                            {index + 1}
                          </td>
                          <td className="px-3 py-3 font-medium text-slate-900">
                            {student.name}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {student.roll_no}
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min="0"
                              max={totals[student.id] ?? existingTotals[student.id] ?? ""}
                              className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              value={scores[student.id] ?? existingScores[student.id] ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                const maxVal = Number(totals[student.id] ?? existingTotals[student.id]);
                                if (val !== "" && maxVal && Number(val) > maxVal) return;
                                setScores((prev) => ({
                                  ...prev,
                                  [student.id]: val,
                                }));
                              }}
                              disabled={Boolean(existing) && !isEditing}
                            />
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              min="1"
                              className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                              value={totals[student.id] ?? existingTotals[student.id] ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTotals((prev) => ({
                                  ...prev,
                                  [student.id]: val,
                                }));
                                // If score already entered and exceeds new total, cap it
                                const currentScore = Number(scores[student.id] ?? existingScores[student.id] ?? 0);
                                if (val !== "" && currentScore > Number(val)) {
                                  setScores((prev) => ({
                                    ...prev,
                                    [student.id]: val,
                                  }));
                                }
                              }}
                              disabled={Boolean(existing) && !isEditing}
                            />
                          </td>
                          <td className="px-3 py-3">
                            {existing ? (
                              isEditing ? (
                                <button
                                  type="button"
                                  className="rounded-full bg-[#0052FF] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-600"
                                  onClick={() => handleUpdate(student.id)}
                                >
                                  Update
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                  onClick={() => handleEdit(student.id)}
                                >
                                  Edit
                                </button>
                              )
                            ) : (
                              <span className="text-xs text-slate-400">New</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {status && (
                  <p className="text-sm text-emerald-600">{status}</p>
                )}
                {optionsError && (
                  <p className="text-sm text-red-600" role="alert">
                    {optionsError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="rounded-full bg-[#0052FF] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 disabled:opacity-60"
                disabled={!form.class_id || sortedStudents.length === 0}
              >
                Submit marks
              </button>
            </div>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}
