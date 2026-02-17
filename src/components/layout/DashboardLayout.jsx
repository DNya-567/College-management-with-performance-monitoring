import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F4F6F8] text-slate-900">
      <div className="flex">
        <Sidebar />
        <main
          className="flex-1 px-6 py-6 lg:px-10 lg:py-8"
          style={{ marginLeft: "var(--sidebar-width, 260px)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
