import { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete, notifyFinancialDataChanged } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import "./AppPages.css";

const FREQUENCY_LABELS = { 0: "Monthly", 1: "Weekly", 2: "Daily", 3: "Once-off" };

function IncomeSourcesPage() {
  const [sources, setSources] = useState([]);
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState(0);
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
      const data = await apiGet("/IncomeSources");
      setSources(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!source || !amount) return;

    setSubmitting(true);
    setError("");
    try {
      await apiPost("/IncomeSources", {
        source,
        amount: parseFloat(amount),
        frequency: parseInt(frequency, 10),
        startDate,
        endDate: endDate || null,
      });
      setSource("");
      setAmount("");
      setFrequency(0);
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
    if (!window.confirm("Remove this income source?")) return;
    try {
      await apiDelete(`/IncomeSources/${id}`);
      setSources((prev) => prev.filter((s) => s.id !== id));
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
            <h1 className="app-page-title">Income Sources</h1>
            <p className="app-page-subtitle">Every place your money comes from, in one list.</p>
          </div>
        </div>

        {error && <div className="app-error-banner">{error}</div>}

        <div className="app-panel">
          <form className="app-inline-form" onSubmit={handleAdd}>
            <div className="app-inline-field">
              <label>Source</label>
              <input className="app-inline-input" value={source} onChange={(e) => setSource(e.target.value)} placeholder="NSFAS" required />
            </div>
            <div className="app-inline-field">
              <label>Amount (R)</label>
              <input className="app-inline-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="app-inline-field">
              <label>Frequency</label>
              <select className="app-inline-select" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                {Object.entries(FREQUENCY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
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
              {submitting ? "Adding..." : "Add Income Source"}
            </button>
          </form>

          {loading ? (
            <div className="app-state-message">Loading...</div>
          ) : sources.length === 0 ? (
            <div className="app-empty-state">
              <div className="app-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 3v18M17 8a5 5 0 00-5-2 3 3 0 000 6 3 3 0 010 6 5 5 0 01-5-2" />
                </svg>
              </div>
              <p className="app-empty-title">No income sources yet</p>
              <p className="app-empty-desc">Add your first source above to start tracking what comes in.</p>
            </div>
          ) : (
            <table className="app-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Frequency</th>
                  <th>Active dates</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id}>
                    <td>{s.source}</td>
                    <td>R{s.amount.toFixed(2)}</td>
                    <td><span className="app-badge app-badge-teal">{FREQUENCY_LABELS[s.frequency]}</span></td>
                    <td>{s.startDate || "—"} — {s.endDate || "Ongoing"}</td>
                    <td className="app-table-actions">
                      <button type="button" className="app-table-link-btn danger" onClick={() => handleDelete(s.id)}>Remove</button>
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

export default IncomeSourcesPage;
