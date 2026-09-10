import { useState, useEffect } from "react";
import { apiGet, apiPatch, apiDelete } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import "./AppPages.css";

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await apiGet("/Notification");
      setNotifications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id) {
    try {
      await apiPatch(`/Notification/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await apiDelete(`/Notification/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppLayout>
      <div className="app-page page-transition">
        <div className="app-page-header">
          <div>
            <h1 className="app-page-title">Notifications</h1>
            <p className="app-page-subtitle">Budget alerts and account updates.</p>
          </div>
        </div>

        {error && <div className="app-error-banner">{error}</div>}

        <div className="app-panel">
          {loading ? (
            <div className="app-state-message">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="app-empty-state">
              <div className="app-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
              </div>
              <p className="app-empty-title">You're all caught up</p>
              <p className="app-empty-desc">New alerts about your budget and account will show up here.</p>
            </div>
          ) : (
            <div className="app-card-list">
              {notifications.map((n) => (
                <div key={n.id} className={`app-card-item notification-item notification-type-${n.type}`} style={{ opacity: n.isRead ? 0.6 : 1 }}>
                  <div>
                    <p className="app-card-item-title">{n.title}</p>
                    <p className="app-card-item-desc">{n.message}</p>
                    <p className="app-card-item-meta">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="app-table-actions">
                    {!n.isRead && (
                      <button type="button" className="app-table-link-btn" onClick={() => handleMarkRead(n.id)}>Mark read</button>
                    )}
                    <button type="button" className="app-table-link-btn danger" onClick={() => handleDelete(n.id)}>Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default NotificationsPage;