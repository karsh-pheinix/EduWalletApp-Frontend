import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../services/apiClient";
import { getFeedbackScheduleTime } from "../services/feedbackScheduler";
import { useLocation } from "react-router-dom";

const FEEDBACK_DISMISSED_KEY = "feedbackPromptDismissedAt";

function FeedbackPopup() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let timerId;

    function scheduleCheck() {
      window.clearTimeout(timerId);
      if (!localStorage.getItem("accessToken")) return;

      const scheduledAt = getFeedbackScheduleTime();
      if (!scheduledAt) return;

      const delay = Math.max(0, scheduledAt - Date.now());
      timerId = window.setTimeout(async () => {
        try {
          const dismissedAt = Number(localStorage.getItem(FEEDBACK_DISMISSED_KEY) || 0);
          if (dismissedAt && Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;

          const result = await apiGet("/feedback/should-prompt");
          const shouldPrompt = typeof result === "boolean" ? result : result?.shouldPrompt;
          const isFinancialWorkflow = ["/budget", "/budget-periods", "/transactions", "/expenses", "/income-sources", "/income-records"].some(
            (path) => location.pathname.startsWith(path)
          );
          if (shouldPrompt && !isFinancialWorkflow) setOpen(true);
        } catch {
          // A feedback prompt must never block the application.
        }
      }, delay);
    }

    scheduleCheck();
    window.addEventListener("EduWallet:FeedbackScheduled", scheduleCheck);
    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener("EduWallet:FeedbackScheduled", scheduleCheck);
    };
  }, [location.pathname]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!rating) return;
    setSaving(true);
    try {
      await apiPost("/feedback", { rating, comment: comment.trim() || null });
      setOpen(false);
      localStorage.setItem(FEEDBACK_DISMISSED_KEY, String(Date.now()));
    } finally {
      setSaving(false);
    }
  }

  function dismiss() {
    localStorage.setItem(FEEDBACK_DISMISSED_KEY, String(Date.now()));
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="feedback-banner" role="dialog" aria-label="Feedback request">
      <form className="feedback-dialog" onSubmit={handleSubmit}>
        <button type="button" className="feedback-close" onClick={dismiss} aria-label="Dismiss feedback">×</button>
        <p className="feedback-kicker">Your experience</p>
        <h2>How is EduWallet working for you?</h2>
        <p className="feedback-copy">A quick rating helps us improve the student money experience.</p>
        <div className="feedback-rating" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" className={value <= rating ? "selected" : ""} onClick={() => setRating(value)} aria-label={`${value} out of 5`} aria-pressed={value === rating}>★</button>
          ))}
        </div>
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Optional comment" maxLength={1000} rows={3} />
        <div className="feedback-actions">
          <button type="button" className="feedback-later" onClick={dismiss}>Not now</button>
          <button className="feedback-submit" type="submit" disabled={!rating || saving}>{saving ? "Sending..." : "Send feedback"}</button>
        </div>
      </form>
    </div>
  );
}

export default FeedbackPopup;