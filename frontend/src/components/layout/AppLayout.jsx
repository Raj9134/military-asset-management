import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import { can, initialsOf } from "../../utils/permissions.js";
import { ROLE_LABELS } from "../../constants/options.js";
import { Button } from "../ui/index.jsx";

/**
 * Navigation is filtered by permission so that a role is not offered screens it
 * cannot use. This is presentation only: each of these endpoints independently
 * refuses the request from the backend.
 */
const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard", icon: "▤", permission: "dashboard:read" }],
  },
  {
    label: "Movements",
    items: [
      { to: "/purchases", label: "Purchases", icon: "⬇", permission: "purchases:read" },
      { to: "/transfers", label: "Transfers", icon: "⇄", permission: "transfers:read" },
      { to: "/movements", label: "Assignments & Expenditures", icon: "⇥", permission: "assignments:read" },
    ],
  },
  {
    label: "Accountability",
    items: [{ to: "/audit-logs", label: "Audit Logs", icon: "☰", permission: "audit:read" }],
  },
  {
    label: "Administration",
    items: [
      { to: "/users", label: "Users", icon: "◍", permission: "users:read" },
      { to: "/bases", label: "Bases", icon: "⌂", permission: "bases:read" },
      { to: "/equipment-types", label: "Equipment Types", icon: "⚙", permission: "equipment:read" },
    ],
  },
];

function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(user.role, item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      {open ? <div className="sidebar-backdrop" onClick={onClose} /> : null}
      <aside className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar-brand">
          <strong>MAMS</strong>
          <span>Asset Management</span>
        </div>

        <nav className="sidebar-nav">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="sidebar-section">{group.label}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                  onClick={onClose}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user.base?.name || "All bases"}
          <br />
          Signed in as {ROLE_LABELS[user.role] || user.role}
        </div>
      </aside>
    </>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="btn btn-ghost btn-sm menu-toggle"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <span className="muted small">Military Asset Management System</span>
          </div>

          <div className="topbar-right">
            <div className="user-chip">
              <div className="user-chip-text">
                <div className="user-chip-name">{user.name}</div>
                <div className="user-chip-role">{ROLE_LABELS[user.role] || user.role}</div>
              </div>
              <div className="avatar" title={user.email}>
                {initialsOf(user.name)}
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
