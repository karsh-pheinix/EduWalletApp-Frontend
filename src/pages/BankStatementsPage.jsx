import { useState, useEffect, useRef } from "react";
import { apiGet, apiDelete, getAccessToken, notifyFinancialDataChanged } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import "./AppPages.css";

function BankStatementsPage() {
  const [statements, setStatements] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [selectedStatementId, setSelectedStatementId] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await apiGet("/BankStatement");
      setStatements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();
    const fileType = extension === "csv" ? 0 : 1; // matches StatementFileType.Csv = 0, Pdf = 1 — confirm enum order

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("FileType", fileType);

      const res = await fetch("http://localhost:5199/api/BankStatement/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setInsights(data.insights || null);
      setSelectedStatementId(data.statementId || null);
      await load();
      notifyFinancialDataChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function viewInsights(statement) {
    setInsightsLoading(true);
    setError("");
    try {
      const data = await apiGet(`/BankStatement/${statement.id}/insights`);
      setInsights(data);
      setSelectedStatementId(statement.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setInsightsLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this statement?")) return;
    try {
      await apiDelete(`/BankStatement/${id}`);
      setStatements((prev) => prev.filter((s) => s.id !== id));
      notifyFinancialDataChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppLayout>
      <div className="app-page page-transition">
        <div className="app-page-header">
          <div>
            <h1 className="app-page-title">Bank Statements</h1>
            <p className="app-page-subtitle">Upload statements to auto-match your transactions.</p>
          </div>
          <button
            type="button"
            className="app-page-action-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v12M7 8l5-5 5 5M5 21h14" />
            </svg>
            {uploading ? "Uploading..." : "Upload Statement"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.pdf"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
        </div>

        {error && <div className="app-error-banner">{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: insights ? "minmax(0, 1fr) minmax(0, 1.35fr)" : "1fr", gap: "1rem", alignItems: "start" }}>
        {insights && (
          <div className="app-panel" style={{ margin: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <h2 className="app-card-item-title" style={{ marginBottom: "0.75rem" }}>Statement breakdown</h2>
              <button type="button" className="app-table-link-btn" onClick={() => { setInsights(null); setSelectedStatementId(null); }}>Dismiss</button>
            </div>
            <p className="app-card-item-desc" style={{ marginBottom: "1rem" }}>
              {statements.find((statement) => statement.id === selectedStatementId)?.fileName || "Selected statement"}
            </p>
            <p className="app-card-item-desc" style={{ marginBottom: "1rem" }}>
              Total spend: R{Number(insights.totalSpend || 0).toFixed(2)}
              {insights.topCategoryName && <> — biggest category was <strong>{insights.topCategoryName}</strong> at {insights.topCategoryPercentage}%</>}
            </p>
            <div className="app-card-list" style={{ marginBottom: "1rem" }}>
              {(insights.breakdown || []).map((breakdown) => (
                <div key={breakdown.categoryName} className="app-card-item" style={{ alignItems: "center" }}>
                  <div style={{ flex: 1 }}><p className="app-card-item-title">{breakdown.categoryName}</p><div style={{ background: "#eee", borderRadius: 4, height: 6, marginTop: 4 }}><div style={{ background: "#2f7d5f", borderRadius: 4, height: 6, width: `${Math.min(100, breakdown.percentage)}%` }} /></div></div>
                  <div style={{ marginLeft: "1rem", textAlign: "right", minWidth: 90 }}><p className="app-card-item-title">R{Number(breakdown.amount || 0).toFixed(2)}</p><p className="app-card-item-desc">{breakdown.percentage}%</p></div>
                </div>
              ))}
            </div>
            {insights.habitTips?.length > 0 && <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>{insights.habitTips.map((tip, index) => <li key={index} className="app-card-item-desc" style={{ marginBottom: "0.4rem" }}>{tip}</li>)}</ul>}
          </div>
        )}
        <div className="app-panel" style={{ margin: 0 }}>
          {loading ? (
            <div className="app-state-message">Loading...</div>
          ) : statements.length === 0 ? (
            <div className="app-empty-state">
              <div className="app-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 3v5h5M6 3h8l6 6v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
                </svg>
              </div>
              <p className="app-empty-title">No statements uploaded</p>
              <p className="app-empty-desc">Upload a CSV or PDF bank statement to get started.</p>
            </div>
          ) : (
            <table className="app-table">
              <thead>
                <tr>
                  <th>File name</th>
                  <th>Type</th>
                  <th>Transactions found</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {statements.map((s) => (
                  <tr key={s.id}>
                    <td>{s.fileName}</td>
                    <td><span className="app-badge app-badge-teal">{s.fileType === 0 ? "CSV" : "PDF"}</span></td>
                    <td>{s.transactionCount ?? 0}</td>
                    <td className="app-table-actions">
                      <button type="button" className="app-table-link-btn" onClick={() => viewInsights(s)} disabled={insightsLoading} title="View statement breakdown" aria-label={`View breakdown for ${s.fileName}`}>
                        {insightsLoading && selectedStatementId === s.id ? "..." : "👁"}
                      </button>
                      <button type="button" className="app-table-link-btn danger" onClick={() => handleDelete(s.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default BankStatementsPage;