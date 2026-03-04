// Reusable semester dropdown selector.
// Must NOT contain API calls or business logic.
import { Calendar } from "lucide-react";

export default function SemesterSelector({ semesters, selectedId, onChange, loading }) {
  if (loading) return null;
  if (!semesters || semesters.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-slate-400" />
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF] bg-white"
      >
        <option value="">All Semesters</option>
        {semesters.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.academic_year}){s.is_active ? " ★" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

