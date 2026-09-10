import { useState, useEffect } from "react";
import { apiGet } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import "./AppPages.css";

const FREQUENCY_LABELS = { 0: "Monthly", 1: "Weekly", 2: "Daily", 3: "Once-off" };

function IncomeRecordsPage() {
  const [sources, setSources] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet("/IncomeSources");
        setSources(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function toMonthly(amount, frequency) {
    switch (frequency) {
      case 1: return amount * 4;
      case 2: return amount * 22;
      default: return amount;
    }
  }

  const totalMonthly = sources.reduce((sum, s) => sum + toMonthly(Number(s.amount || 0), s.frequency), 0);
  const incomeColors = ["#4f46e5", "#14b8a6", "#f59e0b", "#a78bfa", "#ef4444", "#10b981", "#f97316"];
  const pieSegments = sources
    .map((s, index) => {
      const value = toMonthly(Number(s.amount || 0), s.frequency);
      const portion = totalMonthly > 0 ? value / totalMonthly : 0;
      return {
        ...s,
        value,
        portion,
        color: incomeColors[index % incomeColors.length],
      };
    })
    .filter((s) => s.value > 0);

  const averageMonthly = sources.length ? totalMonthly / sources.length : 0;
  const largestSource = pieSegments.reduce((max, item) => (item.value > (max?.value || -1) ? item : max), null);
  const circumference = 2 * Math.PI * 42;
  let runningFraction = 0;

  return (
    <AppLayout>
      <div className="app-page page-transition income-page-shell">
        <div className="app-page-header income-page-header">
          <div>
            <div className="income-eyebrow">Financial overview</div>
            <h1 className="app-page-title">Income Records</h1>
            <p className="app-page-subtitle">Total income, this month / this year.</p>
          </div>
        </div>

        {error && <div className="app-error-banner">{error}</div>}

        <div className="income-hero-panel app-panel">
          <div className="income-hero-copy">
            <span className="income-pill">Monthly equivalent</span>
            <h2>R{totalMonthly.toFixed(2)}</h2>
            <p>Income is diversified across {sources.length || 0} sources and tracked against your monthly target.</p>
          </div>
          <div className="income-stat-grid">
            <div className="income-stat-card accent">
              <span className="income-stat-label">Avg. source</span>
              <strong>R{averageMonthly.toFixed(2)}</strong>
            </div>
            <div className="income-stat-card">
              <span className="income-stat-label">Largest source</span>
              <strong>{largestSource ? largestSource.source : "—"}</strong>
            </div>
            <div className="income-stat-card">
              <span className="income-stat-label">Sources</span>
              <strong>{sources.length}</strong>
            </div>
          </div>
        </div>

        <div className="income-dashboard-grid">
          <div className="app-panel income-chart-panel">
            <div className="app-panel-header">
              <h2>Income Mix</h2>
            </div>
            <div className="income-chart-layout">
              <div className="income-chart-wrap">
                <svg viewBox="0 0 140 140" width="190" height="190" aria-label="Income distribution pie chart">
                  <defs>
                    <linearGradient id="incomeChartGlow" x1="0%" x2="100%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                  <circle cx="70" cy="70" r="42" fill="none" stroke="#edf1f5" strokeWidth="24" />
                  {pieSegments.map((source, index) => {
                    const dashLength = Math.max(1, source.portion * circumference);
                    const offset = -runningFraction * circumference;
                    runningFraction += source.portion;

                    return (
                      <circle
                        key={source.id ?? `${source.source}-${index}`}
                        cx="70"
                        cy="70"
                        r="42"
                        fill="none"
                        stroke={source.color}
                        strokeWidth="24"
                        strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                        strokeDashoffset={offset}
                        transform="rotate(-90 70 70)"
                      />
                    );
                  })}
                  <circle cx="70" cy="70" r="28" fill="#ffffff" />
                </svg>
                <div className="income-chart-center">
                  <span>R{totalMonthly.toFixed(2)}</span>
                  <small>monthly</small>
                </div>
              </div>

              <div className="income-legend">
                {pieSegments.length === 0 ? (
                  <p className="income-empty-copy">No income data available yet.</p>
                ) : (
                  pieSegments.map((source, index) => (
                    <div key={source.id ?? `${source.source}-${index}`} className="income-legend-row">
                      <div className="income-legend-label">
                        <span className="income-swatch" style={{ background: source.color }} />
                        <span>{source.source}</span>
                      </div>
                      <strong>{totalMonthly > 0 ? `${((source.portion || 0) * 100).toFixed(1)}%` : "0%"}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="app-panel income-side-panel">
            <div className="app-panel-header">
              <h2>Highlights</h2>
            </div>
            <div className="income-highlight-list">
              <div className="income-highlight-card success">
                <span>Primary income</span>
                <strong>{largestSource ? largestSource.source : "—"}</strong>
                <em>{largestSource ? `${((largestSource.portion || 0) * 100).toFixed(1)}% of total` : "0% of total"}</em>
              </div>
              <div className="income-highlight-card info">
                <span>Average monthly</span>
                <strong>R{averageMonthly.toFixed(2)}</strong>
                <em>Per income source</em>
              </div>
              <div className="income-highlight-card neutral">
                <span>Income sources</span>
                <strong>{sources.length}</strong>
                <em>Tracked records</em>
              </div>
            </div>
          </div>
        </div>

        <div className="app-panel income-table-panel">
          <div className="app-panel-header">
            <h2>All Sources</h2>
          </div>
          {loading ? (
            <div className="app-state-message">Loading...</div>
          ) : sources.length === 0 ? (
            <div className="app-empty-state">
              <div className="app-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="4" y="5" width="16" height="15" rx="2" />
                  <path d="M8 3v4M16 3v4M4 10h16" />
                </svg>
              </div>
              <p className="app-empty-title">No income records</p>
              <p className="app-empty-desc">Records will appear here once you've added income sources.</p>
            </div>
          ) : (
            <table className="app-table income-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Frequency</th>
                  <th>Monthly equivalent</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="income-source-cell">
                        <span className="income-source-dot" style={{ background: incomeColors[(Number(s.id) || 0) % incomeColors.length] }} />
                        {s.source}
                      </div>
                    </td>
                    <td>R{Number(s.amount || 0).toFixed(2)}</td>
                    <td><span className="app-badge app-badge-teal">{FREQUENCY_LABELS[s.frequency]}</span></td>
                    <td className="income-monthly-value">R{toMonthly(Number(s.amount || 0), s.frequency).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default IncomeRecordsPage;
