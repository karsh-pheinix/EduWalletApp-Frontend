function WelcomeStep({ onNext, firstName }) {
  return (
    <div className="welcome-step">
      <div className="welcome-peek-wrap" aria-hidden="true">
        <svg className="welcome-illustration" viewBox="0 0 160 200" fill="none">
          <ellipse cx="80" cy="185" rx="55" ry="8" fill="rgba(255,255,255,0.15)" />
          <path d="M40 90 Q40 60 80 60 Q120 60 120 90 L124 175 Q124 185 114 185 L46 185 Q36 185 36 175 Z" fill="#ffffff" />
          <path d="M55 90 L55 175 M105 90 L105 175" stroke="#cdeee7" strokeWidth="2" />
          <circle cx="80" cy="48" r="30" fill="#f2c9a0" />
          <path d="M50 40 Q50 18 80 18 Q110 18 110 40 L110 46 Q100 34 80 34 Q60 34 50 46 Z" fill="#2c2c2a" />
          <rect x="58" y="44" width="20" height="14" rx="7" fill="none" stroke="#2c2c2a" strokeWidth="2" />
          <rect x="82" y="44" width="20" height="14" rx="7" fill="none" stroke="#2c2c2a" strokeWidth="2" />
          <line x1="78" y1="50" x2="82" y2="50" stroke="#2c2c2a" strokeWidth="2" />
          <circle cx="68" cy="51" r="2" fill="#2c2c2a" />
          <circle cx="92" cy="51" r="2" fill="#2c2c2a" />
          <path d="M70 62 Q80 68 90 62" stroke="#a3663f" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      <div className="welcome-content">
        <h2 className="welcome-title">
          Hey{firstName ? `, ${firstName}` : ""}, welcome to EduWallet.
        </h2>
        <p className="welcome-body">
          Most students learn to manage money the hard way, after the damage is done. EduWallet is built to catch that earlier. It shows you where your money actually goes, not where you think it goes, and flags it before a habit becomes a hole.
        </p>
        <p className="welcome-body welcome-body-last">
          Along the way, you will pick up the basics that actually stick, things like reading your own spending patterns, planning around irregular income, and knowing what enough savings looks like for you. Not a lecture, just the numbers, laid out clearly.
        </p>
        <button type="button" className="welcome-primary-button" onClick={onNext}>
          Let's go
        </button>
      </div>
    </div>
  );
}

export default WelcomeStep;