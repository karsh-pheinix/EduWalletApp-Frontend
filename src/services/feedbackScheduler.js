const FEEDBACK_SCHEDULE_KEY = "feedbackPromptScheduledAt";
const FEEDBACK_AFTER_ONBOARDING_KEY = "feedbackPromptAfterOnboarding";

export function scheduleFeedbackPrompt() {
  localStorage.setItem(FEEDBACK_SCHEDULE_KEY, String(Date.now() + 2 * 60 * 1000));
  localStorage.removeItem(FEEDBACK_AFTER_ONBOARDING_KEY);
  window.dispatchEvent(new Event("EduWallet:FeedbackScheduled"));
}

export function scheduleFeedbackAfterOnboarding() {
  localStorage.setItem(FEEDBACK_AFTER_ONBOARDING_KEY, "true");
}

export function completeOnboardingFeedbackSchedule() {
  if (localStorage.getItem(FEEDBACK_AFTER_ONBOARDING_KEY) === "true") scheduleFeedbackPrompt();
}

export function getFeedbackScheduleTime() {
  return Number(localStorage.getItem(FEEDBACK_SCHEDULE_KEY) || 0);
}

export function clearFeedbackSchedule() {
  localStorage.removeItem(FEEDBACK_SCHEDULE_KEY);
  localStorage.removeItem(FEEDBACK_AFTER_ONBOARDING_KEY);
}