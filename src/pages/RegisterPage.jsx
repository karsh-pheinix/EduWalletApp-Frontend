import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiPost } from "../services/apiClient";
import LoadingScreen from "../components/LoadingScreen";
import MoneyPic2 from "../assets/MoneyPic2.jpg";
import "./AuthPages.css";

function clearValidity(e) {
  e.currentTarget.setCustomValidity("");
}

function showValidityMessage(e, message) {
  e.currentTarget.setCustomValidity(message);
}

function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    studentIdNumber: "",
    university: "",
    yearOfStudy: "",
    gender: 0,
    dateOfBirth: "",
    city: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiPost("/Auth/register", {
        ...form,
        yearOfStudy: parseInt(form.yearOfStudy, 10),
        gender: parseInt(form.gender, 10),
      });

      setShowLoadingScreen(true);
      setTimeout(() => {
        navigate("/login", { state: { registeredEmail: form.email } });
      }, 5000);
    } catch (err) {
      const duplicateAccountMessage =
        err.status === 409 || /already exists|duplicate|already registered/i.test(err.message)
          ? "An account with these details already exists. Try logging in instead."
          : err.message;
      setError(duplicateAccountMessage);
      setLoading(false);
    }
  }

  if (showLoadingScreen) {
    return <LoadingScreen message="Creating your account..." />;
  }

  return (
    <div className="auth-screen">
      <div
        className="auth-brand-panel register-brand-panel"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(15, 184, 163, 0.75) 0%, rgba(16, 166, 146, 0.75) 55%, rgba(10, 143, 126, 0.8) 100%), url(${MoneyPic2})`,
        }}
      >
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
        <div className="auth-form-inner login-form-card register-form-card">
          <h2 className="auth-heading">Create your account</h2>
          <p className="auth-subheading">Start managing your student finances</p>

          {error && <div className="auth-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="auth-field-row">
              <div className="auth-field">
                <label className="auth-field-label" htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  className="auth-field-input"
                  name="firstName"
                  placeholder="Lindiwe"
                  value={form.firstName}
                  onChange={handleChange}
                  onInput={clearValidity}
                  onInvalid={(e) => showValidityMessage(e, "Please enter your first name.")}
                  required
                />
              </div>
              <div className="auth-field">
                <label className="auth-field-label" htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  className="auth-field-input"
                  name="lastName"
                  placeholder="Mahlangu"
                  value={form.lastName}
                  onChange={handleChange}
                  onInput={clearValidity}
                  onInvalid={(e) => showValidityMessage(e, "Please enter your last name.")}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-field-label" htmlFor="email">Email</label>
              <input
                id="email"
                className="auth-field-input"
                type="email"
                name="email"
                autoComplete="off"
                placeholder="student@university.ac.za"
                value={form.email}
                onChange={handleChange}
                onInput={clearValidity}
                onInvalid={(e) => showValidityMessage(e, "Please enter a valid university email address.")}
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
                  name="password"
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  onInput={clearValidity}
                  onInvalid={(e) => showValidityMessage(e, "Please create a password.")}
                  required
                />
                <button
                  type="button"
                  className="auth-field-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="auth-password-hint">Use at least 8 characters with a number and a symbol.</p>
            </div>

            <div className="auth-field-row">
              <div className="auth-field">
                <label className="auth-field-label" htmlFor="studentIdNumber">Student number</label>
                <input
                  id="studentIdNumber"
                  className="auth-field-input"
                  name="studentIdNumber"
                  placeholder="S12345678"
                  value={form.studentIdNumber}
                  onChange={handleChange}
                  onInput={clearValidity}
                  onInvalid={(e) => showValidityMessage(e, "Please enter your student number.")}
                  required
                />
              </div>
              <div className="auth-field">
                <label className="auth-field-label" htmlFor="yearOfStudy">Year of study</label>
                <input
                  id="yearOfStudy"
                  className="auth-field-input"
                  type="number"
                  name="yearOfStudy"
                  placeholder="2"
                  value={form.yearOfStudy}
                  onChange={handleChange}
                  onInput={clearValidity}
                  onInvalid={(e) => showValidityMessage(e, "Please enter your year of study.")}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-field-label" htmlFor="university">University</label>
              <input
                id="university"
                className="auth-field-input"
                name="university"
                placeholder="Nelson Mandela University"
                value={form.university}
                onChange={handleChange}
                onInput={clearValidity}
                onInvalid={(e) => showValidityMessage(e, "Please enter your university.")}
                required
              />
            </div>

            <div className="auth-field-row">
              <div className="auth-field">
                <label className="auth-field-label" htmlFor="city">City</label>
                <input
                  id="city"
                  className="auth-field-input"
                  name="city"
                  placeholder="Gqeberha"
                  value={form.city}
                  onChange={handleChange}
                  onInput={clearValidity}
                  onInvalid={(e) => showValidityMessage(e, "Please enter your city.")}
                  required
                />
              </div>
              <div className="auth-field">
                <label className="auth-field-label" htmlFor="dateOfBirth">Date of birth</label>
                <input
                  id="dateOfBirth"
                  className="auth-field-input"
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  onInput={clearValidity}
                  onInvalid={(e) => showValidityMessage(e, "Please enter your date of birth.")}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-primary-button" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account? <Link className="auth-link" to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;