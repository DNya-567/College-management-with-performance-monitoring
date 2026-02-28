// UI-only login page: handles form input, submit, and redirects.
// GSAP is used for entrance and transition animations.
// Must NOT call APIs directly, store tokens, or manage auth state.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { registerTeacher, registerStudent } from "../api/auth.api";
import gsap from "gsap";

const roleToPath = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  hod: "/hod",
};

const Login = () => {
  const navigate = useNavigate();
  const { login, user, isAuthenticated, loading } = useAuth();

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Teacher registration state
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [registerStatus, setRegisterStatus] = useState("");
  const [registerError, setRegisterError] = useState("");

  // Student registration state
  const [studentForm, setStudentForm] = useState({
    name: "",
    roll_no: "",
    email: "",
    password: "",
    year: "",
  });
  const [studentStatus, setStudentStatus] = useState("");
  const [studentError, setStudentError] = useState("");

  // UI mode
  const [mode, setMode] = useState("login"); // "login" | "teacher" | "student"

  // GSAP refs
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const titleRef = useRef(null);
  const loginFormRef = useRef(null);
  const registerSectionRef = useRef(null);
  const teacherFormRef = useRef(null);
  const studentFormRef = useRef(null);
  const floatingRef = useRef(null);

  // Redirect on auth
  useEffect(() => {
    if (!loading && isAuthenticated && user?.role) {
      const target = roleToPath[user.role] || "/login";
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  // ─── Entrance animation ───
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Floating shapes
      gsap.fromTo(
        ".floating-shape",
        { opacity: 0, scale: 0 },
        {
          opacity: 0.15,
          scale: 1,
          duration: 1.2,
          ease: "elastic.out(1, 0.5)",
          stagger: 0.15,
        }
      );

      // Continuous gentle floating
      gsap.to(".floating-shape", {
        y: "random(-20, 20)",
        x: "random(-10, 10)",
        rotation: "random(-15, 15)",
        duration: "random(3, 5)",
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: { each: 0.3, from: "random" },
      });

      // Card entrance
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        cardRef.current,
        { y: 60, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8 }
      )
        .fromTo(
          titleRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          "-=0.4"
        )
        .fromTo(
          loginFormRef.current?.querySelectorAll(".form-field") || [],
          { y: 25, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.1 },
          "-=0.2"
        )
        .fromTo(
          registerSectionRef.current,
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4 },
          "-=0.1"
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // ─── Mode transition animation ───
  useEffect(() => {
    const target =
      mode === "teacher"
        ? teacherFormRef.current
        : mode === "student"
          ? studentFormRef.current
          : null;

    if (target) {
      gsap.fromTo(
        target,
        { height: 0, opacity: 0, y: 15 },
        {
          height: "auto",
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        }
      );

      // Stagger the inner fields
      const fields = target.querySelectorAll(".reg-field");
      gsap.fromTo(
        fields,
        { x: -15, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.35, stagger: 0.08, ease: "power2.out", delay: 0.15 }
      );
    }
  }, [mode]);

  // ─── Handlers ───
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    // Button press animation
    gsap.fromTo(
      event.currentTarget.querySelector("button[type=submit]"),
      { scale: 0.95 },
      { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.4)" }
    );

    try {
      await login(email, password);
    } catch {
      setError("Login failed. Please check your credentials.");
      // Shake card on error
      gsap.fromTo(
        cardRef.current,
        { x: -8 },
        { x: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setRegisterError("");
    setRegisterStatus("");

    try {
      await registerTeacher({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
      });
      setRegisterStatus("Registration successful. Please sign in.");
      setRegisterForm({ name: "", email: "", password: "" });
      setMode("login");
    } catch (err) {
      setRegisterError(err.response?.data?.message || "Registration failed.");
    }
  };

  const handleStudentRegister = async (event) => {
    event.preventDefault();
    setStudentError("");
    setStudentStatus("");

    try {
      await registerStudent({
        name: studentForm.name,
        roll_no: studentForm.roll_no,
        email: studentForm.email,
        password: studentForm.password,
        year: Number(studentForm.year),
      });
      setStudentStatus("Student registered. Please sign in.");
      setStudentForm({ name: "", roll_no: "", email: "", password: "", year: "" });
      setMode("login");
    } catch (err) {
      setStudentError(err.response?.data?.message || "Student registration failed.");
    }
  };

  // ─── Render ───
  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F4F6F8] px-4 py-10 text-slate-900"
    >
      {/* Floating decorative shapes */}
      <div ref={floatingRef} className="pointer-events-none absolute inset-0">
        <div className="floating-shape absolute left-[10%] top-[15%] h-24 w-24 rounded-full bg-[#0052FF]" />
        <div className="floating-shape absolute right-[12%] top-[20%] h-16 w-16 rounded-2xl bg-blue-400 rotate-12" />
        <div className="floating-shape absolute left-[20%] bottom-[18%] h-20 w-20 rounded-full bg-indigo-400" />
        <div className="floating-shape absolute right-[18%] bottom-[25%] h-14 w-14 rounded-xl bg-[#0052FF] rotate-45" />
        <div className="floating-shape absolute left-[50%] top-[8%] h-10 w-10 rounded-full bg-sky-400" />
        <div className="floating-shape absolute right-[35%] bottom-[10%] h-12 w-12 rounded-2xl bg-blue-300 -rotate-12" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md">
        <div
          ref={cardRef}
          className="rounded-2xl border border-slate-200/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm"
          style={{ opacity: 0 }}
        >
          {/* Header */}
          <div ref={titleRef} style={{ opacity: 0 }}>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0052FF]">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 12.75c0 4.97-4.03 9-9 9s-9-4.03-9-9c0-.946.152-1.858.434-2.71L12 14z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900">EduHub</span>
            </div>
            <h1 className="mt-4 text-2xl font-semibold">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to access your dashboard.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {registerStatus && (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
              {registerStatus}
            </p>
          )}
          {studentStatus && (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
              {studentStatus}
            </p>
          )}

          {/* Login form */}
          <form ref={loginFormRef} className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="form-field space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:border-[#0052FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/10"
                id="email"
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-field space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:border-[#0052FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/10"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <button
                className="w-full rounded-full bg-[#0052FF] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] disabled:opacity-60"
                type="submit"
                disabled={submitting || loading}
              >
                {submitting ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          {/* Registration toggle section */}
          <div ref={registerSectionRef} className="mt-6 border-t border-slate-200 pt-6" style={{ opacity: 0 }}>
            <p className="text-center text-sm text-slate-500">
              Don't have an account?
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  mode === "student"
                    ? "bg-[#0052FF] text-white shadow-md shadow-blue-500/20"
                    : "border border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-[#0052FF]"
                }`}
                onClick={() => setMode(mode === "student" ? "login" : "student")}
              >
                Student
              </button>
              <button
                type="button"
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  mode === "teacher"
                    ? "bg-[#0052FF] text-white shadow-md shadow-blue-500/20"
                    : "border border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-[#0052FF]"
                }`}
                onClick={() => setMode(mode === "teacher" ? "login" : "teacher")}
              >
                Teacher
              </button>
            </div>
          </div>

          {/* Teacher registration form */}
          {mode === "teacher" && (
            <div ref={teacherFormRef} className="mt-5 overflow-hidden">
              {registerError && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {registerError}
                </p>
              )}
              <form className="space-y-3" onSubmit={handleRegister}>
                <div className="reg-field space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="reg-name">Name</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:border-[#0052FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/10"
                    id="reg-name"
                    placeholder="Full name"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="reg-field space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="reg-email">Email</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:border-[#0052FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/10"
                    id="reg-email"
                    type="email"
                    placeholder="teacher@university.edu"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="reg-field space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="reg-password">Password</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:border-[#0052FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/10"
                    id="reg-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="reg-field w-full rounded-full bg-[#0052FF] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-600 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
                  disabled={loading}
                >
                  Create Teacher Account
                </button>
              </form>
            </div>
          )}

          {/* Student registration form */}
          {mode === "student" && (
            <div ref={studentFormRef} className="mt-5 overflow-hidden">
              {studentError && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                  {studentError}
                </p>
              )}
              <form className="space-y-3" onSubmit={handleStudentRegister}>
                <div className="reg-field space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="stu-name">Name</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:border-[#0052FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/10"
                    id="stu-name"
                    placeholder="Full name"
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="reg-field space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="stu-roll">Roll No</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:border-[#0052FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/10"
                    id="stu-roll"
                    placeholder="e.g. CS2024001"
                    value={studentForm.roll_no}
                    onChange={(e) => setStudentForm({ ...studentForm, roll_no: e.target.value })}
                    required
                  />
                </div>
                <div className="reg-field space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="stu-email">Email</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:border-[#0052FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/10"
                    id="stu-email"
                    type="email"
                    placeholder="student@university.edu"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="reg-field space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="stu-password">Password</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:border-[#0052FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/10"
                    id="stu-password"
                    type="password"
                    placeholder="••••••••"
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="reg-field space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="stu-year">Year</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition focus:border-[#0052FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052FF]/10"
                    id="stu-year"
                    value={studentForm.year}
                    onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                    required
                  >
                    <option value="">Select year</option>
                    <option value="1">First Year</option>
                    <option value="2">Second Year</option>
                    <option value="3">Third Year</option>
                    <option value="4">Fourth Year</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="reg-field w-full rounded-full bg-[#0052FF] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-600 hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
                  disabled={loading}
                >
                  Create Student Account
                </button>
              </form>
            </div>
          )}

          {mode === "login" && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Choose a role above to register.
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          © 2026 EduHub · College Management System
        </p>
      </div>
    </div>
  );
};

export default Login;
