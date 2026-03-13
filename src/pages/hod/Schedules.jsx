// HOD schedules page: UI and event handling only.
// Must NOT define routes or direct axios calls.
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { listDepartmentClasses } from "../../api/classes.api";
import {
  createClassSchedule,
  listClassSchedules,
  updateSchedule,
} from "../../api/schedules.api";

const HodSchedules = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [schedules, setSchedules] = useState([]);

  const [form, setForm] = useState({
    session_date: "",
    start_time: "",
    end_time: "",
    topic: "",
  });

  const [editScheduleId, setEditScheduleId] = useState("");
  const [editPayload, setEditPayload] = useState({
    status: "scheduled",
    reason: "",
    rescheduled_date: "",
    rescheduled_start_time: "",
    rescheduled_end_time: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId),
    [classes, selectedClassId]
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await listDepartmentClasses();
        const rows = res.data?.classes || [];
        if (!mounted) return;
        setClasses(rows);
        if (rows.length > 0) {
          setSelectedClassId(rows[0].id);
        }
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || "Failed to load department classes.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      setSchedules([]);
      return;
    }

    let mounted = true;
    const loadSchedules = async () => {
      try {
        const res = await listClassSchedules(selectedClassId);
        if (!mounted) return;
        setSchedules(res.data?.schedules || []);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || "Failed to load schedules.");
      }
    };

    loadSchedules();
    return () => {
      mounted = false;
    };
  }, [selectedClassId]);

  const createSession = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");

    if (!selectedClassId) {
      setError("Please select a class.");
      return;
    }

    setSaving(true);
    try {
      await createClassSchedule(selectedClassId, form);
      const refreshed = await listClassSchedules(selectedClassId);
      setSchedules(refreshed.data?.schedules || []);
      setStatus("Schedule created.");
      setForm({ session_date: "", start_time: "", end_time: "", topic: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create schedule.");
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (schedule) => {
    setEditScheduleId(schedule.id);
    setEditPayload({
      status: schedule.status || "scheduled",
      reason: schedule.reason || "",
      rescheduled_date: schedule.rescheduled_date || "",
      rescheduled_start_time: schedule.rescheduled_start_time || "",
      rescheduled_end_time: schedule.rescheduled_end_time || "",
    });
  };

  const saveEdit = async () => {
    if (!editScheduleId) return;

    setError("");
    setStatus("");
    setSaving(true);

    try {
      await updateSchedule(editScheduleId, editPayload);
      const refreshed = await listClassSchedules(selectedClassId);
      setSchedules(refreshed.data?.schedules || []);
      setEditScheduleId("");
      setStatus("Schedule updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update schedule.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Department Schedules</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage class sessions in your department. You can cancel or move sessions.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <select
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">Select class</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.subject_name}) - {item.teacher_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Owner</label>
              <div className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700">
                {selectedClass ? `${selectedClass.teacher_name}` : "-"}
              </div>
            </div>
          </div>

          <form className="mt-4 grid gap-3 sm:grid-cols-4" onSubmit={createSession}>
            <input
              type="date"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.session_date}
              onChange={(e) => setForm((prev) => ({ ...prev, session_date: e.target.value }))}
              required
            />
            <input
              type="time"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.start_time}
              onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
              required
            />
            <input
              type="time"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.end_time}
              onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Topic"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.topic}
              onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
            />
            <button
              type="submit"
              disabled={saving || loading || !selectedClassId}
              className="sm:col-span-4 rounded-full bg-[#0052FF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Create session"}
            </button>
          </form>

          {status && <p className="mt-3 text-sm text-emerald-600">{status}</p>}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Scheduled sessions</h2>
          {schedules.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No sessions available.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-900">
                    {schedule.session_date} · {String(schedule.start_time).slice(0, 5)} - {String(schedule.end_time).slice(0, 5)}
                  </p>
                  <p className="text-xs text-slate-500">{schedule.topic || "No topic"}</p>
                  <p className="mt-1 text-xs">Status: <span className="font-medium uppercase">{schedule.status}</span></p>

                  {editScheduleId === schedule.id ? (
                    <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
                      <select
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={editPayload.status}
                        onChange={(e) => setEditPayload((prev) => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rescheduled">Rescheduled</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Reason"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={editPayload.reason}
                        onChange={(e) => setEditPayload((prev) => ({ ...prev, reason: e.target.value }))}
                      />

                      {editPayload.status === "rescheduled" && (
                        <div className="grid gap-2 sm:grid-cols-3">
                          <input
                            type="date"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={editPayload.rescheduled_date}
                            onChange={(e) => setEditPayload((prev) => ({ ...prev, rescheduled_date: e.target.value }))}
                          />
                          <input
                            type="time"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={editPayload.rescheduled_start_time}
                            onChange={(e) => setEditPayload((prev) => ({ ...prev, rescheduled_start_time: e.target.value }))}
                          />
                          <input
                            type="time"
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={editPayload.rescheduled_end_time}
                            onChange={(e) => setEditPayload((prev) => ({ ...prev, rescheduled_end_time: e.target.value }))}
                          />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="rounded-full bg-[#0052FF] px-3 py-1 text-xs font-semibold text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditScheduleId("")}
                          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => beginEdit(schedule)}
                      className="mt-2 rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      Edit / Cancel / Move
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default HodSchedules;

