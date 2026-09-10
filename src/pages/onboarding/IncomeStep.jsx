import { useRef, useState } from "react";
import { apiPost } from "../../services/apiClient";

const FREQUENCY_OPTIONS = [
  { value: 0, label: "Monthly" },
  { value: 1, label: "Weekly" },
  { value: 2, label: "Daily" },
  { value: 3, label: "Once-off" },
];

function todayAsDateInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function toMonthlyEquivalent(amount, frequency) {
  const num = parseFloat(amount) || 0;
  switch (frequency) {
    case 1: return num * 4;
    case 2: return num * 22;
    default: return num;
  }
}

function getSourceError(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "Income source is required.";
  if (trimmed.length < 2) return "Income source must be at least 2 characters long.";
  return "";
}

function getAmountError(value) {
  const num = Number(value);
  if (value === "" || value === null || value === undefined) return "Income amount is required.";
  if (!Number.isFinite(num) || num <= 0) return "Income amount must be greater than 0.";
  return "";
}

function IncomeStep({ onNext }) {
  const addSourceLocked = useRef(false);
  const [sources, setSources] = useState([
    { id: crypto.randomUUID(), source: "", amount: "", frequency: 0, startDate: todayAsDateInput() },
  ]);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(0);

  function updateSource(index, field, value) {
    setSources((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );

    setFieldErrors((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      next[index] = { ...next[index], [field]: "" };
      return next;
    });
  }

  function updateFieldError(index, field, message) {
    setFieldErrors((prev) => {
      const next = [...(prev || [])];
      next[index] = { ...(next[index] || {}), [field]: message };
      return next;
    });
  }

  function validateSources() {
    const nextErrors = sources.map((source) => ({
      source: getSourceError(source.source),
      amount: getAmountError(source.amount),
    }));

    setFieldErrors(nextErrors);
    const firstIssue = nextErrors.findIndex((entry) => entry.source || entry.amount);
    if (firstIssue >= 0) {
      const row = document.querySelectorAll(".onboarding-income-item")[firstIssue];
      const invalidInput = row?.querySelector("input[aria-invalid='true']") || row?.querySelector("input");
      if (invalidInput) invalidInput.focus();
      setError("Please fix the highlighted income entries before continuing.");
      return false;
    }

    setError("");
    return true;
  }

  function addSource() {
    if (addSourceLocked.current) return;
    addSourceLocked.current = true;
    setEditingIndex(sources.length);
    setSources((prev) => [    ...prev, { id: crypto.randomUUID(), source: "", amount: "", frequency: 0, startDate: todayAsDateInput() }]);
    window.setTimeout(() => {
      addSourceLocked.current = false;
    }, 250);
  }

  function removeSource(index) {
    setSources((prev) => prev.filter((_, i) => i !== index));
    setFieldErrors((prev) => prev.filter((_, i) => i !== index));
    setEditingIndex((current) => {
      if (current === null || current === index) return null;
      return current > index ? current - 1 : current;
    });
  }

  const totalMonthly = sources.reduce(
    (sum, s) => sum + toMonthlyEquivalent(s.amount, s.frequency),
    0
  );

  async function handleSubmit() {
    if (!validateSources()) return;
    setLoading(true);

    try {
      const payload = sources
        .filter((s) => s.source && s.amount)
        .map((s) => ({
          source: s.source.trim(),
          amount: parseFloat(s.amount),
          frequency: s.frequency,
          startDate: s.startDate,
        }));

      await apiPost("/Onboarding/income", payload);
      onNext(totalMonthly);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="onboarding-step-title">What's your income?</h2>
      <p className="onboarding-step-subtitle">
        Add each source of income, e.g. NSFAS, part-time work, or family support.
      </p>

      {error && <div className="onboarding-error-banner">{error}</div>}

      <div className="onboarding-income-list">
        {sources.map((s, i) => (
          <div className="onboarding-income-item" key={s.id}>
            <div className="onboarding-income-summary">
              <div>
                <strong>{s.source || "Unnamed income"}</strong>
                <span>R{toMonthlyEquivalent(s.amount, s.frequency).toFixed(2)} monthly · Starts {s.startDate}</span>
              </div>
              <div className="onboarding-income-actions">
                <button type="button" onClick={() => setEditingIndex(i)}>Edit</button>
                <button type="button" onClick={() => removeSource(i)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="onboarding-add-btn" onClick={addSource}>
        + Add another income source
      </button>

      {editingIndex !== null && (
        <div className="onboarding-editor-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setEditingIndex(null);
        }}>
          <section className="onboarding-editor-modal" role="dialog" aria-modal="true" aria-labelledby="income-editor-title">
            <div className="onboarding-editor-modal-header">
              <div>
                <span className="onboarding-editor-kicker">Income source</span>
                <h3 id="income-editor-title">{sources[editingIndex]?.source || "Add income"}</h3>
              </div>
              <button type="button" className="onboarding-editor-close" onClick={() => setEditingIndex(null)} aria-label="Close income editor">×</button>
            </div>
            {sources[editingIndex] && (
              <div className="onboarding-income-editor">
                <div className="onboarding-field">
                  <label className="onboarding-field-label">Source</label>
                  <input className="onboarding-input" placeholder="e.g. NSFAS" value={sources[editingIndex].source}
                    onChange={(e) => updateSource(editingIndex, "source", e.target.value)} />
                </div>
                <div className="onboarding-field">
                  <label className="onboarding-field-label">Amount</label>
                  <div className="onboarding-amount-wrap">
                    <span className="onboarding-currency">R</span>
                    <input className="onboarding-input" type="number" placeholder="Enter amount" value={sources[editingIndex].amount}
                      onChange={(e) => updateSource(editingIndex, "amount", e.target.value)} />
                  </div>
                </div>
                <div className="onboarding-field">
                  <label className="onboarding-field-label">Frequency</label>
                  <select className="onboarding-input" value={sources[editingIndex].frequency}
                    onChange={(e) => updateSource(editingIndex, "frequency", parseInt(e.target.value, 10))}>
                    {FREQUENCY_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div className="onboarding-field onboarding-income-date-field">
                  <label className="onboarding-field-label">First payment date</label>
                  <input className="onboarding-input" type="date" value={sources[editingIndex].startDate}
                    onChange={(e) => updateSource(editingIndex, "startDate", e.target.value)} />
                  <div className="onboarding-field-help">Used for period reports and income timing.</div>
                </div>
              </div>
            )}
            <button type="button" className="onboarding-primary-button onboarding-editor-save" onClick={() => setEditingIndex(null)}>Save source</button>
          </section>
        </div>
      )}

      <div className="onboarding-summary-card">
        <div className="onboarding-summary-row total">
          <span>Total monthly equivalent</span>
          <span>R{totalMonthly.toFixed(2)}</span>
        </div>
      </div>

      <div className="onboarding-button-row">
        <button
          type="button"
          className="onboarding-primary-button"
          onClick={handleSubmit}
          disabled={loading || totalMonthly === 0}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

export default IncomeStep;