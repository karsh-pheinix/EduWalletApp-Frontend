import { useState } from "react";
import { apiPost } from "../../services/apiClient";

const TYPE_OPTIONS = [
  { value: 0, label: "Rent" },
  { value: 1, label: "Transport" },
  { value: 2, label: "Tuition" },
  { value: 3, label: "Other" },
];

const FREQUENCY_OPTIONS = [
  { value: 0, label: "Monthly" },
  { value: 1, label: "Daily (×22 working days)" },
  { value: 2, label: "Once-off" },
];

function toMonthlyEquivalent(amount, frequency) {
  const num = parseFloat(amount) || 0;
  if (frequency === 1) return num * 22;
  return num;
}

function ExpensesStep({ onNext, onBack }) {
  const [expenses, setExpenses] = useState([
    { type: 0, label: "", amount: "", frequency: 0 },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateExpense(index, field, value) {
    setExpenses((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  }

  function addExpense() {
    setExpenses((prev) => [...prev, { type: 3, label: "", amount: "", frequency: 0 }]);
  }

  function removeExpense(index) {
    setExpenses((prev) => prev.filter((_, i) => i !== index));
  }

  const runningTotal = expenses.reduce(
    (sum, e) => sum + toMonthlyEquivalent(e.amount, e.frequency),
    0
  );

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const payload = expenses
        .filter((e) => e.label && e.amount)
        .map((e) => ({
          type: e.type,
          label: e.label,
          amount: parseFloat(e.amount),
          frequency: e.frequency,
        }));

      await apiPost("/Onboarding/expenses", payload);
      onNext();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="onboarding-step-title">Mandatory expenses</h2>
      <p className="onboarding-step-subtitle">
        Rent, transport, tuition — the things you have to pay, no matter what.
      </p>

      {error && <div className="onboarding-error-banner">{error}</div>}

      {expenses.map((e, i) => (
        <div className="onboarding-income-item" key={i}>
          <div className="onboarding-field" style={{ maxWidth: "110px" }}>
            <label className="onboarding-field-label">Type</label>
            <select
              className="onboarding-input"
              value={e.type}
              onChange={(ev) => updateExpense(i, "type", parseInt(ev.target.value, 10))}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="onboarding-field">
            <label className="onboarding-field-label">Label</label>
            <input
              className="onboarding-input"
              placeholder="Res rent"
              value={e.label}
              onChange={(ev) => updateExpense(i, "label", ev.target.value)}
            />
          </div>
          <div className="onboarding-field" style={{ maxWidth: "100px" }}>
            <label className="onboarding-field-label">Amount</label>
            <div className="onboarding-amount-wrap">
              <span className="onboarding-currency">R</span>
              <input
                className="onboarding-input"
                type="number"
                placeholder="Enter amount"
                value={e.amount}
                onChange={(ev) => updateExpense(i, "amount", ev.target.value)}
              />
            </div>
          </div>
          <div className="onboarding-field" style={{ maxWidth: "160px" }}>
            <label className="onboarding-field-label">Frequency</label>
            <select
              className="onboarding-input"
              value={e.frequency}
              onChange={(ev) => updateExpense(i, "frequency", parseInt(ev.target.value, 10))}
            >
              {FREQUENCY_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          {expenses.length > 1 && (
            <button
              type="button"
              className="onboarding-remove-btn"
              onClick={() => removeExpense(i)}
              aria-label="Remove expense"
            >
              ×
            </button>
          )}
        </div>
      ))}

      <button type="button" className="onboarding-add-btn" onClick={addExpense}>
        + Add another expense
      </button>

      <div className="onboarding-summary-card">
        <div className="onboarding-summary-row total">
          <span>Total mandatory expenses</span>
          <span>R{runningTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="onboarding-button-row">
        <button type="button" className="onboarding-secondary-button" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="onboarding-primary-button"
          onClick={handleSubmit}
          disabled={loading || runningTotal === 0}
        >
          {loading ? "Saving..." : "Finish onboarding"}
        </button>
      </div>
    </div>
  );
}

export default ExpensesStep;