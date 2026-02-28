// UI-only page for teachers to manage classes.
// Must NOT define routes or implement auth logic.
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { listSubjects, createSubject } from "../../api/subjects.api";
import { createClass } from "../../api/classes.api";
import { useTeacherClasses, invalidateTeacherClasses } from "../../hooks/useTeacherClasses";
import { Link } from "react-router-dom";
import { usePageAnimation } from "../../hooks/usePageAnimation";

const TeacherClasses = () => {
  const [form, setForm] = useState({ name: "", subject_name: "", year: "" });
  const [subjects, setSubjects] = useState([]);
  const { classes, refetch: refetchClasses } = useTeacherClasses();
  const { scopeRef } = usePageAnimation();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSubjects = async () => {
      try {
        const res = await listSubjects();
        if (isMounted) setSubjects(res.data?.subjects || []);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || "Failed to load subjects.");
      }
    };

    loadSubjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("Saving...");
    setError("");

    const trimmedSubject = form.subject_name.trim();
    if (!trimmedSubject) {
      setStatus("");
      setError("Subject name is required.");
      return;
    }

    try {
      const existingSubject = subjects.find(
        (subject) =>
          subject.name?.trim().toLowerCase() === trimmedSubject.toLowerCase()
      );

      const subjectId = existingSubject
        ? existingSubject.id
        : (await createSubject({ name: trimmedSubject })).data?.subject?.id;

      if (!subjectId) {
        setStatus("");
        setError("Failed to resolve subject.");
        return;
      }

      const response = await createClass({
        name: form.name,
        subject_id: subjectId,
        year: Number(form.year),
      });

      invalidateTeacherClasses();
      refetchClasses();

      setForm({ name: "", subject_name: "", year: "" });
      setStatus("Class created.");
    } catch (err) {
      setStatus("");
      setError(err.response?.data?.message || "Failed to create class.");
    }
  };

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">My Classes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create new classes and manage your existing list.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="anim-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Create a class
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add a class for your students.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="class-name">
                  Class name
                </label>
                <input
                  id="class-name"
                  placeholder="Class name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="subject-name">
                  Subject name
                </label>
                <input
                  id="subject-name"
                  list="subject-suggestions"
                  placeholder="Subject name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={form.subject_name}
                  onChange={(e) =>
                    setForm({ ...form, subject_name: e.target.value })
                  }
                  required
                />
                <datalist id="subject-suggestions">
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="class-year">
                  Class year
                </label>
                <select
                  id="class-year"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  required
                >
                  <option value="">Select year</option>
                  <option value="1">1st year</option>
                  <option value="2">2nd year</option>
                  <option value="3">3rd year</option>
                  <option value="4">4th year</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[#0052FF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
              >
                Create class
              </button>
            </form>

            {status && <p className="mt-4 text-sm text-emerald-600">{status}</p>}
            {error && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Your classes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  This list will update as you create new classes.
                </p>
              </div>
            </div>

            {classes.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                No classes yet. Create your first class to see it here.
              </p>
            ) : (
              <ul className="mt-6 space-y-3">
                {classes.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                  >
                    <Link
                      to={`/teacher/classes/${item.id}`}
                      className="block space-y-1"
                    >
                      <div className="font-medium text-slate-900">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        Year: {item.year}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherClasses;
