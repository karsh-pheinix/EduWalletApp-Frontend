import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import "./DashboardPage.css";

const ARCHETYPE_INFO = {
  Analyst: { emoji: "🧠", label: "The Analyst" },
  Socialite: { emoji: "🎉", label: "The Socialite: Be Mindful of impulsive expenses" },
  ImpulseBuyer: { emoji: "⚡", label: "The Impulse Buyer" },
  Avoider: { emoji: "🙈", label: "The Avoider" },
};

const FINANCIAL_TIPS = [
  {
    category: "Spend mindfully",
    text: "Give every purchase a pause. Small decisions add up over a month.",
    tone: "teal",
  },
  {
    category: "Build your buffer",
    text: "Aim to keep a little money aside before planning your extras.",
    tone: "gold",
  },
  {
    category: "Make it visible",
    text: "Review your spending regularly so your habits stay easy to understand.",
    tone: "blue",
  },
  {
    category: "Protect your goals",
    text: "Treat your savings target like a regular commitment, not an afterthought.",
    tone: "coral",
  },
];

function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTip, setActiveTip] = useState(0);

  useEffect(() => {
    const tipTimer = window.setInterval(() => {
      setActiveTip((tip) => (tip + 1) % FINANCIAL_TIPS.length);
    }, 6000);

    return () => window.clearInterval(tipTimer);
  }, []);

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await apiGet("/Dashboard/summary");
        setSummary(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();

    window.addEventListener("EduWallet:FinancialDataChanged", loadSummary);
    return () => window.removeEventListener("EduWallet:FinancialDataChanged", loadSummary);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const data = await apiGet("/Profile");
      setProfile(data);
    }

    loadProfile().catch((err) => {
      console.error("Failed to load dashboard profile:", err);
    });
  }, []);

  if (loading) {
    return <div className="dashboard-state-message">Loading your dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-state-message dashboard-error">{error}</div>;
  }

  const archetype = ARCHETYPE_INFO[summary?.archetype] || ARCHETYPE_INFO.Analyst;

  const allocationPercent = summary?.disposableIncome > 0
    ? Math.min(100, (summary.totalBudgeted / summary.disposableIncome) * 100)
    : 0;

  const buckets = (summary?.categoryBreakdown || []).map((allocation) => ({
    name: allocation.categoryName || "Allowance",
    spent: Number(allocation.actualSpent || 0),
    total: Number(allocation.budgeted || 0),
    remaining: Number(allocation.remaining ?? (allocation.budgeted || 0) - (allocation.actualSpent || 0)),
    status: allocation.status || "On Track",
    category: allocation.categoryName || "general",
  }));
  const recentTransactions = summary?.recentTransactions || [];
  const availableToAllocate = (summary?.disposableIncome || 0) - (summary?.totalBudgeted || 0);
  const dailyAllowance = Math.max(0, availableToAllocate / 30);

  return (
    <AppLayout>
      <div className="dashboard">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-greeting">Your Financial Snapshot</p>
            <h1 className="dashboard-title">
              {profile ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim() : "Student"}
            </h1>
            <div className="dashboard-archetype-tag">
              <span>{archetype.emoji}</span>
              {archetype.label}
            </div>
          </div>
        </header>

        

        <div className="dashboard-primary-grid">
          <div className="dashboard-balance-card">
            <p className="dashboard-balance-label">Available to Allocate</p>
            <p className="dashboard-balance-figure">
              R{availableToAllocate.toFixed(2)}
            </p>
            <p className="dashboard-balance-sub">
              R{dailyAllowance.toFixed(2)} per day available to spend based on a 30-day month
            </p>
            <div className="dashboard-progress-track">
              <div className="dashboard-progress-fill" style={{ width: `${allocationPercent}%` }} />
            </div>
            <p className="dashboard-progress-label">
              {allocationPercent.toFixed(0)}% of available funds allocated
            </p>
          </div>

          <section
            className={`dashboard-tip-card dashboard-tip-${FINANCIAL_TIPS[activeTip].tone}`}
            aria-live="polite"
          >
            <div className="dashboard-tip-mark" aria-hidden="true">
              <span className="dashboard-tip-exclamation">!</span>
              <span className="dashboard-tip-exclamation dashboard-tip-exclamation-right">!</span>
              <span className="dashboard-tip-exclamation dashboard-tip-exclamation-left-low">!</span>
              <span className="dashboard-tip-exclamation dashboard-tip-exclamation-right-low">!</span>
              <svg viewBox="0 0 32 32" role="img">
                <path d="M10.5 13.5a5.5 5.5 0 1 1 9.1 4.2c-1.1.9-1.6 1.8-1.6 3.3h-4c0-1.5-.5-2.4-1.6-3.3a5.4 5.4 0 0 1-1.9-4.2Z" />
                <path d="M14 24h4M14.5 27h3M16 21v-4M13.8 13.5l2.2 2.5 2.2-2.5" />
              </svg>
            </div>
            <div className="dashboard-tip-content">
              <p className="dashboard-tip-category">{FINANCIAL_TIPS[activeTip].category}</p>
              <p className="dashboard-tip-text">{FINANCIAL_TIPS[activeTip].text}</p>
            </div>
            <div className="dashboard-tip-progress" aria-hidden="true">
              {FINANCIAL_TIPS.map((tip, index) => (
                <span key={tip.category} className={index === activeTip ? "active" : ""} />
              ))}
            </div>
          </section>
        </div>

        <section className={`dashboard-forecast-card ${summary?.forecastAtRisk ? "at-risk" : ""}`}>
          <div>
            <p className="dashboard-forecast-label">30-day cash-flow forecast</p>
            <p className="dashboard-forecast-figure">
              R{Number(summary?.forecast30DayBalance || 0).toFixed(2)}
            </p>
            <p className="dashboard-forecast-copy">
              Based on average spending of R{Number(summary?.forecastDailySpend || 0).toFixed(2)} per day.
            </p>
          </div>
          <strong>{summary?.forecastAtRisk ? "At risk of running short" : "On track for the next 30 days"}</strong>
        </section>

        <div className="dashboard-quick-actions">
          <button
            type="button"
            className="dashboard-action-btn"
            onClick={() => navigate("/transactions")}
          >
             Log Transaction
          </button>
          <button
            type="button"
            className="dashboard-action-btn"
            onClick={() => navigate("/budget")}
          >
             Budget Planner
          </button>
          <button
            type="button"
            className="dashboard-action-btn dashboard-action-secondary"
            onClick={() => navigate("/reports")}
          >
             Export Statement
          </button>
        </div>

        <section className="dashboard-section">
          <div className="section-header-flex">
            <h2 className="dashboard-section-title">Recent Activity</h2>
            <button className="dashboard-link-btn" onClick={() => navigate("/transactions")}>
              View All
            </button>
          </div>

          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Merchant / Description</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx, idx) => {
                  const category = tx?.categoryName || tx?.category || "General";
                  const status = tx?.status || "Logged";
                  const amount = tx?.amount ?? 0;

                  return (
                    <tr key={tx?.id || idx}>
                      <td>
                        <div className="tx-merchant">{tx?.merchant || "Unknown Merchant"}</div>
                        <div className="tx-id">{tx?.id || `TX-${idx}`}</div>
                      </td>
                      <td>
                        <span className={`badge category-${category.toLowerCase()}`}>
                          {category}
                        </span>
                      </td>
                      <td className="tx-date">{tx?.date || "Recently"}</td>
                      <td>
                        <span className={`status-dot ${status.toLowerCase()}`}>{status}</span>
                      </td>
                      <td className="text-right tx-amount">-R{amount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        

        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Category Summary</h2>
          {buckets.length === 0 ? (
            <p className="dashboard-empty-message">No budget allocations for this period.</p>
          ) : (
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Budgeted</th>
                    <th>Spent</th>
                    <th>Remaining</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {buckets.map((bucket, index) => (
                    <tr key={`${bucket.name}-${index}`}>
                      <td>{bucket.name}</td>
                      <td>R{bucket.total.toFixed(2)}</td>
                      <td>R{bucket.spent.toFixed(2)}</td>
                      <td>R{bucket.remaining.toFixed(2)}</td>
                      <td>{bucket.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </AppLayout>
  );
}

export default DashboardPage;