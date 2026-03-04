// Reusable password change card for profile pages.
// Must NOT define routes or API endpoints.
import { useState } from "react";
import { changePassword } from "../../api/auth.api";
import { Lock, Check, X, Eye, EyeOff } from "lucide-react";

export default function ChangePasswordCard() {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.current_password || !form.new_password || !form.confirm) {
      showToast("All fields are required.", "error");
      return;
    }

    if (form.new_password.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }

    if (form.new_password !== form.confirm) {
      showToast("New passwords do not match.", "error");
      return;
    }

    if (form.current_password === form.new_password) {
      showToast("New password must be different from current password.", "error");
      return;
    }

    try {
      setLoading(true);
      await changePassword(form.current_password, form.new_password);
      showToast("Password changed successfully. A confirmation email has been sent.");
      setForm({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change password.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative">
      {/* Toast */}
      {toast && (
        <div className={`absolute -top-12 left-0 right-0 mx-auto w-fit px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 z-50 ${
          toast.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
        }`}>
          {toast.type === "error" ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className="bg-amber-50 rounded-lg p-2">
          <Lock className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">Change Password</h3>
          <p className="text-xs text-slate-500">You'll receive an email notification after change</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Current Password */}
        <div className="relative">
          <label className="text-xs font-medium text-slate-500 mb-1 block">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={form.current_password}
              onChange={(e) => setForm({ ...form, current_password: e.target.value })}
              placeholder="Enter current password"
              className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">New Password</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={form.new_password}
              onChange={(e) => setForm({ ...form, new_password: e.target.value })}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Confirm New Password</label>
          <input
            type="password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            placeholder="Re-enter new password"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-1 px-4 py-2.5 text-sm font-medium text-white bg-[#0052FF] rounded-lg hover:bg-[#0041cc] transition-colors disabled:opacity-50"
        >
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}

