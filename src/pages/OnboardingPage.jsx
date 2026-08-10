import { useState } from "react";
import { useNavigate } from "react-router-dom";
import WelcomeStep from "./onboarding/WelcomeStep";
import IncomeStep from "./onboarding/IncomeStep";
import SavingsGoalStep from "./onboarding/SavingsGoalStep";
import QuizStep from "./onboarding/QuizStep";
import ExpensesStep from "./onboarding/ExpensesStep";
import "./onboarding/OnboardingWizard.css";

const STEP_LABELS = ["Income", "Savings goal", "Lifestyle quiz", "Expenses"];

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [totalMonthlyIncome, setTotalMonthlyIncome] = useState(0);

  function goNext(monthlyIncome) {
    if (typeof monthlyIncome === "number") {
      setTotalMonthlyIncome(monthlyIncome);
    }

    if (step < STEP_LABELS.length - 1) {
      setStep((s) => s + 1);
    } else {
      navigate("/dashboard");
    }
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  const progressPercent = ((step + 1) / STEP_LABELS.length) * 100;

  return (
    <div className="onboarding-screen">
      <div className="onboarding-brand" aria-label="EduWallet onboarding">
        <svg className="onboarding-brand-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 10L12 5 2 10l10 5 10-5z" strokeLinejoin="round" />
          <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" strokeLinejoin="round" />
        </svg>
        <div>
          <strong>EduWallet</strong>
          <span>Build your money picture</span>
        </div>
      </div>

      <div className="onboarding-progress-wrap">
        <div className="onboarding-progress-label">
          <span>{STEP_LABELS[step]}</span>
          <span>Step {step + 1} of {STEP_LABELS.length}</span>
        </div>
        <div className="onboarding-progress-track">
          <div className="onboarding-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="onboarding-progress-hint">This takes about 2 minutes. You can update these details later.</p>
      </div>

      <div className="onboarding-card">
        <div key={step} className="page-transition">
          {step === 0 && <IncomeStep onNext={goNext} />}
          {step === 1 && (
            <SavingsGoalStep
              onNext={goNext}
              onBack={goBack}
              totalMonthlyIncome={totalMonthlyIncome}
            />
          )}
          {step === 2 && <QuizStep onNext={goNext} />}
          {step === 3 && <ExpensesStep onNext={goNext} onBack={goBack} />}
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;