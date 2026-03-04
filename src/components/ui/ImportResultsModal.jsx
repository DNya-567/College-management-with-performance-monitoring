// Reusable modal for showing CSV import results.
// Must NOT make API calls or contain auth logic.
import { Check, X, AlertTriangle } from "lucide-react";

export default function ImportResultsModal({ open, onClose, results }) {
  if (!open || !results) return null;

  const { total = 0, created = 0, failed = 0, errors = [] } = results;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Import Results</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="px-6 py-4 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{total}</p>
            <p className="text-xs text-slate-500 mt-1">Total Rows</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Check className="w-4 h-4 text-emerald-600" />
              <p className="text-2xl font-bold text-emerald-700">{created}</p>
            </div>
            <p className="text-xs text-emerald-600 mt-1">Successful</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <X className="w-4 h-4 text-red-600" />
              <p className="text-2xl font-bold text-red-700">{failed}</p>
            </div>
            <p className="text-xs text-red-600 mt-1">Failed</p>
          </div>
        </div>

        {/* Error details */}
        {errors.length > 0 && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-medium text-slate-700">Failed Rows</p>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium w-16">Row</th>
                    <th className="text-left px-3 py-2 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((err, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-600 font-mono">{err.row}</td>
                      <td className="px-3 py-2 text-red-600">{err.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-[#0052FF] rounded-lg hover:bg-[#0041cc] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

