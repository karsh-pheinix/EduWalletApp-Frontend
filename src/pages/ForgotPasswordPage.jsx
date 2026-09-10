import { useState } from "react";
import { Link } from "react-router-dom";
import { apiPost } from "../services/apiClient";
import MoneyPic2 from "../assets/MoneyPic2.jpg";
import "./AuthPages.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }

    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await apiPost("/Auth/forgot-password", { email: trimmed });
      setSuccess(data?.message || "If an account exists for that email, a reset link has been sent.");
      setEmail("");
    } catch (err) {
      setError(err.message || "Unable to send a reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <div
        className="auth-brand-panel login-brand-panel"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(15, 184, 163, 0.75) 0%, rgba(16, 166, 146, 0.75) 55%, rgba(10, 143, 126, 0.8) 100%), url(${MoneyPic2})`,
        }}
      >
        <div className="auth-floating-bg" aria-hidden="true">
          <svg className="float-icon icon-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <svg className="auth-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 10L12 5 2 10l10 5 10-5z" strokeLinejoin="round" />
          <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" strokeLinejoin="round" />
        </svg>
        <h1 className="auth-brand-title">EduWallet</h1>
        <p className="auth-brand-tagline">Smart finance for smart students</p>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner login-form-card">
          <h2 className="auth-heading">Forgot password?</h2>
          <p className="auth-subheading">Enter your email and we’ll send a reset link.</p>

          {error && <div className="auth-error-banner">{error}</div>}
          {success && <div className="auth-success-banner" role="status">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="email">Email</label>
              <input
                id="email"
                className="auth-field-input"
                type="email"
                value={email}
                placeholder="student@university.ac.za"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-primary-button" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p className="auth-footer-text">
            <Link className="auth-link" to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
