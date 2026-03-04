// Reusable confirmation dialog for destructive actions.
// Must NOT contain API calls or business logic.
import { AlertTriangle } from "lucide-react";

export default function ConfirmModal({ open, title, message, confirmLabel = "Confirm", onConfirm, onCancel, destructive = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-3">
          <div className={`rounded-lg p-2 ${destructive ? "bg-red-50" : "bg-amber-50"}`}>
            <AlertTriangle className={`w-5 h-5 ${destructive ? "text-red-600" : "text-amber-600"}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#0052FF] hover:bg-[#0041cc]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

