import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiPost } from "../services/apiClient";
import MoneyPic2 from "../assets/MoneyPic2.jpg";
import "./AuthPages.css";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email || !token) {
      setError("This reset link is missing required information.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await apiPost("/Auth/reset-password", {
        email,
        token,
        newPassword,
      });

      alert(data?.message || "Password reset successful.");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Unable to reset password.");
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
        <svg className="auth-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 10L12 5 2 10l10 5 10-5z" strokeLinejoin="round" />
          <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" strokeLinejoin="round" />
        </svg>
        <h1 className="auth-brand-title">EduWallet</h1>
        <p className="auth-brand-tagline">Reset your password</p>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner login-form-card">
          <h2 className="auth-heading">Create a new password</h2>
          <p className="auth-subheading">Choose a new password for {email || "your account"}.</p>

          {error && <div className="auth-error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="newPassword">New password</label>
              <div className="auth-field-input-wrap">
                <input
                  id="newPassword"
                  className="auth-field-input"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
                <button type="button" className="auth-field-toggle" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-field-label" htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                className="auth-field-input"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
              />
            </div>

            <button type="submit" className="auth-primary-button" disabled={loading}>
              {loading ? "Resetting..." : "Reset password"}
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

export default ResetPasswordPage;
