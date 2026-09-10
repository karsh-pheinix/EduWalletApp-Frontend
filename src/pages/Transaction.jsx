import { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete, notifyFinancialDataChanged } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import "./AppPages.css";

function TransactionsPage() {
  const [budgets, setBudgets] = useState([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState("");
  const [budgetSummary, setBudgetSummary] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBudgetItemId, setSelectedBudgetItemId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [locationTag, setLocationTag] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [budgetList, categoryList] = await Promise.all([
          apiGet("/Budget"),
          apiGet("/Category"),
        ]);

        setBudgets(budgetList || []);
        setCategories(categoryList || []);

        if ((budgetList || []).length > 0) {
          setSelectedBudgetId(String((budgetList || [])[0].id));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedBudgetId) return;

    async function loadBudgetData() {
      try {
        const [summary, txns] = await Promise.all([
          apiGet(`/Transaction/variance/${selectedBudgetId}`),
          apiGet(`/Transaction?budgetId=${selectedBudgetId}`),
        ]);

        setBudgetSummary(Array.isArray(summary) ? summary : []);
        setTransactions(Array.isArray(txns) ? txns : []);
        notifyFinancialDataChanged();
      } catch (err) {
        setBudgetSummary([]);
        setTransactions([]);
      }
    }

    loadBudgetData();
  }, [selectedBudgetId]);

  const resolvedBudgetItem = budgetSummary.find(
    (item) => String(item.id) === String(selectedBudgetItemId)
  );

  async function handleAdd(e) {
    e.preventDefault();
    if (!selectedBudgetId || !selectedBudgetItemId || !amount || !date) return;

    const categoryIdValue = resolvedBudgetItem?.categoryId ?? resolvedBudgetItem?.CategoryId;
    if (!categoryIdValue) {
      setError("Please choose a budgeted category for this period.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await apiPost("/Transaction", {
        budgetAllocationId: parseInt(resolvedBudgetItem.id, 10),
        categoryId: parseInt(categoryIdValue, 10),
        amount: parseFloat(amount),
        date,
        locationTag: locationTag || null,
      });

      setSelectedBudgetItemId("");
      setAmount("");
      setLocationTag("");

      const [summary, txns] = await Promise.all([
        apiGet(`/Transaction/variance/${selectedBudgetId}`),
        apiGet(`/Transaction?budgetId=${selectedBudgetId}`),
      ]);

      setBudgetSummary(Array.isArray(summary) ? summary : []);
      notifyFinancialDataChanged();
      setTransactions(Array.isArray(txns) ? txns : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await apiDelete(`/Transaction/${id}`);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      const summary = await apiGet(`/Transaction/variance/${selectedBudgetId}`);
      setBudgetSummary(Array.isArray(summary) ? summary : []);
      notifyFinancialDataChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleQuickAdd(categoryIdValue) {
    setSelectedBudgetItemId(String(categoryIdValue));
    setTimeout(() => {
      const formEl = document.getElementById("transaction-form");
      if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  return (
    <AppLayout>
      <div className="app-page page-transition">
      <div className="app-page-header">
        <div>
          <h1 className="app-page-title">Transactions</h1>
          <p className="app-page-subtitle">Every logged spend, tagged by category.</p>
        </div>
      </div>

      {error && <div className="app-error-banner">{error}</div>}

      <div className="app-panel">
        <div className="app-inline-form" style={{ alignItems: "end" }}>
          <div className="app-inline-field">
            <label>Current budget</label>
            <select
              className="app-inline-select"
              value={selectedBudgetId}
              onChange={(e) => setSelectedBudgetId(e.target.value)}
            >
              <option value="">Select a budget</option>
              {budgets.map((budget) => (
                <option key={budget.id} value={budget.id}>
                  {budget.startDate} — {budget.endDate}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedBudgetId && (
        <div className="app-panel">
          <div className="app-panel-header">
            <h2>Current budget vs actual</h2>
          </div>

          {budgetSummary.length === 0 ? (
            <div className="app-empty-state">
              <p className="app-empty-title">No budget categories yet</p>
              <p className="app-empty-desc">Add a budget item first to get a budgeted vs actual summary.</p>
            </div>
          ) : (
            <table className="app-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Budgeted</th>
                  <th>Actual</th>
                  <th>Variance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {budgetSummary.map((item) => {
                  const variance = (item.planned || 0) - (item.actual || 0);
                  return (
                    <tr key={item.id}>
                      <td>{item.categoryName}</td>
                      <td>R{Number(item.planned || 0).toFixed(2)}</td>
                      <td>R{Number(item.actual || 0).toFixed(2)}</td>
                      <td className={variance < 0 ? "app-table-muted" : ""}>
                        {variance < 0 ? "-" : "+"}R{Math.abs(variance).toFixed(2)}
                      </td>
                      <td className="app-table-actions">
                        <button
                          type="button"
                          className="app-table-link-btn"
                          onClick={() => handleQuickAdd(item.id)}
                        >
                          Add transaction
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="app-panel">
        <form id="transaction-form" className="app-inline-form" onSubmit={handleAdd}>
          <div className="app-inline-field">
            <label>Budgeted item</label>
            <select
              className="app-inline-select"
              value={selectedBudgetItemId}
              onChange={(e) => {
                const value = e.target.value;
                const item = budgetSummary.find((entry) => String(entry.id) === value);
                setSelectedBudgetItemId(value);
                setAmount(item ? Number(item.planned || 0).toFixed(2) : "");
              }}
              required
            >
              <option value="">Select a budgeted item</option>
              {budgetSummary.map((item) => {
                const itemId = item.id;
                return (
                  <option key={itemId} value={String(itemId)}>
                    {item.categoryName} — budgeted R{Number(item.planned || 0).toFixed(2)}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="app-inline-field">
            <label>Actual amount (R)</label>
            <input className="app-inline-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
          </div>
          <div className="app-inline-field">
            <label>Date</label>
            <input className="app-inline-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="app-inline-field">
            <label>Location (optional)</label>
            <input className="app-inline-input" value={locationTag} onChange={(e) => setLocationTag(e.target.value)} placeholder="Campus cafeteria" />
          </div>
          <button type="submit" className="app-inline-submit" disabled={submitting || !selectedBudgetId || !selectedBudgetItemId}>
            {submitting ? "Logging..." : "Log Transaction"}
          </button>
        </form>

        {loading ? (
          <div className="app-state-message">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="app-empty-state">
            <div className="app-empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 10h18M7 15h2M13 15h4M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
              </svg>
            </div>
            <p className="app-empty-title">No transactions yet</p>
            <p className="app-empty-desc">Log your first transaction above to start tracking spend.</p>
          </div>
        ) : (
          <table className="app-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Location</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="app-table-muted">{t.date}</td>
                  <td>{t.categoryName}</td>
                  <td className="app-table-muted">{t.locationTag || "—"}</td>
                  <td>R{Number(t.amount || 0).toFixed(2)}</td>
                  <td className="app-table-actions">
                    <button type="button" className="app-table-link-btn danger" onClick={() => handleDelete(t.id)}>Delete</button>
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

export default TransactionsPage;