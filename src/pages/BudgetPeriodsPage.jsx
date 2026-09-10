import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiDelete } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import "./AppPages.css";

function BudgetPeriodsPage() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await apiGet("/Budget");
      setBudgets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError("Choose both a start date and an end date.");
      return;
    }
    if (startDate > endDate) {
      setError("The start date must be on or before the end date.");
      return;
    }
    if (budgets.some((budget) => budget.startDate === startDate && budget.endDate === endDate)) {
      setError("A budget period with these dates already exists.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await apiPost("/Budget", { startDate, endDate });
      setStartDate("");
      setEndDate("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this budget period? This removes all its allocations.")) return;
    try {
      await apiDelete(`/Budget/${id}`);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppLayout>
      <div className="app-page page-transition">
        <div className="app-page-header">
          <div>
            <h1 className="app-page-title">Budget Periods</h1>
            <p className="app-page-subtitle">Every budgeting window you've created.</p>
          </div>
        </div>

        {error && <div className="app-error-banner">{error}</div>}

        <div className="app-panel">
          <form className="app-inline-form" onSubmit={handleAdd}>
            <div className="app-inline-field">
              <label>Start date</label>
              <input className="app-inline-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="app-inline-field">
              <label>End date</label>
              <input className="app-inline-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            <button type="submit" className="app-inline-submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Period"}
            </button>
          </form>

          {loading ? (
            <div className="app-state-message">Loading...</div>
          ) : budgets.length === 0 ? (
            <div className="app-empty-state">
              <div className="app-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M3 10h18M8 2v4M16 2v4" />
                </svg>
              </div>
              <p className="app-empty-title">No budget periods yet</p>
              <p className="app-empty-desc">Create your first period above to start allocating funds.</p>
            </div>
          ) : (
            <table className="app-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Savings goal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => (
                  <tr key={b.id}>
                    <td>{b.startDate} — {b.endDate}</td>
                    <td>{b.savingsGoalPercentage}%</td>
                    <td className="app-table-actions">
                      <button type="button" className="app-table-link-btn" onClick={() => navigate(`/budget?budgetId=${b.id}`)}>Open</button>
                      <button type="button" className="app-table-link-btn danger" onClick={() => handleDelete(b.id)}>Delete</button>
                    </td>
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

export default BudgetPeriodsPage;
