// UI-only page for students to view approved classes.
// Must NOT define routes or implement auth logic.
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useStudentEnrollments } from "../../hooks/useStudentEnrollments";
import { usePageAnimation } from "../../hooks/usePageAnimation";

const MyClasses = () => {
  const { enrollments, loading, error } = useStudentEnrollments();
  const { scopeRef } = usePageAnimation();

  return (
    <DashboardLayout>
      <div ref={scopeRef} className="space-y-6">
        <div className="anim-item">
          <h1 className="text-2xl font-semibold text-slate-900">My Classes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Classes you are currently enrolled in.
          </p>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        {!loading && !error && (
          <div className="anim-item grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.length === 0 ? (
              <p className="text-sm text-slate-500 col-span-full">
                No approved classes yet. Join a class to get started.
              </p>
            ) : (
              enrollments.map((item) => (
                <div
                  key={item.class_id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {item.class_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.subject_name} · Year {item.year}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {item.teacher_name}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyClasses;
