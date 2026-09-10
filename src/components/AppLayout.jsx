import { NavLink, useNavigate } from "react-router-dom";
import { clearAccessToken } from "../services/apiClient";
import "./AppLayout.css";
import Toast from "./Toast";
import { hasAdminAccess } from "../services/authUtils";
import { clearFeedbackSchedule } from "../services/feedbackScheduler";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/income-sources", label: "Income Sources" },
  { to: "/income-records", label: "Income Records" },
  { to: "/budget", label: "Budget" },
  { to: "/budget-periods", label: "Budget Periods" },
  { to: "/categories", label: "Categories" },
  { to: "/expenses", label: "Expenses" },
  { to: "/transactions", label: "Transactions" },
  { to: "/bank-statements", label: "Bank Statements" },
  { to: "/reports", label: "Reports" },
  { to: "/tips", label: "Financial Tips" },
  { to: "/notifications", label: "Notifications" },
  { to: "/profile", label: "Settings" },
];

function AppLayout({ children }) {
  const navigate = useNavigate();

  function handleLogout() {
    clearAccessToken();
    localStorage.removeItem("isAdmin");
    clearFeedbackSchedule();
    navigate("/");
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="app-sidebar-mark">
            <path d="M22 10L12 5 2 10l10 5 10-5z" strokeLinejoin="round" />
            <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" strokeLinejoin="round" />
          </svg>
          <span>EduWallet</span>
        </div>

        <nav className="app-sidebar-nav">
          {(hasAdminAccess() ? [
            { to: "/admin", label: "Admin Dashboard" },
            { to: "/profile", label: "Settings" },
          ] : NAV_ITEMS).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `app-sidebar-link ${isActive ? "active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button type="button" className="app-sidebar-logout" onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div className="app-header-actions">
            <button type="button" className="app-profile-btn" onClick={() => navigate("/profile")} title="Profile">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="app-settings-btn" onClick={() => navigate("/profile")} title="Settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 0 1 2.27 16.9l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09c.66 0 1.22-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 0 1 6.9 2.27l.06.06c.5.5 1.2.66 1.82.33.38-.2.8-.33 1.24-.33H11a2 2 0 0 1 4 0h.09c.44 0 .86.13 1.24.33.62.33 1.32.17 1.82-.33l.06-.06A2 2 0 0 1 21.73 7.1l-.06.06c-.53.53-.69 1.25-.33 1.82.2.38.33.8.33 1.24V11a2 2 0 0 1 0 4h-.09c-.66 0-1.22.4-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </header>
        {children}
      </main>
      <Toast />
    </div>
  );
}

export default AppLayout;