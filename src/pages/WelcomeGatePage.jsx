import { useNavigate } from "react-router-dom";
import MoneyPic2 from "../assets/MoneyPic2.jpg";
import "./AuthPages.css";

function WelcomeGatePage() {
  const navigate = useNavigate();

  return (
    <div
      className="welcome-gate"
      style={{
  backgroundImage: `linear-gradient(180deg, rgba(15, 184, 163, 0.75) 0%, rgba(16, 166, 146, 0.75) 55%, rgba(10, 143, 126, 0.8) 100%), url(${MoneyPic2})`,
}}
    >
      <header className="welcome-gate-nav">
        <div className="welcome-gate-nav-brand">
          <svg className="welcome-gate-nav-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10L12 5 2 10l10 5 10-5z" strokeLinejoin="round" />
            <path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" strokeLinejoin="round" />
          </svg>
          <div className="welcome-gate-nav-copy">
            <span className="welcome-gate-nav-logo">EduWallet</span>
            <span className="welcome-gate-nav-tagline">Smart finance for smart students.</span>
          </div>
        </div>
        <nav className="welcome-gate-nav-links">
          <a href="#" className="welcome-gate-nav-link">About</a>
          <a href="#" className="welcome-gate-nav-link">Help</a>
          <button
            type="button"
            className="welcome-gate-nav-signup"
            onClick={() => navigate("/login")}
          >
            Log in
          </button>
        </nav>
      </header>

      <div className="welcome-gate-main">
        <div className="welcome-gate-content">
          <h1 className="welcome-gate-title">EduWallet</h1>
          <p className="welcome-gate-body">
            Most students learn to manage money the hard way, after the
            damage is done. EduWallet shows you <strong>where your money
            actually goes</strong>, and flags it before a habit becomes a
            hole.
          </p>
          <button
            type="button"
            className="welcome-gate-button"
            onClick={() => navigate("/login")}
          >
            Continue to login
          </button>
          <p className="welcome-gate-trust">Built for students. Designed for real life.</p>
        </div>

        <div className="welcome-gate-preview" aria-hidden="true">
          <div className="preview-card preview-card-main">
            <p className="preview-label">Available this month</p>
            <p className="preview-figure">R2,770.00</p>
            <div className="preview-bar-track">
              <div className="preview-bar-fill" style={{ width: "62%" }} />
            </div>
            <p className="preview-sub">62% of your income remaining</p>
          </div>

          <div className="preview-card preview-card-float preview-card-float-1">
            <p className="preview-label">
              Savings goal
            </p>
            <p className="preview-figure preview-figure-sm">10% saved</p>
            <p className="preview-sub">On track</p>
          </div>

          <div className="preview-card preview-card-float preview-card-float-2">
            <p className="preview-label">
              <span className="preview-badge">This week</span>
            </p>
            <div className="preview-mini-bars">
              <span style={{ height: "40%" }} />
              <span style={{ height: "70%" }} />
              <span style={{ height: "55%" }} />
              <span style={{ height: "85%" }} />
            </div>
            <p className="preview-sub preview-trend">Spending down 8%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeGatePage;