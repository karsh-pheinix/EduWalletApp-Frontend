import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiPost } from "../services/apiClient";
import LoadingScreen from "../components/LoadingScreen";
import MoneyPic2 from "../assets/MoneyPic2.jpg";
import "./AuthPages.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_NUMBER_PATTERN = /^[A-Za-z0-9]{6,12}$/;

function clearValidity(e) {
  e.currentTarget.setCustomValidity("");
}

function showValidityMessage(e, message) {
  e.currentTarget.setCustomValidity(message);
}

function getTextError(value, label, { minLength = 2 } = {}) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length < minLength) return `${label} must be at least ${minLength} characters long.`;
  return "";
}

function getEmailError(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "Email is required.";
  if (!EMAIL_PATTERN.test(trimmed)) return "Email is invalid. Use the format name@domain.com.";
  return "";
}

function getPasswordError(value) {
  const password = String(value ?? "");
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters long.";
  if (!/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one number and one symbol.";
  }
  return "";
}

function getStudentNumberError(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "Student number is required.";
  if (!STUDENT_NUMBER_PATTERN.test(trimmed)) {
    return "Student number can only contain letters and numbers, with no spaces or symbols.";
  }
  return "";
}

function getYearOfStudyError(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "Year of study is required.";
  const numeric = Number(trimmed);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 12) {
    return "Year of study must be a number from 1 to 12.";
  }
  return "";
}

function getDateOfBirthError(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "Date of birth is required.";
  const enteredDate = new Date(trimmed);
  if (Number.isNaN(enteredDate.getTime())) return "Date of birth is invalid.";
  const today = new Date();
  const minimumDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
  if (enteredDate > minimumDate) return "You must be at least 16 years old to create an account.";
  return "";
}

function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
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

  function updateFieldError(fieldName, message) {
    setFieldErrors((prev) => ({ ...prev, [fieldName]: message }));
  }

  function validateRegistrationForm() {
    const nextErrors = {
      firstName: getTextError(form.firstName, "First name"),
      lastName: getTextError(form.lastName, "Last name"),
      email: getEmailError(form.email),
      password: getPasswordError(form.password),
      studentIdNumber: getStudentNumberError(form.studentIdNumber),
      university: getTextError(form.university, "University"),
      city: getTextError(form.city, "City"),
      dateOfBirth: getDateOfBirthError(form.dateOfBirth),
      yearOfStudy: getYearOfStudyError(form.yearOfStudy),
    };

    setFieldErrors(nextErrors);

    const invalidField = Object.entries(nextErrors).find(([, value]) => value)?.[0];
    if (invalidField) {
      const input = document.getElementById(invalidField);
      if (input) {
        input.setCustomValidity(nextErrors[invalidField]);
        input.reportValidity();
      }
      setError("Please fix the highlighted fields before continuing.");
      return false;
    }

    setError("");
    return true;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      const nextValue = {
        firstName: getTextError(value, "First name"),
        lastName: getTextError(value, "Last name"),
        email: getEmailError(value),
        password: getPasswordError(value),
        studentIdNumber: getStudentNumberError(value),
        university: getTextError(value, "University"),
        city: getTextError(value, "City"),
        dateOfBirth: getDateOfBirthError(value),
        yearOfStudy: getYearOfStudyError(value),
      }[name];

      updateFieldError(name, nextValue);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateRegistrationForm()) return;
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
                  autoComplete="given-name"
                  placeholder="Lindiwe"
                  value={form.firstName}
                  aria-invalid={Boolean(fieldErrors.firstName)}
                  onChange={handleChange}
                  onBlur={(e) => updateFieldError("firstName", getTextError(e.target.value, "First name"))}
                  onInput={clearValidity}
                  onInvalid={(e) => showValidityMessage(e, getTextError(e.target.value, "First name"))}
                  required
                />
                {fieldErrors.firstName && <div className="auth-field-error">{fieldErrors.firstName}</div>}
              </div>
              <div className="auth-field">
                <label className="auth-field-label" htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  className="auth-field-input"
                  name="lastName"
                  autoComplete="family-name"
                  placeholder="Mahlangu"
                  value={form.lastName}
                  aria-invalid={Boolean(fieldErrors.lastName)}
                  onChange={handleChange}
                  onBlur={(e) => updateFieldError("lastName", getTextError(e.target.value, "Last name"))}
                  onInput={clearValidity}
                  onInvalid={(e) => showValidityMessage(e, getTextError(e.target.value, "Last name"))}
                  required
                />
                {fieldErrors.lastName && <div className="auth-field-error">{fieldErrors.lastName}</div>}
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-field-label" htmlFor="email">Email</label>
              <input
                id="email"
                className="auth-field-input"
                type="email"
                name="email"
                autoComplete="username"
                placeholder="student@university.ac.za"
                value={form.email}
                aria-invalid={Boolean(fieldErrors.email)}
                onChange={handleChange}
                onBlur={(e) => updateFieldError("email", getEmailError(e.target.value))}
                onInput={clearValidity}
                onInvalid={(e) => showValidityMessage(e, getEmailError(e.target.value))}
                required
              />
              {fieldErrors.email && <div className="auth-field-error">{fieldErrors.email}</div>}
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
                  aria-invalid={Boolean(fieldErrors.password)}
                  onChange={handleChange}
                  onBlur={(e) => updateFieldError("password", getPasswordError(e.target.value))}
                  onInput={clearValidity}
                  onInvalid={(e) => showValidityMessage(e, getPasswordError(e.target.value))}
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
              {fieldErrors.password && <div className="auth-field-error">{fieldErrors.password}</div>}
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
                  aria-invalid={Boolean(fieldErrors.studentIdNumber)}
                  onChange={handleChange}
                  onBlur={(e) => updateFieldError("studentIdNumber", getStudentNumberError(e.target.value))}
                  onInput={clearValidity}
                  onInvalid={(e) => showValidityMessage(e, getStudentNumberError(e.target.value))}
                  required
                />
                {fieldErrors.studentIdNumber && <div className="auth-field-error">{fieldErrors.studentIdNumber}</div>}
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
                  aria-invalid={Boolean(fieldErrors.yearOfStudy)}
                  onChange={handleChange}
                  onBlur={(e) => updateFieldError("yearOfStudy", getYearOfStudyError(e.target.value))}
                  onInput={clearValidity}
                  onInvalid={(e) => showValidityMessage(e, getYearOfStudyError(e.target.value))}
                  required
                />
                {fieldErrors.yearOfStudy && <div className="auth-field-error">{fieldErrors.yearOfStudy}</div>}
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
                aria-invalid={Boolean(fieldErrors.university)}
                onChange={handleChange}
                onBlur={(e) => updateFieldError("university", getTextError(e.target.value, "University"))}
                onInput={clearValidity}
                onInvalid={(e) => showValidityMessage(e, getTextError(e.target.value, "University"))}
                required
              />
              {fieldErrors.university && <div className="auth-field-error">{fieldErrors.university}</div>}
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
                  aria-invalid={Boolean(fieldErrors.city)}
                  onChange={handleChange}
                  onBlur={(e) => updateFieldError("city", getTextError(e.target.value, "City"))}
                  onInput={clearValidity}
                  onInvalid={(e) => showValidityMessage(e, getTextError(e.target.value, "City"))}
                  required
                />
                {fieldErrors.city && <div className="auth-field-error">{fieldErrors.city}</div>}
              </div>
              <div className="auth-field">
                <label className="auth-field-label" htmlFor="dateOfBirth">Date of birth</label>
                <input
                  id="dateOfBirth"
                  className="auth-field-input"
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  aria-invalid={Boolean(fieldErrors.dateOfBirth)}
                  onChange={handleChange}
                  onBlur={(e) => updateFieldError("dateOfBirth", getDateOfBirthError(e.target.value))}
                  onInput={clearValidity}
                  onInvalid={(e) => showValidityMessage(e, getDateOfBirthError(e.target.value))}
                  required
                />
                {fieldErrors.dateOfBirth && <div className="auth-field-error">{fieldErrors.dateOfBirth}</div>}
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