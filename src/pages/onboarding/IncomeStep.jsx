import { useState } from "react";
import { apiPost } from "../../services/apiClient";

const FREQUENCY_OPTIONS = [
  { value: 0, label: "Monthly" },
  { value: 1, label: "Weekly" },
  { value: 2, label: "Daily" },
  { value: 3, label: "Once-off" },
];

function toMonthlyEquivalent(amount, frequency) {
  const num = parseFloat(amount) || 0;
  switch (frequency) {
    case 1: return num * 4;
    case 2: return num * 22;
    default: return num;
  }
}

function IncomeStep({ onNext }) {
  const [sources, setSources] = useState([
    { source: "", amount: "", frequency: 0 },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateSource(index, field, value) {
    setSources((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function addSource() {
    setSources((prev) => [...prev, { source: "", amount: "", frequency: 0 }]);
  }

  function removeSource(index) {
    setSources((prev) => prev.filter((_, i) => i !== index));
  }

  const totalMonthly = sources.reduce(
    (sum, s) => sum + toMonthlyEquivalent(s.amount, s.frequency),
    0
  );

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const payload = sources
        .filter((s) => s.source && s.amount)
        .map((s) => ({
          source: s.source,
          amount: parseFloat(s.amount),
          frequency: s.frequency,
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
          <div className="onboarding-income-item" key={i}>
            <div className="onboarding-field">
              <label className="onboarding-field-label">Source</label>
              <input
                className="onboarding-input"
                placeholder="e.g. NSFAS"
                value={s.source}
                onChange={(e) => updateSource(i, "source", e.target.value)}
              />
            </div>
            <div className="onboarding-field" style={{ maxWidth: "110px" }}>
              <label className="onboarding-field-label">Amount</label>
              <div className="onboarding-amount-wrap">
                <span className="onboarding-currency">R</span>
                <input
                  className="onboarding-input"
                  type="number"
                  placeholder="Enter amount"
                  value={s.amount}
                  onChange={(e) => updateSource(i, "amount", e.target.value)}
                />
              </div>
            </div>
            <div className="onboarding-field" style={{ maxWidth: "130px" }}>
              <label className="onboarding-field-label">Frequency</label>
              <select
                className="onboarding-input"
                value={s.frequency}
                onChange={(e) => updateSource(i, "frequency", parseInt(e.target.value, 10))}
              >
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            {sources.length > 1 && (
              <button
                type="button"
                className="onboarding-remove-btn"
                onClick={() => removeSource(i)}
                aria-label="Remove income source"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button type="button" className="onboarding-add-btn" onClick={addSource}>
        + Add another income source
      </button>

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