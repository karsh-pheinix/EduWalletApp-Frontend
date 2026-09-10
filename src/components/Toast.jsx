import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Toast.css";

export default function Toast() {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    function onCreated(e) {
      const payload = e?.detail || {};
      const message = payload.message || String(payload || "Notification");
      const type = payload.type || (String(message).toLowerCase().includes("over") ? "over" : "info");
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, type }]);
      // auto remove
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 5000);
    }

    window.addEventListener("EduWallet:NotificationCreated", onCreated);
    return () => window.removeEventListener("EduWallet:NotificationCreated", onCreated);
  }, []);

  function remove(id) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="ew-toast-wrap" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`ew-toast ${t.type === 'over' ? 'over' : ''}`}>
          <div className="ew-toast-message">{t.message}</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {t.type === 'over' && (
              <button className="ew-toast-view" onClick={() => navigate('/notifications')}>View</button>
            )}
            <button className="ew-toast-close" onClick={() => remove(t.id)}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}
