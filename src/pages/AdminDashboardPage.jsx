import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch, getAccessToken } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import "./AppPages.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5199/api";

async function downloadActivityCsv() {
  const res = await fetch(`${API_BASE_URL}/admin/activity/export`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  if (!res.ok) throw new Error("Export failed");

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^\"]+)"?/);
  const fileName = match ? match[1] : "activity-log.csv";

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

async function fetchAdminData(searchTerm) {
  const [summaryData, userData, activityData, feedbackData] = await Promise.all([
    apiGet("/admin/summary"),
    apiGet(`/admin/users?search=${encodeURIComponent(searchTerm)}`),
    apiGet("/admin/activity"),
    apiGet("/admin/feedback"),
  ]);
  return { summaryData, userData, activityData, feedbackData };
}

function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  async function loadData(searchTerm = search) {
    try {
      const { summaryData, userData, activityData, feedbackData } = await fetchAdminData(searchTerm);
      setSummary(summaryData);
      setUsers(userData || []);
      setActivity(activityData || []);
      setFeedback(feedbackData || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    fetchAdminData("")
      .then(({ summaryData, userData, activityData, feedbackData }) => {
        setSummary(summaryData);
        setUsers(userData || []);
        setActivity(activityData || []);
        setFeedback(feedbackData || []);
      })
      .catch((err) => setError(err.message));
  }, []);

  async function toggleUser(user) {
    try {
      await apiPatch(`/admin/users/${user.id}/status`, { disabled: !user.isDisabled });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppLayout>
      <div className="app-page page-transition admin-page">
        <div className="app-page-header"><div><p className="app-page-eyebrow">Operations</p><h1 className="app-page-title">Admin dashboard</h1><p className="app-page-subtitle">Monitor accounts, activity, and student feedback.</p></div><div className="admin-content-links"><Link className="app-page-action-btn" to="/admin/categories">Categories</Link><Link className="app-page-action-btn" to="/admin/tips">Tips</Link></div></div>
        {error && <div className="app-error-banner">{error}</div>}
        <div className="admin-stat-grid">
          {[['Users', summary?.totalUsers], ['Active', summary?.activeUsers], ['Disabled', summary?.disabledUsers]].map(([label, value]) => <div className="admin-stat" key={label}><span>{label}</span><strong>{value ?? "-"}</strong></div>)}
          <button type="button" className="admin-stat admin-stat-button" onClick={() => document.getElementById("admin-feedback")?.scrollIntoView({ behavior: "smooth", block: "start" })}><span>Feedback</span><strong>{summary?.feedbackCount ?? "-"}</strong><small>Review submissions</small></button>
        </div>
        <section className="app-panel"><div className="app-panel-header"><h2>Accounts</h2><form onSubmit={(event) => { event.preventDefault(); loadData(); }}><input className="app-inline-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" /></form></div><div className="app-table-wrap"><table className="app-table"><thead><tr><th>Name</th><th>Email</th><th>Student number</th><th>Last active</th><th>Status</th><th></th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.firstName} {user.lastName}</td><td>{user.email}</td><td>{user.studentIdNumber}</td><td>{user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "Never"}</td><td>{user.isDisabled ? "Disabled" : "Active"}</td><td><button type="button" className="app-table-link-btn" onClick={() => toggleUser(user)}>{user.isDisabled ? "Enable" : "Disable"}</button></td></tr>)}</tbody></table></div></section>
        <div className="admin-columns"><section className="app-panel"><div className="app-panel-header"><h2>Recent activity</h2><button type="button" className="app-table-link-btn" onClick={() => downloadActivityCsv().catch((err) => setError(err.message))}>Download full log (.csv)</button></div>{activity.slice(0, 12).map((entry) => <div className="admin-feed-row" key={entry.id}><strong>{entry.action}</strong><span>{entry.email || `User ${entry.userId}`}</span><small>{new Date(entry.createdAt).toLocaleString()}</small></div>)}</section><section className="app-panel" id="admin-feedback"><div className="app-panel-header"><h2>Feedback</h2><span className="admin-panel-count">{feedback.length} submissions</span></div>{feedback.length === 0 ? <div className="app-empty-state">No feedback received yet.</div> : feedback.map((entry) => <button type="button" className="admin-feedback-row" key={entry.id} onClick={() => setSelectedFeedback(entry)}><strong>{"★".repeat(entry.rating)}{"☆".repeat(5 - entry.rating)}</strong><span>{entry.comment || "No comment"}</span><small>{entry.email} · {new Date(entry.createdAt).toLocaleString()}</small><em>View full review</em></button>)}</section></div>
        {selectedFeedback && <div className="feedback-review-backdrop" role="presentation"><div className="feedback-review-dialog" role="dialog" aria-modal="true" aria-labelledby="feedback-review-title"><button type="button" className="feedback-review-close" onClick={() => setSelectedFeedback(null)} aria-label="Close review">×</button><p className="feedback-kicker">Full review</p><h2 id="feedback-review-title">{selectedFeedback.email || `User ${selectedFeedback.userId}`}</h2><strong className="feedback-review-rating">{"★".repeat(selectedFeedback.rating)}{"☆".repeat(5 - selectedFeedback.rating)}</strong><p className="feedback-review-date">Submitted {new Date(selectedFeedback.createdAt).toLocaleString()}</p><p className="feedback-review-comment">{selectedFeedback.comment || "This user did not leave a written note."}</p><button type="button" className="feedback-submit" onClick={() => setSelectedFeedback(null)}>Close review</button></div></div>}
      </div>
    </AppLayout>
  );
}

export default AdminDashboardPage;