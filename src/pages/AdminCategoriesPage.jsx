import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiDelete, apiGet, apiPost, apiPut } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import "./AppPages.css";

function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/admin/categories")
      .then((data) => setCategories(data || []))
      .catch((err) => setError(err.message));
  }, []);

  async function create(event) {
    event.preventDefault();
    try { const category = await apiPost("/admin/categories", { name }); setCategories((items) => [...items, category]); setName(""); } catch (err) { setError(err.message); }
  }
  async function toggle(category) {
    try { const updated = await apiPut(`/admin/categories/${category.id}`, { name: category.name, isActive: !category.isActive }); setCategories((items) => items.map((item) => item.id === category.id ? { ...item, ...updated } : item)); } catch (err) { setError(err.message); }
  }
  async function remove(id) {
    try { await apiDelete(`/admin/categories/${id}`); setCategories((items) => items.filter((item) => item.id !== id)); } catch (err) { setError(err.message); }
  }

  return <AppLayout><div className="app-page page-transition admin-page"><div className="app-page-header"><div><p className="app-page-eyebrow">Admin Dashboard / Categories</p><h1 className="app-page-title">Categories</h1><p className="app-page-subtitle">Control the categories available to students.</p></div><Link className="app-page-action-btn" to="/admin">Back to dashboard</Link></div>{error && <div className="app-error-banner">{error}</div>}<section className="app-panel"><div className="app-panel-header"><h2>Category list</h2><form onSubmit={create}><input className="app-inline-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="New category" required /><button className="app-inline-submit" type="submit">Add category</button></form></div><div className="app-table-wrap"><table className="app-table"><thead><tr><th>Name</th><th>Status</th><th></th><th></th></tr></thead><tbody>{categories.map((category) => <tr key={category.id}><td>{category.name}</td><td>{category.isActive ? "Active" : "Inactive"}</td><td><button className="app-table-link-btn" type="button" onClick={() => toggle(category)}>{category.isActive ? "Deactivate" : "Activate"}</button></td><td><button className="app-table-link-btn danger" type="button" onClick={() => remove(category.id)}>Delete</button></td></tr>)}</tbody></table></div></section></div></AppLayout>;
}

export default AdminCategoriesPage;
