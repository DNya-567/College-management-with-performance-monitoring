// UI-only page for students to view their marks + performance summary.
// Must NOT define routes or implement auth logic.
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { http } from "../../api/http";
import { fetchMyPerformance, fetchMyTrend } from "../../api/performance.api";
import { usePageAnimation } from "../../hooks/usePageAnimation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const examLabel = (exam) => {
  const labels = { internal: "Internal", midterm: "Midterm", final: "Final" };
  return labels[exam] || exam;
};

const MyMarks = () => {
  const { scopeRef } = usePageAnimation();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Performance summary
  const [perf, setPerf] = useState(null);
  const [perfLoading, setPerfLoading] = useState(true);

  // Trend data
  const [trend, setTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);

  // Compute failed subjects: score < 20% OR attendance < 30%
  const failedSubjects = useMemo(() => {
    if (!perf?.subjects) return [];
    return perf.subjects
      .filter((sub) => sub.avg_score < 20 || sub.attendance_pct < 30)
      .map((sub) => ({
        ...sub,
        failedByMarks: sub.avg_score < 20,
        failedByAttendance: sub.attendance_pct < 30,
      }));
  }, [perf]);

  // Load marks
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await http.get("/marks/me");
        if (isMounted) setMarks(response.data?.marks || []);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Failed to load marks.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void load();
    return () => { isMounted = false; };
  }, []);

  // Load performance summary
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await fetchMyPerformance();
        if (isMounted) setPerf(response.data || null);
      } catch {
        // non-critical — stats just won't show
      } finally {
        if (isMounted) setPerfLoading(false);
      }
    };
    void load();
    return () => { isMounted = false; };
  }, []);

  // Load trend
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const response = await fetchMyTrend();
        if (isMounted) setTrend(response.data?.trend || []);
      } catch {
        // non-critical
      } finally {
        if (isMounted) setTrendLoading(false);
      }
    };
    void load();
    return () => { isMounted = false; };
  }, []);

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">View Marks</h1>
          <p className="mt-1 text-sm text-slate-500">
            All marks assigned by your teachers.
          </p>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}

        {/* ── Marks table ── */}
        {!loading && !error && (
          <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {marks.length === 0 ? (
              <p className="text-sm text-slate-500">No marks yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-3 py-2 font-medium">Subject</th>
                      <th className="px-3 py-2 font-medium">Teacher</th>
                      <th className="px-3 py-2 font-medium">Score</th>
                      <th className="px-3 py-2 font-medium">Total</th>
                      <th className="px-3 py-2 font-medium">Percentage</th>
                      <th className="px-3 py-2 font-medium">Exam Type</th>
                      <th className="px-3 py-2 font-medium">Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((mark) => {
                      const total = Number(mark.total_marks || 0);
                      const percent = total
                        ? Math.min(Math.round((mark.score / total) * 100), 100)
                        : 0;
                      return (
                        <tr key={mark.id} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-medium text-slate-900">
                            {mark.subject_name}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {mark.teacher_name}
                          </td>
                          <td className="px-3 py-3 text-slate-600">{mark.score}</td>
                          <td className="px-3 py-3 text-slate-600">
                            {mark.total_marks ?? "-"}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {total ? `${percent}%` : "-"}
                          </td>
                          <td className="px-3 py-3 text-slate-600">
                            {mark.exam_type}
                          </td>
                          <td className="px-3 py-3 text-slate-600">{mark.year}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ── Performance stats bar ── */}
        {!perfLoading && perf && (
          <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Performance Summary
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <span className="shrink-0 text-2xl leading-none">🟩</span>
                <div>
                  <p className="text-xs font-medium text-slate-500">Avg Score</p>
                  <p className="text-lg font-bold text-emerald-700">
                    {Math.min(perf.avg_score, 100)}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <span className="shrink-0 text-2xl leading-none">🟦</span>
                <div>
                  <p className="text-xs font-medium text-slate-500">Attendance</p>
                  <p className="text-lg font-bold text-blue-700">
                    {Math.min(perf.attendance_pct, 100)}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
                <span className="shrink-0 text-2xl leading-none">📚</span>
                <div>
                  <p className="text-xs font-medium text-slate-500">Subjects</p>
                  <p className="text-lg font-bold text-purple-700">
                    {perf.subject_count}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <span className="shrink-0 text-2xl leading-none">🏆</span>
                <div>
                  <p className="text-xs font-medium text-slate-500">Rank</p>
                  <p className="text-lg font-bold text-amber-700">
                    {perf.rank}/{perf.total_students}
                  </p>
                </div>
              </div>
            </div>

            {/* Per-subject breakdown */}
            {perf.subjects && perf.subjects.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Subject-wise breakdown
                </h3>
                <div className="space-y-3">
                  {perf.subjects.map((sub) => (
                    <div
                      key={sub.name}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {sub.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-600">
                          Score:{" "}
                          <span className="font-semibold text-slate-900">
                            {Math.min(sub.avg_score, 100)}%
                          </span>
                        </span>
                        <span className="text-slate-600">
                          Attendance:{" "}
                          <span className="font-semibold text-slate-900">
                            {Math.min(sub.attendance_pct, 100)}%
                          </span>
                        </span>
                      </div>
                      <div className="w-full mt-2">
                        <div className="h-2 w-full rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-[#0052FF]"
                            style={{ width: `${Math.min(sub.avg_score, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Failed Subjects Warning ── */}
        {!perfLoading && failedSubjects.length > 0 && (
          <section className="anim-item rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="shrink-0 text-2xl leading-none">⚠️</span>
              <div>
                <h2 className="text-lg font-semibold text-red-800">
                  Failed Subjects
                </h2>
                <p className="text-sm text-red-600">
                  You are failing in {failedSubjects.length}{" "}
                  {failedSubjects.length === 1 ? "subject" : "subjects"} due to
                  low marks (&lt;20%) or low attendance (&lt;30%).
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {failedSubjects.map((sub) => (
                <div
                  key={sub.name}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-white px-4 py-3"
                >
                  <p className="text-sm font-medium text-slate-900">
                    {sub.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {sub.failedByMarks && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 font-semibold text-red-700">
                        Score: {sub.avg_score}% — below 20%
                      </span>
                    )}
                    {sub.failedByAttendance && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 font-semibold text-orange-700">
                        Attendance: {sub.attendance_pct}% — below 30%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Performance trend chart ── */}
        {!trendLoading && trend.length > 0 && (
          <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Performance Trend
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Exam-wise average percentage
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trend.map((t) => ({
                    exam: examLabel(t.exam),
                    percentage: t.percentage,
                  }))}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="exam"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Score"]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      fontSize: 13,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="#0052FF"
                    strokeWidth={2}
                    dot={{ r: 5, fill: "#0052FF" }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyMarks;
