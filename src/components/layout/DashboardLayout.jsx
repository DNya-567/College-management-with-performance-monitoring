import { useLayoutEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import gsap from "gsap";

export default function DashboardLayout({ children }) {
  const mainRef = useRef(null);

  useLayoutEffect(() => {
    if (!mainRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-slate-900">
      <div className="flex">
        <Sidebar />
        <main
          ref={mainRef}
          className="flex-1 px-6 py-6 lg:px-10 lg:py-8"
          style={{ marginLeft: "var(--sidebar-width, 260px)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
