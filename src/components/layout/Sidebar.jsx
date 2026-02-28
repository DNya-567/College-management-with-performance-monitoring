// Sidebar UI: renders navigation based on the current user's role.
// GSAP is used for entrance animation.
// Must NOT fetch data or contain business logic beyond simple display rules.
import { NavLink, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { roleMenus } from "./RoleMenus";
import gsap from "gsap";

const MIN_WIDTH = 220;
const MAX_WIDTH = 360;
const STORAGE_KEY = "sidebarWidth";

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [width, setWidth] = useState(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(stored) && stored >= MIN_WIDTH && stored <= MAX_WIDTH
      ? stored
      : 260;
  });

  // Track active drag listeners so they can be cleaned up on unmount
  const cleanupRef = useRef(null);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", `${width}px`);
    localStorage.setItem(STORAGE_KEY, String(width));
  }, [width]);

  // Cleanup drag listeners on unmount to prevent detached DOM nodes
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  const sidebarStyle = useMemo(() => ({ width: `${width}px` }), [width]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const handleResize = useCallback((event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;

    const onMouseMove = (moveEvent) => {
      const nextWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, startWidth + (moveEvent.clientX - startX))
      );
      setWidth(nextWidth);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      cleanupRef.current = null;
    };

    // Store cleanup so unmount can remove listeners
    cleanupRef.current = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [width]);

  // ─── GSAP entrance animation ───
  const sidebarRef = useRef(null);

  useLayoutEffect(() => {
    if (!isAuthenticated || !sidebarRef.current) return;

    const ctx = gsap.context(() => {
      // Logo slides down
      gsap.fromTo(
        ".sidebar-logo",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
      );

      // Nav items stagger in
      gsap.fromTo(
        ".sidebar-nav-item",
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.06,
          ease: "power2.out",
          delay: 0.2,
        }
      );

      // Logout button fades up
      gsap.fromTo(
        ".sidebar-logout",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", delay: 0.5 }
      );
    }, sidebarRef);

    return () => ctx.revert();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const items = roleMenus[user?.role] || [];


  return (
    <aside
      ref={sidebarRef}
      className="fixed left-0 top-0 h-screen bg-[#F8F9FB] border-r border-slate-200"
      style={sidebarStyle}
    >
      <div className="relative flex h-full flex-col px-4 py-6">
        <div className="sidebar-logo mb-6">
          <p className="text-xs uppercase tracking-widest text-slate-400">College</p>
          <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
        </div>
        <nav className="flex-1">
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path} className="sidebar-nav-item">
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition",
                        isActive
                          ? "bg-blue-50 text-[#0052FF]"
                          : "text-slate-600 hover:bg-slate-100",
                      ].join(" ")
                    }
                  >
                    {Icon ? (
                      <Icon className="h-4 w-4 text-current" aria-hidden="true" />
                    ) : null}
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-logout mt-4 w-full rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Logout
        </button>
        <div
          role="separator"
          aria-label="Resize sidebar"
          onMouseDown={handleResize}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent"
        />
      </div>
    </aside>
  );
};

export default Sidebar;
