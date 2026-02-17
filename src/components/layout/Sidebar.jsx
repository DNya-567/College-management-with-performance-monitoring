// Sidebar UI: renders navigation based on the current user's role.
// Must NOT fetch data or contain business logic beyond simple display rules.
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { roleMenus } from "./RoleMenus";

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

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", `${width}px`);
    localStorage.setItem(STORAGE_KEY, String(width));
  }, [width]);

  const sidebarStyle = useMemo(() => ({ width: `${width}px` }), [width]);

  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const items = roleMenus[user?.role] || [];

  const handleResize = (event) => {
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
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };


  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-[#F8F9FB] border-r border-slate-200"
      style={sidebarStyle}
    >
      <div className="relative flex h-full flex-col px-4 py-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-slate-400">College</p>
          <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
        </div>
        <nav className="flex-1">
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
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
          className="mt-4 w-full rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
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
