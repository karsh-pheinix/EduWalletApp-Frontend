import { useState, useEffect } from "react";
import { apiGet } from "../services/apiClient";
import "./DashboardPage.css";

const ARCHETYPE_INFO = {
  Analyst: { emoji: "🧠", label: "The Analyst" },
  Socialite: { emoji: "🎉", label: "The Socialite" },
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
  const [summary, setSummary] = useState(null);
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
  }, []);

  if (loading) {
    return <div className="dashboard-state-message">Loading your dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-state-message dashboard-error">{error}</div>;
  }

  const archetype = ARCHETYPE_INFO[summary.archetype] || ARCHETYPE_INFO.Analyst;
  const spendPercent = summary.totalIncome > 0
    ? Math.min(100, ((summary.totalIncome - summary.disposableIncome) / summary.totalIncome) * 100)
    : 0;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-greeting">Your financial snapshot</p>
          <h1 className="dashboard-title">Dashboard</h1>
        </div>
        <div className="dashboard-archetype-tag">
          <span>{archetype.emoji}</span>
          {archetype.label}
        </div>
      </header>

      <div className="dashboard-primary-grid">
        <div className="dashboard-balance-card">
          <p className="dashboard-balance-label">Disposable income</p>
          <p className="dashboard-balance-figure">R{summary.disposableIncome.toFixed(2)}</p>
          <p className="dashboard-balance-sub">
            R{summary.dailyEquivalent.toFixed(2)} per day, based on a 22-day working month
          </p>
          <div className="dashboard-progress-track">
            <div
              className="dashboard-progress-fill"
              style={{ width: `${spendPercent}%` }}
            />
          </div>
          <p className="dashboard-progress-label">
            {spendPercent.toFixed(0)}% of income already committed
          </p>
        </div>

        <section className={`dashboard-tip-card dashboard-tip-${FINANCIAL_TIPS[activeTip].tone}`} aria-live="polite">
          <div className="dashboard-tip-mark">i</div>
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

      <div className="dashboard-stat-grid">
        <div className="dashboard-stat-card">
          <p className="dashboard-stat-label">Total income</p>
          <p className="dashboard-stat-figure">R{summary.totalIncome.toFixed(2)}</p>
        </div>
        <div className="dashboard-stat-card">
          <p className="dashboard-stat-label">Savings goal</p>
          <p className="dashboard-stat-figure">R{summary.savingsAmount.toFixed(2)}</p>
        </div>
        <div className="dashboard-stat-card">
          <p className="dashboard-stat-label">Mandatory expenses</p>
          <p className="dashboard-stat-figure">R{summary.totalMandatory.toFixed(2)}</p>
        </div>
        <div className="dashboard-stat-card">
          <p className="dashboard-stat-label">Disposable income</p>
          <p className="dashboard-stat-figure">R{summary.disposableIncome.toFixed(2)}</p>
        </div>
      </div>

      <div className="dashboard-quick-actions">
        <button type="button" className="dashboard-action-btn">Create a budget</button>
        <button type="button" className="dashboard-action-btn">Log a transaction</button>
        <button type="button" className="dashboard-action-btn dashboard-action-secondary">
          View reports
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;