import { useRef, useState } from "react";
import { apiPost } from "../../services/apiClient";

function todayAsDateInput() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

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

function getLabelError(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "Expense label is required.";
  if (trimmed.length < 2) return "Expense label must be at least 2 characters long.";
  return "";
}

function getExpenseAmountError(value) {
  const num = Number(value);
  if (value === "" || value === null || value === undefined) return "Expense amount is required.";
  if (!Number.isFinite(num) || num <= 0) return "Expense amount must be greater than 0.";
  return "";
}

function ExpensesStep({ onNext, onBack }) {
  const addExpenseLocked = useRef(false);
  const [expenses, setExpenses] = useState([
    { id: crypto.randomUUID(), type: 0, label: "", amount: "", frequency: 0, startDate: todayAsDateInput() },
  ]);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(0);

  function updateExpense(index, field, value) {
    setExpenses((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
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

  function validateExpenses() {
    const nextErrors = expenses.map((expense) => ({
      label: getLabelError(expense.label),
      amount: getExpenseAmountError(expense.amount),
    }));

    setFieldErrors(nextErrors);
    const firstIssue = nextErrors.findIndex((entry) => entry.label || entry.amount);
    if (firstIssue >= 0) {
      const row = document.querySelectorAll(".onboarding-income-item")[firstIssue];
      const invalidInput = row?.querySelector("input[aria-invalid='true']") || row?.querySelector("input");
      if (invalidInput) invalidInput.focus();
      setError("Please fix the highlighted expense fields before continuing.");
      return false;
    }

    setError("");
    return true;
  }

  function addExpense() {
    if (addExpenseLocked.current) return;
    addExpenseLocked.current = true;
    setEditingIndex(expenses.length);
    setExpenses((prev) => [...prev, { id: crypto.randomUUID(), type: 3, label: "", amount: "", frequency: 0, startDate: todayAsDateInput() }]);
    window.setTimeout(() => { addExpenseLocked.current = false; }, 250);
  }

  function removeExpense(index) {
    setExpenses((prev) => prev.filter((_, i) => i !== index));
    setFieldErrors((prev) => prev.filter((_, i) => i !== index));
    setEditingIndex((current) => {
      if (current === null || current === index) return null;
      return current > index ? current - 1 : current;
    });
  }

  const runningTotal = expenses.reduce(
    (sum, e) => sum + toMonthlyEquivalent(e.amount, e.frequency),
    0
  );

  async function handleSubmit() {
    if (!validateExpenses()) return;
    setLoading(true);

    try {
      const payload = expenses
        .filter((e) => e.label && e.amount)
        .map((e) => ({
          type: e.type,
          label: e.label.trim(),
          amount: parseFloat(e.amount),
          frequency: e.frequency,
          startDate: e.startDate,
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
        <div className="onboarding-expense-item" key={e.id}>
          <div className="onboarding-income-summary">
            <div>
              <strong>{e.label || TYPE_OPTIONS.find((t) => t.value === e.type)?.label || "Unnamed expense"}</strong>
              <span>R{toMonthlyEquivalent(e.amount, e.frequency).toFixed(2)} monthly · Starts {e.startDate}</span>
            </div>
            <div className="onboarding-income-actions">
              <button type="button" onClick={() => setEditingIndex(i)}>Edit</button>
              <button type="button" onClick={() => removeExpense(i)}>Delete</button>
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="onboarding-add-btn" onClick={addExpense}>
        + Add another expense
      </button>

      {editingIndex !== null && (
        <div className="onboarding-editor-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setEditingIndex(null);
        }}>
          <section className="onboarding-editor-modal" role="dialog" aria-modal="true" aria-labelledby="expense-editor-title">
            <div className="onboarding-editor-modal-header">
              <div>
                <span className="onboarding-editor-kicker">Mandatory expense</span>
                <h3 id="expense-editor-title">{expenses[editingIndex]?.label || "Add expense"}</h3>
              </div>
              <button type="button" className="onboarding-editor-close" onClick={() => setEditingIndex(null)} aria-label="Close expense editor">×</button>
            </div>
            {expenses[editingIndex] && (
              <div className="onboarding-expense-editor">
                <div className="onboarding-field">
                  <label className="onboarding-field-label">Type</label>
                  <select className="onboarding-input" value={expenses[editingIndex].type} onChange={(e) => updateExpense(editingIndex, "type", parseInt(e.target.value, 10))}>
                    {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="onboarding-field">
                  <label className="onboarding-field-label">Label</label>
                  <input className="onboarding-input" placeholder="e.g. Residence rent" value={expenses[editingIndex].label} onChange={(e) => updateExpense(editingIndex, "label", e.target.value)} />
                </div>
                <div className="onboarding-field">
                  <label className="onboarding-field-label">Amount</label>
                  <div className="onboarding-amount-wrap">
                    <span className="onboarding-currency">R</span>
                    <input className="onboarding-input" type="number" placeholder="Enter amount" value={expenses[editingIndex].amount} onChange={(e) => updateExpense(editingIndex, "amount", e.target.value)} />
                  </div>
                </div>
                <div className="onboarding-field">
                  <label className="onboarding-field-label">Frequency</label>
                  <select className="onboarding-input" value={expenses[editingIndex].frequency} onChange={(e) => updateExpense(editingIndex, "frequency", parseInt(e.target.value, 10))}>
                    {FREQUENCY_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div className="onboarding-field onboarding-expense-date-field">
                  <label className="onboarding-field-label">First payment date</label>
                  <input className="onboarding-input" type="date" value={expenses[editingIndex].startDate} onChange={(e) => updateExpense(editingIndex, "startDate", e.target.value)} />
                  <div className="onboarding-field-help">Used for period reports and expense timing.</div>
                </div>
              </div>
            )}
            <button type="button" className="onboarding-primary-button onboarding-editor-save" onClick={() => setEditingIndex(null)}>Save expense</button>
          </section>
        </div>
      )}

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