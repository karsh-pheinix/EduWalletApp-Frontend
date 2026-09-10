import { useState, useEffect } from "react";
import { apiGet, apiPut } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import "./ProfilePage.css";

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiGet("/Profile");
        setProfile(data);
        setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          city: data.city,
          yearOfStudy: data.yearOfStudy,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    setSaved(false);

    try {
      await apiPut("/Profile", {
        ...form,
        yearOfStudy: parseInt(form.yearOfStudy, 10),
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppLayout><div className="profile-state-message">Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="profile-page">
        <header className="profile-header">
          <h1 className="profile-title">Profile</h1>
        </header>

        {error && <div className="profile-error-banner">{error}</div>}
        {saved && <div className="profile-success-banner">Profile updated.</div>}

        <div className="profile-card">
          <p className="profile-readonly-row">
            <span>Email</span>
            <span>{profile.email}</span>
          </p>
          <p className="profile-readonly-row">
            <span>Student number</span>
            <span>{profile.studentIdNumber}</span>
          </p>
          <p className="profile-readonly-row">
            <span>University</span>
            <span>{profile.university}</span>
          </p>
          <p className="profile-readonly-row">
            <span>Archetype</span>
            <span>{profile.archetype || "Not yet determined"}</span>
          </p>

          <form onSubmit={handleSave} className="profile-form">
            <div className="profile-form-row">
              <div className="profile-field">
                <label className="profile-field-label">First name</label>
                <input
                  className="profile-input"
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="profile-field">
                <label className="profile-field-label">Last name</label>
                <input
                  className="profile-input"
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="profile-form-row">
              <div className="profile-field">
                <label className="profile-field-label">City</label>
                <input
                  className="profile-input"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  required
                />
              </div>
              <div className="profile-field">
                <label className="profile-field-label">Year of study</label>
                <input
                  className="profile-input"
                  type="number"
                  value={form.yearOfStudy}
                  onChange={(e) => setForm((p) => ({ ...p, yearOfStudy: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button type="submit" className="profile-primary-btn" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

export default ProfilePage;