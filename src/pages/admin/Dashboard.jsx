import DashboardLayout from "../../components/layout/DashboardLayout";
import { usePageAnimation } from "../../hooks/usePageAnimation";

export default function AdminDashboard() {
  const { scopeRef } = usePageAnimation();

  return (
    <DashboardLayout>
      <div ref={scopeRef}>
        <h1 className="anim-item text-2xl font-semibold text-slate-900">
          Admin Dashboard
        </h1>
      </div>
    </DashboardLayout>
  );
}
