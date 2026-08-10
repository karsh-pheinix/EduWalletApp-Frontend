import { useState, useEffect } from "react";
import { apiPost } from "../../services/apiClient";

const QUESTIONS = [
  {
    text: "It's Friday night. What are you doing?",
    options: [
      { label: "Staying in, tracking my budget", archetype: 0 },
      { label: "Out with friends, whatever it costs", archetype: 1 },
      { label: "Impulse-booked something fun an hour ago", archetype: 2 },
      { label: "Honestly not sure where my money's going", archetype: 3 },
    ],
  },
  {
    text: "How do you feel checking your bank balance?",
    options: [
      { label: "I check it constantly, I like knowing", archetype: 0 },
      { label: "Fine, spending on people I care about is worth it", archetype: 1 },
      { label: "A bit anxious, surprises happen a lot", archetype: 2 },
      { label: "I try not to look", archetype: 3 },
    ],
  },
  {
    text: "A friend asks to split a spontaneous trip. You...",
    options: [
      { label: "Check my budget first, then decide", archetype: 0 },
      { label: "Say yes immediately, memories matter", archetype: 1 },
      { label: "Say yes without thinking about cost", archetype: 2 },
      { label: "Avoid answering and hope it goes away", archetype: 3 },
    ],
  },
  {
    text: "Which describes your ideal money habit?",
    options: [
      { label: "A clear plan I actually stick to", archetype: 0 },
      { label: "Enough to enjoy time with people", archetype: 1 },
      { label: "Room to say yes to spontaneous things", archetype: 2 },
      { label: "Just... not thinking about it so much", archetype: 3 },
    ],
  },
];

const ARCHETYPE_INFO = {
  0: { name: "The Analyst", emoji: "🧠", desc: "You plan, track, and make deliberate choices with your money." },
  1: { name: "The Socialite", emoji: "🎉", desc: "You value experiences and relationships over strict saving." },
  2: { name: "The Impulse Buyer", emoji: "⚡", desc: "You follow your instincts, sometimes before checking your balance." },
  3: { name: "The Avoider", emoji: "🙈", desc: "Money stress is real, and awareness is the first step forward." },
};

function QuizStep({ onNext }) {
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [archetype, setArchetype] = useState(null);
  const [error, setError] = useState("");

  function selectAnswer(archetypeValue) {
    const updated = [...answers, archetypeValue];
    setAnswers(updated);

    if (currentQuestion < QUESTIONS.length - 1) {
      // Auto-advance for Q1–Q3, matching the spec
      setCurrentQuestion((q) => q + 1);
    } else {
      // Q4 pauses, then submits
      setCalculating(true);
      submitQuiz(updated);
    }
  }

  async function submitQuiz(finalAnswers) {
    setError("");

    try {
      // Brief pause for the "Calculating archetype..." moment
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const data = await apiPost("/Onboarding/quiz", { answerLeanings: finalAnswers });
      setArchetype(data.archetype);
    } catch (err) {
      setError(err.message);
      setCalculating(false);
    }
  }

  if (calculating && !archetype) {
    return (
      <div className="onboarding-calculating">
        <p>Calculating your archetype...</p>
      </div>
    );
  }

  if (archetype) {
    const info = ARCHETYPE_INFO[Object.keys(ARCHETYPE_INFO).find(
      (key) => ARCHETYPE_INFO[key].name.replace("The ", "").replace(" ", "") === archetype ||
               archetype.toLowerCase().includes(ARCHETYPE_INFO[key].name.split(" ")[1].toLowerCase())
    )] || ARCHETYPE_INFO[0];

    return (
      <div className="onboarding-reveal">
        <div className="onboarding-reveal-emoji">{info.emoji}</div>
        <h2 className="onboarding-reveal-title">{info.name}</h2>
        <p className="onboarding-reveal-desc">{info.desc}</p>
        <div className="onboarding-button-row">
          <button type="button" className="onboarding-primary-button" onClick={onNext}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="onboarding-step-title">A few quick questions</h2>
      <p className="onboarding-step-subtitle">This helps us understand your spending style.</p>

      {error && <div className="onboarding-error-banner">{error}</div>}

      <div className="onboarding-quiz-progress">
        {QUESTIONS.map((_, i) => (
          <div key={i} className={`onboarding-quiz-dot ${i <= currentQuestion ? "active" : ""}`} />
        ))}
      </div>

      <p className="onboarding-quiz-question">{QUESTIONS[currentQuestion].text}</p>

      {QUESTIONS[currentQuestion].options.map((opt, i) => (
        <button
          key={i}
          type="button"
          className="onboarding-quiz-option"
          onClick={() => selectAnswer(opt.archetype)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default QuizStep;