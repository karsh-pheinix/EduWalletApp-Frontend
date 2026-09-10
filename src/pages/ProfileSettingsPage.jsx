import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPut, clearAccessToken } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import { clearFeedbackSchedule } from "../services/feedbackScheduler";
import "./AppPages.css";

function getRequiredTextError(value, label) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return `${label} is required.`;
  return "";
}

function getYearError(value) {
  if (value === "" || value === null || value === undefined) return "";
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 12) {
    return "Year of study must be a number from 1 to 12.";
  }
  return "";
}

function ProfileSettingsPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet("/Profile");
        setProfile(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setCity(data.city || "");
        setYearOfStudy(data.yearOfStudy || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function updateFieldError(field, message) {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  }

  function validateProfileForm() {
    const nextErrors = {
      firstName: getRequiredTextError(firstName, "First name"),
      lastName: getRequiredTextError(lastName, "Last name"),
      yearOfStudy: getYearError(yearOfStudy),
    };
    setFieldErrors(nextErrors);

    const invalidField = Object.entries(nextErrors).find(([, value]) => value)?.[0];
    if (invalidField) {
      const input = document.getElementById(invalidField);
      if (input) {
        input.setCustomValidity(nextErrors[invalidField]);
        input.reportValidity();
      }
      setError("Please fix the highlighted profile field.");
      return false;
    }

    setError("");
    return true;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validateProfileForm()) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await apiPut("/Profile", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        city: city.trim(),
        yearOfStudy: yearOfStudy ? parseInt(yearOfStudy, 10) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    clearAccessToken();
    localStorage.removeItem("isAdmin");
    clearFeedbackSchedule();
    navigate("/");
  }

  if (loading) {
    return <div className="app-state-message">Loading profile...</div>;
  }

  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "?";

  return (
    <AppLayout>
      <div className="app-page page-transition">
        <div className="app-page-header">
          <div>
            <h1 className="app-page-title">Profile & Settings</h1>
            <p className="app-page-subtitle">Manage your account details.</p>
          </div>
        </div>

        {error && <div className="app-error-banner">{error}</div>}
        {saved && (
          <div style={{ background: "#f0faf8", border: "1px solid #cdeee7", color: "#0a9a88", padding: "0.65rem 0.85rem", borderRadius: 8, marginBottom: "1.25rem", fontSize: "0.85rem" }}>
            Changes saved.
          </div>
        )}

        <div className="app-panel">
          <div className="app-profile-header">
            <div className="app-profile-avatar">{initials}</div>
            <div>
              <p className="app-profile-name">{firstName} {lastName}</p>
              <p className="app-profile-email">{profile?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.1rem" }}>
              <div style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#14151a", marginBottom: "0.4rem" }}>First name</span>
                <input
                  id="firstName"
                  className="app-inline-input"
                  value={firstName}
                  aria-invalid={Boolean(fieldErrors.firstName)}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (fieldErrors.firstName) updateFieldError("firstName", getRequiredTextError(e.target.value, "First name"));
                  }}
                  onBlur={(e) => updateFieldError("firstName", getRequiredTextError(e.target.value, "First name"))}
                  required
                />
                {fieldErrors.firstName && <div className="app-field-error">{fieldErrors.firstName}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#14151a", marginBottom: "0.4rem" }}>Last name</span>
                <input
                  id="lastName"
                  className="app-inline-input"
                  value={lastName}
                  aria-invalid={Boolean(fieldErrors.lastName)}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (fieldErrors.lastName) updateFieldError("lastName", getRequiredTextError(e.target.value, "Last name"));
                  }}
                  onBlur={(e) => updateFieldError("lastName", getRequiredTextError(e.target.value, "Last name"))}
                  required
                />
                {fieldErrors.lastName && <div className="app-field-error">{fieldErrors.lastName}</div>}
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.1rem" }}>
              <div style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#14151a", marginBottom: "0.4rem" }}>City</span>
                <input className="app-inline-input" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#14151a", marginBottom: "0.4rem" }}>Year of study</span>
                <input
                  id="yearOfStudy"
                  className="app-inline-input"
                  type="number"
                  value={yearOfStudy}
                  aria-invalid={Boolean(fieldErrors.yearOfStudy)}
                  onChange={(e) => {
                    setYearOfStudy(e.target.value);
                    if (fieldErrors.yearOfStudy) updateFieldError("yearOfStudy", getYearError(e.target.value));
                  }}
                  onBlur={(e) => updateFieldError("yearOfStudy", getYearError(e.target.value))}
                />
                {fieldErrors.yearOfStudy && <div className="app-field-error">{fieldErrors.yearOfStudy}</div>}
              </div>
            </div>

            <button type="submit" className="app-page-action-btn" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>

        <div className="app-panel">
          <div className="app-card-list">
            <div className="app-card-item">
              <div>
                <p className="app-card-item-title">Log out</p>
                <p className="app-card-item-desc">Sign out of EduWallet on this device.</p>
              </div>
              <button type="button" className="app-table-link-btn danger" onClick={handleLogout}>Log out</button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default ProfileSettingsPage;