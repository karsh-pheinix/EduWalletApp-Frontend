import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiDelete, apiGet, apiPost } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import "./AppPages.css";

const triggerLabels = ["General", "Over budget", "Low savings", "Negative disposable income"];

function AdminTipsPage() {
  const [tips, setTips] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ title: "", content: "", category: 3, triggerType: 0, thresholdPercentage: "", targetCategoryId: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiGet("/admin/tips"), apiGet("/admin/categories")]).then(([tipData, categoryData]) => { setTips(tipData || []); setCategories(categoryData || []); }).catch((err) => setError(err.message));
  }, []);

  async function create(event) {
    event.preventDefault();
    try { const tip = await apiPost("/admin/tips", { ...form, thresholdPercentage: form.thresholdPercentage ? Number(form.thresholdPercentage) : null, targetCategoryId: form.targetCategoryId ? Number(form.targetCategoryId) : null }); setTips((items) => [tip, ...items]); setForm({ title: "", content: "", category: 3, triggerType: 0, thresholdPercentage: "", targetCategoryId: "" }); } catch (err) { setError(err.message); }
  }
  async function remove(id) { try { await apiDelete(`/admin/tips/${id}`); setTips((items) => items.filter((tip) => tip.id !== id)); } catch (err) { setError(err.message); } }

  return <AppLayout><div className="app-page page-transition admin-page"><div className="app-page-header"><div><p className="app-page-eyebrow">Admin Dashboard / Tips</p><h1 className="app-page-title">Financial Tips</h1><p className="app-page-subtitle">Create advice and define when it should appear.</p></div><Link className="app-page-action-btn" to="/admin">Back to dashboard</Link></div>{error && <div className="app-error-banner">{error}</div>}<section className="app-panel"><div className="app-panel-header"><h2>New tip</h2></div><form className="admin-tip-form" onSubmit={create}><input className="app-inline-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Tip title" required /><textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Tip content" rows={4} required /><select className="app-inline-select" value={form.category} onChange={(event) => setForm({ ...form, category: Number(event.target.value) })}><option value={0}>Saving</option><option value={1}>Budgeting</option><option value={2}>Student Life</option><option value={3}>General</option></select><select className="app-inline-select" value={form.triggerType} onChange={(event) => setForm({ ...form, triggerType: Number(event.target.value) })}>{triggerLabels.map((label, index) => <option key={label} value={index}>{label}</option>)}</select>{form.triggerType === 1 && <><input className="app-inline-input" type="number" min="0" max="100" value={form.thresholdPercentage} onChange={(event) => setForm({ ...form, thresholdPercentage: event.target.value })} placeholder="Threshold percentage" /><select className="app-inline-select" value={form.targetCategoryId} onChange={(event) => setForm({ ...form, targetCategoryId: event.target.value })}><option value="">Any category</option>{categories.filter((category) => category.isActive).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></>}<button className="app-inline-submit" type="submit">Create tip</button></form></section><section className="app-panel"><div className="app-panel-header"><h2>Published tips</h2></div><div className="admin-tip-list">{tips.map((tip) => <div className="admin-tip-row" key={tip.id}><strong>{tip.title}</strong><span>{tip.content}</span><small>{triggerLabels[tip.triggerType] || "General"}{tip.thresholdPercentage ? ` at ${tip.thresholdPercentage}%` : ""}</small><button type="button" className="app-table-link-btn danger" onClick={() => remove(tip.id)}>Delete</button></div>)}</div></section></div></AppLayout>;
}

export default AdminTipsPage;
