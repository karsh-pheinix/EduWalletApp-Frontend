import { useState } from "react";
import { apiPost } from "../../services/apiClient";

function SavingsGoalStep({ onNext, onBack, totalMonthlyIncome }) {
  const [percentage, setPercentage] = useState(10);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const savingsAmount = totalMonthlyIncome * (percentage / 100);

  async function saveGoal(value) {
    setError("");
    setLoading(true);

    try {
      await apiPost("/Onboarding/savings-goal", { percentage: value });
      onNext();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    saveGoal(percentage);
  }

  function handleSkip() {
    saveGoal(0);
  }

  return (
    <div>
      <h2 className="onboarding-step-title">Set a savings goal</h2>
      <p className="onboarding-step-subtitle">
        We suggest starting at 10% — you can always adjust this later.
      </p>

      {error && <div className="onboarding-error-banner">{error}</div>}

      <div className="onboarding-savings-display">
        <div className="onboarding-savings-label">You would save each month</div>
        <div className="onboarding-savings-percentage">{percentage}%</div>
        <div className="onboarding-savings-amount">
          <strong>R{savingsAmount.toFixed(2)}</strong> from R{totalMonthlyIncome.toFixed(2)} monthly income
        </div>
      </div>

      <input
        type="range"
        className="onboarding-slider"
        min="0"
        max="40"
        step="1"
        value={percentage}
        onChange={(e) => setPercentage(parseInt(e.target.value, 10))}
      />

      <div className="onboarding-button-row">
        <button type="button" className="onboarding-secondary-button" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="onboarding-primary-button"
          onClick={handleContinue}
          disabled={loading}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>

      <button type="button" className="onboarding-skip-link" onClick={handleSkip} disabled={loading}>
        Skip for now
      </button>
    </div>
  );
}

export default SavingsGoalStep;