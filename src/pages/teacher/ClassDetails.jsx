// UI-only page for viewing a single class and its sections.
// Must NOT define routes or implement auth logic.
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { listApprovedStudents, listMyClasses } from "../../api/classes.api";

const ClassDetails = () => {
  const { classId } = useParams();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentClass = useMemo(
    () => classes.find((item) => item.id === classId) || null,
    [classes, classId]
  );

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [classesRes, studentsRes] = await Promise.all([
          listMyClasses(),
          listApprovedStudents(classId),
        ]);

        if (isMounted) {
          setClasses(classesRes.data?.classes || []);
          setStudents(studentsRes.data?.students || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load class data.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (classId) {
      void loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [classId]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Class</p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {currentClass?.name || "Class details"}
            </h1>
          </div>
          <Link
            to="/teacher/classes"
            className="text-sm font-medium text-[#0052FF]"
          >
            Back to classes
          </Link>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-900">Name:</span>{" "}
                  {currentClass?.name || "-"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Year:</span>{" "}
                  {currentClass?.year || "-"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Students:</span>{" "}
                  {students.length}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Approved students
              </h2>
              {students.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  No approved students yet.
                </p>
              ) : (
                <ul className="mt-4 space-y-3 text-sm text-slate-700">
                  {students.map((student) => (
                    <li
                      key={student.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2"
                    >
                      <span className="font-medium text-slate-900">
                        {student.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {student.roll_no}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-semibold text-slate-900">Sections</h2>
              <p className="mt-2 text-sm text-slate-500">
                Add attendance, marks, or resources here next.
              </p>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClassDetails;

