import { useState, useEffect } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import "./AppPages.css";

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [subInputs, setSubInputs] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await apiGet("/Category");
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const created = await apiPost("/Category", { name: newName });
      setCategories((prev) => [...prev, { ...created, subCategories: [] }]);
      setNewName("");
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setEditingName(c.name);
  }

  async function handleUpdate(id) {
    if (!editingName.trim()) return;
    try {
      const updated = await apiPut(`/Category/${id}`, { name: editingName });
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: updated.name } : c)));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this category?")) return;
    try {
      await apiDelete(`/Category/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddSub(categoryId) {
    const name = subInputs[categoryId];
    if (!name || !name.trim()) return;
    try {
      const created = await apiPost("/SubCategory", { name, categoryId });
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? { ...c, subCategories: [...(c.subCategories || []), created] }
            : c
        )
      );
      setSubInputs((prev) => ({ ...prev, [categoryId]: "" }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteSub(categoryId, subId) {
    try {
      await apiDelete(`/SubCategory/${subId}`);
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? { ...c, subCategories: c.subCategories.filter((sc) => sc.id !== subId) }
            : c
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppLayout>
      <div className="app-page page-transition">
        <div className="app-page-header">
          <div>
            <h1 className="app-page-title">Categories & Sub-categories</h1>
            <p className="app-page-subtitle">Organize how your spending gets grouped.</p>
          </div>
        </div>

        {error && <div className="app-error-banner">{error}</div>}

        <div className="app-panel">
          <form className="app-inline-form" onSubmit={handleAdd}>
            <div className="app-inline-field">
              <label>New category</label>
              <input className="app-inline-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Food" required />
            </div>
            <button type="submit" className="app-inline-submit">Add Category</button>
          </form>

          {loading ? (
            <div className="app-state-message">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="app-empty-state">
              <div className="app-empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <p className="app-empty-title">No categories yet</p>
              <p className="app-empty-desc">Add your first category above to start organizing expenses.</p>
            </div>
          ) : (
            <div className="app-card-list">
              {categories.map((c) => (
                <div key={c.id} className="app-card-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {editingId === c.id ? (
                      <div style={{ display: "flex", gap: "0.5rem", flex: 1 }}>
                        <input className="app-inline-input" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                        <button type="button" className="app-table-link-btn" onClick={() => handleUpdate(c.id)}>Save</button>
                        <button type="button" className="app-table-link-btn danger" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <p className="app-card-item-title" style={{ margin: 0 }}>{c.name}</p>
                        <div className="app-table-actions">
                          <button type="button" className="app-table-link-btn" onClick={() => startEdit(c)}>Edit</button>
                          <button type="button" className="app-table-link-btn danger" onClick={() => handleDelete(c.id)}>Delete</button>
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ marginTop: "0.75rem", paddingLeft: "1rem", borderLeft: "2px solid #f0f1f4" }}>
                    {(c.subCategories || []).map((sc) => (
                      <div key={sc.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.85rem" }}>
                        <span>{sc.name}</span>
                        <button type="button" className="app-table-link-btn danger" onClick={() => handleDeleteSub(c.id, sc.id)}>Remove</button>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                      <input
                        className="app-inline-input"
                        placeholder="Add sub-category"
                        value={subInputs[c.id] || ""}
                        onChange={(e) => setSubInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      />
                      <button type="button" className="app-inline-submit" onClick={() => handleAddSub(c.id)}>Add</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default CategoriesPage;
