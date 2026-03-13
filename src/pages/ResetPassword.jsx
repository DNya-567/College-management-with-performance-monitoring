// ResetPassword page — UI + form handling only.
// Reads the token from the URL query param (?token=...).
// Calls resetPassword() from src/api/auth.api.js.
// Must NOT manage auth state or make direct axios calls.
import { useLayoutEffect, useRef, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/auth.api";
import gsap from "gsap";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useRef(null);
  const cardRef = useRef(null);

  // Entrance animation
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".rp-shape",
        { opacity: 0, scale: 0 },
        { opacity: 0.15, scale: 1, duration: 1.2, ease: "elastic.out(1,0.5)", stagger: 0.15 }
      );
      gsap.to(".rp-shape", {
        y: "random(-20,20)",
        x: "random(-10,10)",
        rotation: "random(-15,15)",
        duration: "random(3,5)",
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: { each: 0.3, from: "random" },
      });
      gsap.fromTo(
        cardRef.current,
        { y: 60, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // If no token in URL, show error immediately
  const missingToken = !token;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      gsap.fromTo(cardRef.current, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1,0.3)" });
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      // Auto-redirect to login after 3 seconds
      setTimeout(() => navigate("/login", { replace: true }), 3000);
    } catch (err) {
      const msg = err?.response?.data?.message || "Reset failed. The link may be expired or already used.";
      setError(msg);
      gsap.fromTo(cardRef.current, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1,0.3)" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F4F6F8] px-4 py-10 text-slate-900"
    >
      {/* Floating decorative shapes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="rp-shape absolute left-[10%] top-[15%] h-24 w-24 rounded-full bg-[#0052FF]" />
        <div className="rp-shape absolute right-[12%] top-[20%] h-16 w-16 rounded-2xl bg-blue-400 rotate-12" />
        <div className="rp-shape absolute left-[20%] bottom-[18%] h-20 w-20 rounded-full bg-indigo-400" />
        <div className="rp-shape absolute right-[18%] bottom-[25%] h-14 w-14 rounded-xl bg-[#0052FF] rotate-45" />
        <div className="rp-shape absolute left-[50%] top-[8%] h-10 w-10 rounded-full bg-sky-400" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md">
        <div
          ref={cardRef}
          className="rounded-2xl border border-slate-200/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm"
          style={{ opacity: 0 }}
        >
          {/* Header */}
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0052FF]">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 12.75c0 4.97-4.03 9-9 9s-9-4.03-9-9c0-.946.152-1.858.434-2.71L12 14z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900">EduHub</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Set new password</h1>
            <p className="mt-1 text-sm text-slate-500">
              Choose a strong password for your account.
            </p>
          </div>

          {/* Missing token */}
          {missingToken && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-5 text-center">
              <p className="text-sm font-medium text-red-700">Invalid reset link</p>
              <p className="mt-1 text-sm text-red-600">
                This link appears to be invalid or incomplete.
              </p>
              <Link
                to="/forgot-password"
                className="mt-3 inline-block text-sm font-medium text-[#0052FF] hover:underline"
              >
                Request a new reset link →
              </Link>
            </div>
          )}

          {/* Success state */}
          {!missingToken && success && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-emerald-800">Password reset!</p>
              <p className="mt-1 text-sm text-emerald-700">
                Your password has been updated successfully. You'll be redirected to sign in shortly.
              </p>
              <Link
                to="/login"
                className="mt-3 inline-block text-sm font-medium text-[#0052FF] hover:underline"
              >
                Sign in now →
              </Link>
            </div>
          )}

          {/* Form */}
          {!missingToken && !success && (
            <>
              {error && (
                <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="rp-new">
                    New password
                  </label>
                  <input
                    id="rp-new"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:border-[#0052FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="rp-confirm">
                    Confirm password
                  </label>
                  <input
                    id="rp-confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:border-[#0052FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/10"
                  />
                </div>

                {/* Password match indicator */}
                {confirmPassword && (
                  <p className={`text-xs ${newPassword === confirmPassword ? "text-emerald-600" : "text-red-500"}`}>
                    {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-[#0052FF] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-slate-500 transition hover:text-[#0052FF]"
            >
              ← Back to sign in
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © 2026 EduHub · College Management System
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;

