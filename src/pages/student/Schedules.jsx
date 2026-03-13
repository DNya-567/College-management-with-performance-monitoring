// Student schedules page: view-only schedule list for enrolled classes.
// Must NOT define routes or direct axios calls.
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { listMyEnrollments } from "../../api/enrollments.api";
import { listClassSchedules } from "../../api/schedules.api";

const StudentSchedules = () => {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedClass = useMemo(
    () => classes.find((c) => c.class_id === classId),
    [classes, classId]
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await listMyEnrollments();
        const rows = res.data?.classes || [];
        if (!mounted) return;
        setClasses(rows);
        if (rows.length > 0) setClassId(rows[0].class_id);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || "Failed to load classes.");
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
    if (!classId) {
      setSchedules([]);
      return;
    }

    let mounted = true;
    const loadSchedules = async () => {
      try {
        const res = await listClassSchedules(classId);
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
  }, [classId]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Class Schedule</h1>
          <p className="mt-1 text-sm text-slate-500">
            View upcoming sessions, cancellations, and moved classes.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium">Class</label>
            <select
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">Select class</option>
              {classes.map((item) => (
                <option key={item.class_id} value={item.class_id}>
                  {item.class_name} ({item.subject_name})
                </option>
              ))}
            </select>
          </div>
          {selectedClass && (
            <p className="mt-2 text-xs text-slate-500">
              Teacher: {selectedClass.teacher_name}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : schedules.length === 0 ? (
            <p className="text-sm text-slate-500">No schedule entries for this class yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Time</th>
                    <th className="py-2 pr-4 font-medium">Topic</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Update</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 align-top">
                      <td className="py-2 pr-4">{item.session_date}</td>
                      <td className="py-2 pr-4">
                        {String(item.start_time).slice(0, 5)} - {String(item.end_time).slice(0, 5)}
                      </td>
                      <td className="py-2 pr-4">{item.topic || "-"}</td>
                      <td className="py-2 pr-4 uppercase">{item.status}</td>
                      <td className="py-2 pr-4 text-xs text-slate-600">
                        {item.status === "cancelled" && (item.reason || "Cancelled by teacher/HOD")}
                        {item.status === "rescheduled" && (
                          <>
                            Moved to {item.rescheduled_date} {String(item.rescheduled_start_time || "").slice(0, 5)}-
                            {String(item.rescheduled_end_time || "").slice(0, 5)}
                            {item.reason ? ` (${item.reason})` : ""}
                          </>
                        )}
                        {item.status === "scheduled" && (item.reason || "On schedule")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default StudentSchedules;

