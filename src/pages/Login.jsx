// UI-only login page: handles form input, submit, and redirects.
// Must NOT call APIs directly, store tokens, or manage auth state.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { registerTeacher, registerStudent } from "../api/auth.api";

const roleToPath = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student",
  hod: "/hod",
};

const Login = () => {
  const navigate = useNavigate();
  const { login, user, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [registerStatus, setRegisterStatus] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [studentForm, setStudentForm] = useState({
    name: "",
    roll_no: "",
    email: "",
    password: "",
    year: "",
  });
  const [studentStatus, setStudentStatus] = useState("");
  const [studentError, setStudentError] = useState("");
  const [mode, setMode] = useState("login");

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role) {
      const target = roleToPath[user.role] || "/login";
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
    } catch {
      setError("Login failed. Please check your credentials.");
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
      setRegistering(false);
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
    } catch (err) {
      setStudentError(err.response?.data?.message || "Student registration failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access your dashboard.
          </p>

          {error && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <button
              className="w-full rounded-full bg-[#0052FF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 disabled:opacity-60"
              type="submit"
              disabled={submitting || loading}
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <h2 className="text-lg font-semibold">Create an account</h2>
            <p className="mt-2 text-sm text-slate-500">
              Choose a registration type below.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === "student"
                    ? "bg-blue-50 text-[#0052FF]"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setMode("student")}
              >
                Register as Student
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === "teacher"
                    ? "bg-blue-50 text-[#0052FF]"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setMode("teacher")}
              >
                Register as Teacher
              </button>
            </div>
          </div>

          {mode === "teacher" && (
            <div className="mt-6">
              {registerStatus && (
                <p className="text-sm text-emerald-600">{registerStatus}</p>
              )}
              {registerError && (
                <p className="text-sm text-red-600" role="alert">
                  {registerError}
                </p>
              )}
              <form className="mt-4 space-y-4" onSubmit={handleRegister}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="reg-name">
                    Name
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    id="reg-name"
                    value={registerForm.name}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        name: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="reg-email">
                    Email
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    id="reg-email"
                    type="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        email: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="reg-password">
                    Password
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    id="reg-password"
                    type="password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        password: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-[#0052FF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 disabled:opacity-60"
                  disabled={registering || loading}
                >
                  Create Teacher Account
                </button>
              </form>
            </div>
          )}

          {mode === "student" && (
            <div className="mt-6">
              {studentStatus && (
                <p className="text-sm text-emerald-600">{studentStatus}</p>
              )}
              {studentError && (
                <p className="text-sm text-red-600" role="alert">
                  {studentError}
                </p>
              )}
              <form className="mt-4 space-y-4" onSubmit={handleStudentRegister}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="stu-name">
                    Name
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    id="stu-name"
                    value={studentForm.name}
                    onChange={(event) =>
                      setStudentForm({
                        ...studentForm,
                        name: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="stu-roll">
                    Roll No
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    id="stu-roll"
                    value={studentForm.roll_no}
                    onChange={(event) =>
                      setStudentForm({
                        ...studentForm,
                        roll_no: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="stu-email">
                    Email
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    id="stu-email"
                    type="email"
                    value={studentForm.email}
                    onChange={(event) =>
                      setStudentForm({
                        ...studentForm,
                        email: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="stu-password">
                    Password
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    id="stu-password"
                    type="password"
                    value={studentForm.password}
                    onChange={(event) =>
                      setStudentForm({
                        ...studentForm,
                        password: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="stu-year">
                    Year
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    id="stu-year"
                    type="number"
                    value={studentForm.year}
                    onChange={(event) =>
                      setStudentForm({
                        ...studentForm,
                        year: event.target.value,
                      })
                    }
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-[#0052FF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 disabled:opacity-60"
                  disabled={loading}
                >
                  Create Student Account
                </button>
              </form>
            </div>
          )}

          {mode === "login" && (
            <p className="mt-6 text-sm text-slate-500">
              Select a registration type to begin.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
