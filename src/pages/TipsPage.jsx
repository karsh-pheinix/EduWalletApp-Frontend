import { useState, useEffect } from "react";
import { apiGet } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import "./AppPages.css";

const TIP_CATEGORY_LABELS = { 0: "Saving", 1: "Budgeting", 2: "Student Life", 3: "General" };

function TipsPage() {
  const [tips, setTips] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet("/tips/for-me");
        setTips(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AppLayout>
      <div className="app-page page-transition">
        <div className="app-page-header">
          <div>
            <h1 className="app-page-title">Financial Tips</h1>
            <p className="app-page-subtitle">Bite-sized guidance tailored to how you spend.</p>
          </div>
        </div>

        {error && <div className="app-error-banner">{error}</div>}

        {loading ? (
          <div className="app-state-message">Loading...</div>
        ) : tips.length === 0 ? (
          <div className="app-panel">
            <div className="app-empty-state">
              <div className="app-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8a6 6 0 00-12 0c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
                </svg>
              </div>
              <p className="app-empty-title">No tips yet</p>
              <p className="app-empty-desc">Tips will appear here as content is published.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {tips.map((tip) => (
              <div key={tip.id} className="app-panel" style={{ margin: 0, padding: "1.25rem" }}>
                <span className="app-badge app-badge-teal" style={{ marginBottom: "0.6rem", display: "inline-block" }}>
                  {TIP_CATEGORY_LABELS[tip.category] || "General"}
                </span>
                <p style={{ fontWeight: 700, color: "#14151a", margin: "0 0 0.4rem", fontSize: "0.95rem" }}>{tip.title}</p>
                <p style={{ fontSize: "0.88rem", color: "#4b5157", margin: 0, lineHeight: 1.55 }}>{tip.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default TipsPage;