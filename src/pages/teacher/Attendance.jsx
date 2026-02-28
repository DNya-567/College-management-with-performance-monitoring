// UI-only page for teachers to mark attendance.
// Must NOT define routes or implement auth logic.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import AttendanceHeatmap from "../../components/attendance/AttendanceHeatmap";
import { http } from "../../api/http";
import { useTeacherClasses } from "../../hooks/useTeacherClasses";
import {
  listStudentAttendanceForClass,
  submitClassAttendance,
} from "../../api/attendance.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";

const today = () => new Date().toISOString().slice(0, 10);

const isSunday = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr + "T00:00:00").getDay() === 0;
};

const Attendance = () => {
  const [searchParams] = useSearchParams();

  // ── Shared state ──
  const { classes } = useTeacherClasses();
  const { scopeRef } = usePageAnimation();
  const [classId, setClassId] = useState("");

  // ── Table section state ──
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [selectedMap, setSelectedMap] = useState({});
  const [date, setDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // ── Heatmap section state ──
  const [heatmapStudentId, setHeatmapStudentId] = useState("");
  const [heatmapData, setHeatmapData] = useState([]);
  const [heatmapEdits, setHeatmapEdits] = useState({}); // date → status
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapStatus, setHeatmapStatus] = useState("");
  const [heatmapError, setHeatmapError] = useState("");

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) =>
      String(a.roll_no || "").localeCompare(String(b.roll_no || ""), undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  }, [students]);

  const selectedCount = useMemo(
    () => Object.values(selectedMap).filter(Boolean).length,
    [selectedMap]
  );

  // Merge server data with local edits for the heatmap
  const mergedHeatmapData = useMemo(() => {
    const map = {};
    heatmapData.forEach((item) => {
      map[item.date?.slice(0, 10)] = item.status;
    });
    // Layer edits on top
    Object.entries(heatmapEdits).forEach(([d, s]) => {
      map[d] = s;
    });
    return Object.entries(map).map(([d, s]) => ({ date: d, status: s }));
  }, [heatmapData, heatmapEdits]);

  const pendingEditCount = Object.keys(heatmapEdits).length;

  // ── Auto-select classId from query string once classes load ──
  useEffect(() => {
    const fromQuery = searchParams.get("classId");
    if (fromQuery && classes.some((item) => item.id === fromQuery)) {
      setClassId(fromQuery);
    }
  }, [classes, searchParams]);

  // ── Load students when class changes ──
  useEffect(() => {
    let isMounted = true;
    if (!classId) {
      setStudents([]);
      setRecords({});
      setHeatmapStudentId("");
      setHeatmapData([]);
      setHeatmapEdits({});
      return;
    }
    setLoading(true);
    setError("");
    const load = async () => {
      try {
        const response = await http.get(`/classes/${classId}/students`);
        if (isMounted) {
          const list = response.data?.students || [];
          setStudents(list);
          const defaults = {};
          const selectedDefaults = {};
          list.forEach((s) => {
            defaults[s.id] = "absent";
            selectedDefaults[s.id] = false;
          });
          setRecords(defaults);
          setSelectedMap(selectedDefaults);
          setHeatmapStudentId("");
          setHeatmapData([]);
          setHeatmapEdits({});
        }
      } catch (err) {
        if (isMounted)
          setError(err.response?.data?.message || "Failed to load students.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [classId]);

  // ── Load existing attendance for the selected date ──
  useEffect(() => {
    let isMounted = true;
    if (!classId || !date) return;
    const load = async () => {
      try {
        const response = await http.get(
          `/classes/${classId}/attendance?date=${date}`
        );
        if (isMounted) {
          const next = {};
          students.forEach((s) => { next[s.id] = "absent"; });
          (response.data?.attendance || []).forEach((item) => {
            next[item.student_id] = item.status;
          });
          setRecords(next);
        }
      } catch {
        // silent — records keep defaults
      }
    };
    load();
    return () => { isMounted = false; };
  }, [classId, date, students]);

  // ── Load heatmap data when student changes ──
  const loadHeatmap = useCallback(async () => {
    if (!classId || !heatmapStudentId) return;
    setHeatmapLoading(true);
    setHeatmapError("");
    setHeatmapStatus("");
    setHeatmapEdits({});
    try {
      const res = await listStudentAttendanceForClass(classId, heatmapStudentId);
      setHeatmapData(res.data?.attendance || []);
    } catch (err) {
      setHeatmapError(err.response?.data?.message || "Failed to load attendance.");
    } finally {
      setHeatmapLoading(false);
    }
  }, [classId, heatmapStudentId]);

  useEffect(() => {
    loadHeatmap();
  }, [loadHeatmap]);

  // ── Table handlers ──
  const toggleStatus = (studentId) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  const toggleSelected = (studentId) => {
    setSelectedMap((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleTableSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    setError("");

    if (isSunday(date)) {
      setError("Attendance cannot be marked on Sundays.");
      return;
    }
    if (selectedCount <= 1) {
      setError("Select at least two students before submitting.");
      return;
    }

    try {
      const payload = {
        date,
        records: students
          .filter((s) => selectedMap[s.id])
          .map((s) => ({
            student_id: s.id,
            status: records[s.id] || "absent",
          })),
      };
      await submitClassAttendance(classId, payload);
      setStatus("Attendance saved.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save attendance.");
    }
  };

  // ── Heatmap handlers ──
  const handleCellClick = (cellDate, currentStatus) => {
    if (isSunday(cellDate)) return;
    setHeatmapEdits((prev) => {
      const next = { ...prev };
      // Cycle: no record → present → absent → remove edit
      const effectiveStatus = next[cellDate] !== undefined
        ? next[cellDate]
        : currentStatus;

      if (!effectiveStatus || effectiveStatus === "absent") {
        next[cellDate] = "present";
      } else if (effectiveStatus === "present") {
        next[cellDate] = "absent";
      } else {
        next[cellDate] = "present";
      }
      return next;
    });
  };

  const handleHeatmapSubmit = async () => {
    if (!classId || !heatmapStudentId || pendingEditCount === 0) return;
    setHeatmapStatus("");
    setHeatmapError("");

    // Group edits by date and submit each date's record
    const editEntries = Object.entries(heatmapEdits);

    // Filter out Sundays (shouldn't happen, but safety net)
    const valid = editEntries.filter(([d]) => !isSunday(d));
    if (valid.length === 0) {
      setHeatmapError("No valid edits to submit.");
      return;
    }

    try {
      // Submit each date as a batch of one record
      for (const [editDate, editStatus] of valid) {
        await submitClassAttendance(classId, {
          date: editDate,
          records: [{ student_id: heatmapStudentId, status: editStatus }],
        });
      }
      setHeatmapStatus(`${valid.length} attendance record(s) saved.`);
      setHeatmapEdits({});
      // Reload heatmap data
      await loadHeatmap();
    } catch (err) {
      setHeatmapError(err.response?.data?.message || "Failed to save attendance.");
    }
  };

  const handleDiscardEdits = () => {
    setHeatmapEdits({});
    setHeatmapStatus("");
    setHeatmapError("");
  };

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === heatmapStudentId),
    [students, heatmapStudentId]
  );

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">Attendance</h1>
          <p className="mt-1 text-sm text-slate-500">
            Mark attendance by table or visually with the heatmap.
          </p>
        </div>

        {/* ── Shared class selector ── */}
        <div className="anim-item space-y-2">
          <label className="text-sm font-medium" htmlFor="classSelect">
            Class
          </label>
          <select
            id="classSelect"
            className="w-full max-w-xs rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#0052FF] focus:outline-none"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">Select class</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.year})
              </option>
            ))}
          </select>
        </div>

        {!classId && (
          <p className="text-sm text-slate-500">
            Select a class above to load attendance tools.
          </p>
        )}

        {classId && (
          <div className="grid gap-6 xl:grid-cols-2">
            {/* ═══════════ Card 1: Table-based attendance ═══════════ */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Mark by table
              </h2>
              <p className="mt-1 mb-4 text-sm text-slate-500">
                Select students, toggle status, then submit.
              </p>

              <form className="space-y-4" onSubmit={handleTableSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="dateSelect">
                    Date
                  </label>
                  <input
                    id="dateSelect"
                    type="date"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#0052FF] focus:outline-none"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                {isSunday(date) && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <span className="text-base">⚠️</span>
                    <span>
                      <strong>Sunday selected.</strong> Attendance cannot be
                      marked on Sundays.
                    </span>
                  </div>
                )}

                {loading && (
                  <p className="text-sm text-slate-500">Loading…</p>
                )}
                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
                {status && (
                  <p className="text-sm text-emerald-600">{status}</p>
                )}

                <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="px-3 py-2 font-medium">Select</th>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Roll No</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedStudents.map((student) => (
                        <tr
                          key={student.id}
                          className="border-b border-slate-100"
                        >
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={Boolean(selectedMap[student.id])}
                              onChange={() => toggleSelected(student.id)}
                              className="h-4 w-4 rounded border-slate-300 text-[#0052FF]"
                            />
                          </td>
                          <td className="px-3 py-3 font-medium text-slate-900">
                            {student.name}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {student.roll_no}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => toggleStatus(student.id)}
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${
                                records[student.id] === "present"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {records[student.id] === "present"
                                ? "Present"
                                : "Absent"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {selectedCount > 1 && (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-full bg-[#0052FF] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 disabled:opacity-50"
                      disabled={!classId || loading || isSunday(date)}
                    >
                      Submit attendance
                    </button>
                  </div>
                )}
              </form>
            </section>

            {/* ═══════════ Card 2: Heatmap-based attendance ═══════════ */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Visual heatmap
              </h2>
              <p className="mt-1 mb-4 text-sm text-slate-500">
                Select a student, click squares to toggle attendance, then save.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="heatmapStudent"
                  >
                    Student
                  </label>
                  <select
                    id="heatmapStudent"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#0052FF] focus:outline-none"
                    value={heatmapStudentId}
                    onChange={(e) => setHeatmapStudentId(e.target.value)}
                  >
                    <option value="">Select student</option>
                    {sortedStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.roll_no})
                      </option>
                    ))}
                  </select>
                </div>

                {heatmapLoading && (
                  <p className="text-sm text-slate-500">Loading heatmap…</p>
                )}
                {heatmapError && (
                  <p className="text-sm text-red-600" role="alert">
                    {heatmapError}
                  </p>
                )}
                {heatmapStatus && (
                  <p className="text-sm text-emerald-600">{heatmapStatus}</p>
                )}

                {!heatmapStudentId && !heatmapLoading && (
                  <p className="text-sm text-slate-500">
                    Pick a student to view and edit their attendance heatmap.
                  </p>
                )}

                {heatmapStudentId && !heatmapLoading && (
                  <>
                    {selectedStudent && (
                      <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-700">
                        Viewing:{" "}
                        <span className="font-semibold">
                          {selectedStudent.name}
                        </span>{" "}
                        ({selectedStudent.roll_no})
                        {pendingEditCount > 0 && (
                          <span className="ml-2 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            {pendingEditCount} unsaved change
                            {pendingEditCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    )}

                    <AttendanceHeatmap
                      data={mergedHeatmapData}
                      months={6}
                      editable
                      onCellClick={handleCellClick}
                    />

                    {/* Pending edits summary */}
                    {pendingEditCount > 0 && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-sm font-semibold text-slate-900 mb-2">
                          Pending changes ({pendingEditCount})
                        </h3>
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                          {Object.entries(heatmapEdits).map(([d, s]) => (
                            <span
                              key={d}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                                s === "present"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {d} → {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 justify-end">
                      {pendingEditCount > 0 && (
                        <button
                          type="button"
                          onClick={handleDiscardEdits}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Discard
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleHeatmapSubmit}
                        disabled={pendingEditCount === 0}
                        className="rounded-full bg-[#0052FF] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 disabled:opacity-50"
                      >
                        Save heatmap changes
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
