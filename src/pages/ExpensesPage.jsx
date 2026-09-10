import { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete, notifyFinancialDataChanged } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import "./AppPages.css";

const EXPENSE_TYPE_LABELS = { 0: "Rent", 1: "Transport", 2: "Tuition", 3: "Other" };
const EXPENSE_FREQUENCY_LABELS = { 0: "Monthly", 1: "Daily", 2: "Once-off" };

function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [label, setLabel] = useState("");
  const [type, setType] = useState(0);
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState(0);
  const [isMandatory, setIsMandatory] = useState(true);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await apiGet("/Expense");
      setExpenses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!label || !amount) return;

    setSubmitting(true);
    setError("");
    try {
      await apiPost("/Expense", {
        label,
        type: parseInt(type, 10),
        amount: parseFloat(amount),
        frequency: parseInt(frequency, 10),
        isMandatory,
        startDate,
        endDate: endDate || null,
      });
      setLabel("");
      setType(0);
      setAmount("");
      setFrequency(0);
      setIsMandatory(true);
      setStartDate(new Date().toISOString().slice(0, 10));
      setEndDate("");
      await load();
      notifyFinancialDataChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this expense?")) return;
    try {
      await apiDelete(`/Expense/${id}`);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      notifyFinancialDataChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppLayout>
      <div className="app-page page-transition">
        <div className="app-page-header">
          <div>
            <h1 className="app-page-title">Expenses</h1>
            <p className="app-page-subtitle">Track what leaves your account, mandatory or not.</p>
          </div>
        </div>

        {error && <div className="app-error-banner">{error}</div>}

        <div className="app-panel">
          <form className="app-inline-form" onSubmit={handleAdd}>
            <div className="app-inline-field">
              <label>Label</label>
              <input className="app-inline-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Rent" required />
            </div>
            <div className="app-inline-field">
              <label>Type</label>
              <select className="app-inline-select" value={type} onChange={(e) => setType(e.target.value)}>
                {Object.entries(EXPENSE_TYPE_LABELS).map(([val, lbl]) => (
                  <option key={val} value={val}>{lbl}</option>
                ))}
              </select>
            </div>
            <div className="app-inline-field">
              <label>Amount (R)</label>
              <input className="app-inline-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="app-inline-field">
              <label>Frequency</label>
              <select className="app-inline-select" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                {Object.entries(EXPENSE_FREQUENCY_LABELS).map(([val, lbl]) => (
                  <option key={val} value={val}>{lbl}</option>
                ))}
              </select>
            </div>
            <div className="app-inline-field">
              <label>Category</label>
              <select className="app-inline-select" value={isMandatory ? "1" : "0"} onChange={(e) => setIsMandatory(e.target.value === "1")}>
                <option value="1">Mandatory</option>
                <option value="0">Optional</option>
              </select>
            </div>
            <div className="app-inline-field">
              <label>Starts</label>
              <input className="app-inline-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="app-inline-field">
              <label>Ends (optional)</label>
              <input className="app-inline-input" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <button type="submit" className="app-inline-submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Expense"}
            </button>
          </form>

          {loading ? (
            <div className="app-state-message">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="app-empty-state">
              <div className="app-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="6" width="18" height="13" rx="2" />
                  <path d="M3 10h18" />
                </svg>
              </div>
              <p className="app-empty-title">No expenses yet</p>
              <p className="app-empty-desc">Add mandatory and optional expenses to see where your money goes.</p>
            </div>
          ) : (
            <table className="app-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Frequency</th>
                  <th>Category</th>
                  <th>Active dates</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td>{e.label}</td>
                    <td className="app-table-muted">{EXPENSE_TYPE_LABELS[e.type]}</td>
                    <td>R{e.amount.toFixed(2)}</td>
                    <td><span className="app-badge app-badge-teal">{EXPENSE_FREQUENCY_LABELS[e.frequency]}</span></td>
                    <td>
                      <span className={`app-badge ${e.isMandatory ? "app-badge-amber" : "app-badge-gray"}`}>
                        {e.isMandatory ? "Mandatory" : "Optional"}
                      </span>
                    </td>
                    <td>{e.startDate || "—"} — {e.endDate || "Ongoing"}</td>
                    <td className="app-table-actions">
                      <button type="button" className="app-table-link-btn danger" onClick={() => handleDelete(e.id)}>Remove</button>
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

export default ExpensesPage;