// ForgotPassword page — UI + form handling only.
// Calls forgotPassword() from src/api/auth.api.js.
// Must NOT manage auth state or make direct axios calls.
import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth.api";
import gsap from "gsap";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useRef(null);
  const cardRef = useRef(null);

  // Entrance animation — same style as Login page
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".fp-shape",
        { opacity: 0, scale: 0 },
        { opacity: 0.15, scale: 1, duration: 1.2, ease: "elastic.out(1,0.5)", stagger: 0.15 }
      );
      gsap.to(".fp-shape", {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
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
        <div className="fp-shape absolute left-[10%] top-[15%] h-24 w-24 rounded-full bg-[#0052FF]" />
        <div className="fp-shape absolute right-[12%] top-[20%] h-16 w-16 rounded-2xl bg-blue-400 rotate-12" />
        <div className="fp-shape absolute left-[20%] bottom-[18%] h-20 w-20 rounded-full bg-indigo-400" />
        <div className="fp-shape absolute right-[18%] bottom-[25%] h-14 w-14 rounded-xl bg-[#0052FF] rotate-45" />
        <div className="fp-shape absolute left-[50%] top-[8%] h-10 w-10 rounded-full bg-sky-400" />
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
            <h1 className="text-2xl font-semibold text-slate-900">Forgot password?</h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter your registered email and we'll send you a reset link.
            </p>
          </div>

          {/* Success state */}
          {sent ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-emerald-800">Check your inbox</p>
              <p className="mt-1 text-sm text-emerald-700">
                If <strong>{email}</strong> is registered, a reset link will arrive in your inbox.
                The link expires in <strong>15 minutes</strong>.
              </p>
              <p className="mt-3 text-xs text-emerald-600">
                Didn't get it? Check your spam folder or{" "}
                <button
                  className="font-medium underline"
                  onClick={() => { setSent(false); setEmail(""); }}
                >
                  try again
                </button>.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="fp-email">
                    Email address
                  </label>
                  <input
                    id="fp-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:border-[#0052FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-[#0052FF] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? "Sending link…" : "Send reset link"}
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

export default ForgotPassword;

