import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { apiPost, setAccessToken } from "../services/apiClient";
import LoadingScreen from "../components/LoadingScreen";
import MoneyPic2 from "../assets/MoneyPic2.jpg";
import "./AuthPages.css";

function clearValidity(e) {
  e.currentTarget.setCustomValidity("");
}

function showValidityMessage(e, message) {
  e.currentTarget.setCustomValidity(message);
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const registeredEmail = location.state?.registeredEmail || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiPost("/Auth/login", { email, password });
      setAccessToken(data.accessToken);

      setShowLoadingScreen(true);
      setTimeout(() => {
        navigate(data.onboardingComplete ? "/dashboard" : "/onboarding");
      }, 5000);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (showLoadingScreen) {
    return <LoadingScreen message="Logging you in..." />;
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
          <svg className="float-icon icon-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 10L12 5 2 10l10 5 10-5z" />
            <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" />
          </svg>
          <svg className="float-icon icon-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
          </svg>
          <svg className="float-icon icon-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <svg className="float-icon icon-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 10L12 5 2 10l10 5 10-5z" />
            <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" />
          </svg>
          <svg className="float-icon icon-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
          </svg>
        </div>

        <svg className="auth-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 10L12 5 2 10l10 5 10-5z" strokeLinejoin="round" />
          <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" strokeLinejoin="round" />
        </svg>
        <h1 className="auth-brand-title">EduWallet</h1>
        <p className="auth-brand-tagline">Smart finance for smart students</p>
        <p className="auth-brand-note">Take control of your money.</p>
        <div className="auth-brand-cards">
          <div className="auth-brand-card">TRACK YOUR SPEND</div>
          <div className="auth-brand-card">PLAN YOUR MONTH</div>
          <div className="auth-brand-card">GROW YOUR SAVINGS</div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner login-form-card">
          <h2 className="auth-heading">Already have an account</h2>
          <p className="auth-subheading">Sign in to your EduWallet account</p>

          {registeredEmail && (
            <div className="auth-success-banner" role="status">
              <span className="auth-success-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>
                <strong>Account created successfully.</strong>
                <small>Log in with your new account.</small>
              </span>
            </div>
          )}

          {error && <div className="auth-error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="email">Email</label>
              <input
                id="email"
                className="auth-field-input"
                type="email"
                placeholder="student@university.ac.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onInput={clearValidity}
                onInvalid={(e) => showValidityMessage(e, "Please enter your university email address.")}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-field-label" htmlFor="password">Password</label>
              <div className="auth-field-input-wrap">
                <input
                  id="password"
                  className="auth-field-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onInput={clearValidity}
                  onInvalid={(e) => showValidityMessage(e, "Please enter your password.")}
                  required
                />
                <button
                  type="button"
                  className="auth-field-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="auth-row-between">
              <label className="auth-checkbox-label">
                <input type="checkbox" />
                Remember me
              </label>
              <a className="auth-link" href="#">Forgot password?</a>
            </div>

            <button type="submit" className="auth-primary-button" disabled={loading}>
              {loading ? "Logging in..." : "Login to EduWallet"}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account? <Link className="auth-link" to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;