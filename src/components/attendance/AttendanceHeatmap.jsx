// Reusable GitHub-style attendance heatmap component.
// Accepts attendance data as props — does NOT fetch data itself.
// Does NOT contain routing or auth logic.
// When editable=true, non-Sunday cells are clickable and fire onCellClick(date, currentStatus).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STATUS_COLORS = {
  present: "#22c55e",  // green-500
  late: "#eab308",     // yellow-500
  absent: "#ef4444",   // red-500
};
const EMPTY_COLOR = "#e2e8f0"; // slate-200
const SUNDAY_BG = "#cbd5e1";   // slate-300 — blocked day background

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * @param {object} props
 * @param {Array<{ date: string, status: string }>} props.data
 * @param {number} [props.months=6]
 * @param {boolean} [props.editable=false]  — allow clicking cells to toggle status
 * @param {(date: string, currentStatus: string|null) => void} [props.onCellClick]
 */
export default function AttendanceHeatmap({
  data = [],
  months = 6,
  editable = false,
  onCellClick,
}) {
  const [tooltip, setTooltip] = useState(null);
  const tooltipTimerRef = useRef(null);

  // Clear tooltip on unmount to prevent detached DOM nodes
  useEffect(() => {
    return () => {
      setTooltip(null);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  const clearTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  // Build a lookup map: date-string → status
  const statusMap = useMemo(() => {
    const map = {};
    data.forEach((item) => {
      map[item.date?.slice(0, 10)] = item.status;
    });
    return map;
  }, [data]);

  // Generate the grid: array of weeks, each week = array of day cells
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setMonth(start.getMonth() - months);
    // Align start to previous Monday
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start.setDate(start.getDate() - diff);

    const generatedWeeks = [];
    const labels = [];
    let currentWeek = [];
    let lastMonth = -1;
    const cursor = new Date(start);

    while (cursor <= today) {
      const iso = cursor.toISOString().slice(0, 10);
      const dow = cursor.getDay(); // 0=Sun
      const row = dow === 0 ? 6 : dow - 1; // Mon=0 … Sun=6

      if (row === 0 && cursor.getMonth() !== lastMonth) {
        labels.push({
          weekIndex: generatedWeeks.length,
          label: cursor.toLocaleString("default", { month: "short" }),
        });
        lastMonth = cursor.getMonth();
      }

      currentWeek[row] = {
        date: iso,
        status: statusMap[iso] || null,
        isSunday: dow === 0,
      };

      if (row === 6) {
        generatedWeeks.push(currentWeek);
        currentWeek = [];
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      generatedWeeks.push(currentWeek);
    }

    return { weeks: generatedWeeks, monthLabels: labels };
  }, [statusMap, months]);

  const cellSize = 14;
  const gap = 3;
  const step = cellSize + gap;
  const labelOffset = 28;

  return (
    <div className="w-full overflow-x-auto">
      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="font-medium text-slate-700">Attendance heatmap</span>
        {editable && (
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0052FF]">
            Edit mode — click to toggle
          </span>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {[
            { label: "Present", color: STATUS_COLORS.present },
            { label: "Late", color: STATUS_COLORS.late },
            { label: "Absent", color: STATUS_COLORS.absent },
            { label: "No record", color: EMPTY_COLOR },
            { label: "Sunday", color: SUNDAY_BG, cross: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <span
                className="relative inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              >
                {item.cross && (
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold leading-none text-slate-600">
                    ✕
                  </span>
                )}
              </span>
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="relative" style={{ paddingLeft: labelOffset }}>
        {/* Day-of-week labels */}
        <div
          className="absolute left-0 top-0 flex flex-col text-[10px] text-slate-400"
          style={{ gap: `${gap}px` }}
        >
          {DAYS.map((d, i) => (
            <div
              key={d}
              className="flex items-center"
              style={{ height: cellSize }}
            >
              {i % 2 === 0 ? d : ""}
            </div>
          ))}
        </div>

        {/* Month labels */}
        <div className="flex text-[10px] text-slate-400" style={{ marginBottom: 4 }}>
          {monthLabels.map((m, i) => (
            <span
              key={`${m.label}-${i}`}
              className="absolute"
              style={{ left: labelOffset + m.weekIndex * step }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <svg
          width={weeks.length * step}
          height={7 * step + 16}
          style={{ marginTop: 16 }}
        >
          {weeks.map((week, wi) =>
            week.map((cell, di) => {
              if (!cell) return null;

              const cx = wi * step;
              const cy = di * step;

              // Sunday → blocked cell with ✕ cross (never clickable)
              if (cell.isSunday) {
                return (
                  <g
                    key={cell.date}
                    className="cursor-default"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                        date: cell.date,
                        status: "Sunday — No attendance",
                      });
                    }}
                    onMouseLeave={clearTooltip}
                  >
                    <rect
                      x={cx}
                      y={cy}
                      width={cellSize}
                      height={cellSize}
                      rx={3}
                      fill={SUNDAY_BG}
                    />
                    <line
                      x1={cx + 3}
                      y1={cy + 3}
                      x2={cx + cellSize - 3}
                      y2={cy + cellSize - 3}
                      stroke="#64748b"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                    <line
                      x1={cx + cellSize - 3}
                      y1={cy + 3}
                      x2={cx + 3}
                      y2={cy + cellSize - 3}
                      stroke="#64748b"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  </g>
                );
              }

              // Normal day
              const color = cell.status
                ? STATUS_COLORS[cell.status] || EMPTY_COLOR
                : EMPTY_COLOR;

              const isClickable = editable && typeof onCellClick === "function";

              return (
                <rect
                  key={cell.date}
                  x={cx}
                  y={cy}
                  width={cellSize}
                  height={cellSize}
                  rx={3}
                  fill={color}
                  stroke={isClickable ? "#94a3b8" : "none"}
                  strokeWidth={isClickable ? 0.5 : 0}
                  className={
                    isClickable
                      ? "cursor-pointer transition-all hover:opacity-70 hover:stroke-[#0052FF] hover:stroke-[1.5]"
                      : "cursor-default transition-opacity hover:opacity-80"
                  }
                  onClick={() => {
                    if (isClickable) onCellClick(cell.date, cell.status);
                  }}
                  onMouseEnter={(e) => {
                    const rect = e.target.getBoundingClientRect();
                    setTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top - 8,
                      date: cell.date,
                      status: cell.status || "No record",
                    });
                  }}
                  onMouseLeave={clearTooltip}
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-slate-200 bg-slate-800 px-3 py-1.5 text-xs text-white shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span className="font-medium">{tooltip.date}</span>
          <span className="ml-2 capitalize">{tooltip.status}</span>
        </div>
      )}
    </div>
  );
}

