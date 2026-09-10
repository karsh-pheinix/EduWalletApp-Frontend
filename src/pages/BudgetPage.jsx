import { useState, useEffect, useRef } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../services/apiClient";
import "./BudgetPage.css";
import AppLayout from "../components/AppLayout";

function BudgetPage() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const defaultDate = new Date().toISOString().split("T")[0];

  const [budgets, setBudgets] = useState([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState([]);
  const [budgetTransactions, setBudgetTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTransactionItemId, setSelectedTransactionItemId] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(defaultDate);
  const [transactionLocation, setTransactionLocation] = useState("");
  const [transactionSubmitting, setTransactionSubmitting] = useState(false);

  const [form, setForm] = useState({
    categoryId: "",
    customCategory: "",
    subCategoryId: "",
    customSubCategory: "",
    amount: "",
    description: "",
    date: defaultDate,
    locationTag: "",
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [creatingCategoryName, setCreatingCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [manageError, setManageError] = useState("");
  const [pickerMode, setPickerMode] = useState("month");
  const [startPicker, setStartPicker] = useState(defaultMonth);
  const [endPicker, setEndPicker] = useState(defaultMonth);
  const periodPickerRef = useRef(null);
  const [showPeriodPopup, setShowPeriodPopup] = useState(false);
  const [popupStart, setPopupStart] = useState(startPicker);
  const [popupEnd, setPopupEnd] = useState(endPicker);
  const [autoFlagged, setAutoFlagged] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  useEffect(() => {
    async function init() {
      try {
        const catsPromise = apiGet("/Category");
        const budgetPromise = apiGet("/Budget");
        const dashboardPromise = apiGet("/Dashboard/summary");

        const [cats, budgetList, dashboardSummary] = await Promise.all([
          catsPromise,
          budgetPromise,
          dashboardPromise,
        ]);

        function normalizeCategories(list) {
          return (list || []).map((c) => ({
            id: c.id ?? c.Id,
            name: c.name ?? c.Name,
            subCategories: (c.subCategories ?? c.SubCategories ?? []).map((sc) => ({
              id: sc.id ?? sc.Id,
              name: sc.name ?? sc.Name,
            })),
          }));
        }

        setCategories(normalizeCategories(cats || []));
        setBudgets(budgetList || []);
        setSummary(dashboardSummary);

        if (budgetList?.length > 0) {
          setSelectedBudgetId(budgetList[0].id);
        }
      } catch (err) {
        console.error("Init error:", err);
        setError(`API Error: ${err.message}. Make sure the backend API is running.`);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (selectedBudgetId) {
      loadAllocations(selectedBudgetId);
      loadBudgetTransactions(selectedBudgetId);
      const selectedBudget = budgets.find((budget) => String(budget.id) === String(selectedBudgetId));
      if (selectedBudget) {
        setStartPicker(selectedBudget.startDate);
        setEndPicker(selectedBudget.endDate);
        const today = new Date().toISOString().slice(0, 10);
        setTransactionDate(
          today < selectedBudget.startDate || today > selectedBudget.endDate
            ? selectedBudget.startDate
            : today
        );
      }
    }
  }, [selectedBudgetId, budgets]);

  const disposableIncome = summary?.disposableIncome || 0;
  const twentyPercentCap = disposableIncome * 0.2;

  useEffect(() => {
    const amt = parseFloat(form.amount || 0);
    if (summary && !isNaN(amt) && amt > 0) {
      const threshold = 0.2 * (summary.disposableIncome || 0);
      setAutoFlagged(amt > threshold);
    } else {
      setAutoFlagged(false);
    }
  }, [form.amount, summary]);

  async function loadAllocations(id) {
    try {
      const data = await apiGet(`/Budget/${id}/allocations`);
      setAllocations((data || []).map((allocation) => ({
        ...allocation,
        id: allocation.id ?? allocation.Id,
        amount: allocation.budgetedAmount ?? allocation.BudgetedAmount ?? allocation.amount ?? allocation.Amount,
        categoryId: allocation.categoryId ?? allocation.CategoryId,
        subCategoryId: allocation.subCategoryId ?? allocation.SubCategoryId,
        categoryName: allocation.categoryName ?? allocation.CategoryName,
        subCategoryName: allocation.subCategoryName ?? allocation.SubCategoryName,
      })));
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadBudgetTransactions(id) {
    try {
      const [txns, variance] = await Promise.all([
        apiGet(`/Transaction?budgetId=${id}`),
        apiGet(`/Transaction/variance/${id}`),
      ]);

      setBudgetTransactions(Array.isArray(txns) ? txns : []);
      setBudgetSummary(Array.isArray(variance) ? variance : []);
    } catch (err) {
      setBudgetTransactions([]);
      setBudgetSummary([]);
    }
  }

  async function handleAddTransaction(e) {
    e.preventDefault();
    if (!selectedBudgetId || !selectedTransactionItemId || !transactionAmount || !transactionDate) return;

    const selectedAllocation = allocations.find((a) => String(a.id) === String(selectedTransactionItemId));
    const categoryIdValue = selectedAllocation?.categoryId
      ?? selectedAllocation?.category_id
      ?? categories.find((category) => category.name === selectedAllocation?.categoryName)?.id;

    if (!selectedAllocation || !categoryIdValue) {
      setError("Please choose a budget item before logging a transaction.");
      return;
    }

    setTransactionSubmitting(true);
    setError("");

    try {
      const selectedBudget = budgets.find((budget) => String(budget.id) === String(selectedBudgetId));
      if (selectedBudget && (transactionDate < selectedBudget.startDate || transactionDate > selectedBudget.endDate)) {
        setError(`The transaction date must be between ${selectedBudget.startDate} and ${selectedBudget.endDate}.`);
        return;
      }

      await apiPost("/Transaction", {
        budgetAllocationId: parseInt(selectedAllocation.id, 10),
        categoryId: parseInt(categoryIdValue, 10),
        amount: parseFloat(transactionAmount),
        date: transactionDate,
        locationTag: transactionLocation || null,
      });

      setSelectedTransactionItemId("");
      setTransactionAmount("");
      setTransactionLocation("");
      const today = new Date().toISOString().slice(0, 10);
      setTransactionDate(
        selectedBudget && today >= selectedBudget.startDate && today <= selectedBudget.endDate
          ? today
          : selectedBudget?.startDate || today
      );
      await loadBudgetTransactions(selectedBudgetId);
      await loadAllocations(selectedBudgetId);
    } catch (err) {
      setError(err.message);
    } finally {
      setTransactionSubmitting(false);
    }
  }

  async function handleDeleteTransaction(id) {
    if (!window.confirm("Delete this logged transaction?")) return;

    try {
      await apiDelete(`/Transaction/${id}`);
      await loadBudgetTransactions(selectedBudgetId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function createBudgetPeriod() {
    setError("");
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    try {
      const data = await apiPost("/Budget", { startDate, endDate });
      const updatedList = await apiGet("/Budget");
      setBudgets(updatedList);
      setSelectedBudgetId(data.budgetId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function refreshCategories() {
    try {
      const cats = await apiGet("/Category");
      setCategories((cats || []).map((c) => ({
        id: c.id ?? c.Id,
        name: c.name ?? c.Name,
        subCategories: (c.subCategories ?? c.SubCategories ?? []).map((sc) => ({
          id: sc.id ?? sc.Id,
          name: sc.name ?? sc.Name,
        })),
      })));
    } catch (err) {
      setManageError(err.message);
    }
  }

  async function selectOrCreateForRange(startVal, endVal) {
    setError("");
    let startDate = startVal;
    let endDate = endVal;

    try {
      if (new Date(startDate) > new Date(endDate)) {
        setError("Start date must be before or equal to end date.");
        return;
      }

      const existing = budgets.find((b) => b.startDate === startDate && b.endDate === endDate);
      if (existing) {
        setSelectedBudgetId(existing.id);
        return;
      }

      const data = await apiPost("/Budget", { startDate, endDate });
      const updatedList = await apiGet("/Budget");
      setBudgets(updatedList);
      setSelectedBudgetId(data.budgetId);
    } catch (err) {
      setError(err.message);
    }
  }

  const selectedCategory = categories.find(
    (c) => c.id === parseInt(form.categoryId, 10) || c.name === form.categoryId
  );

  async function handleAddAllocation(e) {
    e.preventDefault();
    setError("");
    setFeedback(null);

    if (autoFlagged) {
      setFeedback({ isUnderReview: true, suggestedCap: twentyPercentCap });
      setShowFlagModal(true);
      return;
    }

    await submitAllocation(parseFloat(form.amount));
  }

  async function submitAllocation(amountOverride) {
    setSubmitting(true);
    try {
      let categoryIdToUse = parseInt(form.categoryId, 10);
      if (form.categoryId === "other") {
        const created = await apiPost("/Category", { name: form.customCategory });
        categoryIdToUse = created?.id ?? created?.Id ?? created?.categoryId ?? null;
      }

      let subCategoryIdToUse = null;
      let subCategoryNameToSend = null;
      if (form.subCategoryId === "other") {
        subCategoryNameToSend = form.customSubCategory;
      } else if (form.subCategoryId) {
        subCategoryIdToUse = parseInt(form.subCategoryId, 10);
      }

      const payload = {
        categoryId: categoryIdToUse,
        subCategoryId: subCategoryIdToUse,
        amount: amountOverride,
        locationTag: form.locationTag || null,
      };
      if (subCategoryNameToSend) payload.subCategoryName = subCategoryNameToSend;

      const data = await apiPost(`/Budget/${selectedBudgetId}/allocations`, payload);

      setFeedback(data);
      setForm({ categoryId: "", subCategoryId: "", amount: "", description: "", date: defaultDate, locationTag: "" });
      loadAllocations(selectedBudgetId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // --- Category Management ---
  function startEditCategory(c) {
    setEditingCategoryId(c.id);
    setEditingCategoryName(c.name);
    setManageError("");
  }

  function cancelEditCategory() {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  }

  async function saveEditCategory() {
    try {
      if (!editingCategoryName) return;
      await apiPut(`/Category/${editingCategoryId}`, { name: editingCategoryName });
      await refreshCategories();
      cancelEditCategory();
    } catch (err) {
      setManageError(err.message);
    }
  }

  async function createCategory() {
    try {
      if (!creatingCategoryName) return;
      await apiPost(`/Category`, { name: creatingCategoryName });
      setCreatingCategoryName("");
      await refreshCategories();
    } catch (err) {
      setManageError(err.message);
    }
  }

  async function deleteCategory(id) {
    try {
      if (!confirm("Delete this category? This cannot be undone.")) return;
      await apiDelete(`/Category/${id}`);
      await refreshCategories();
    } catch (err) {
      setManageError(err.message);
    }
  }

  // --- Allocation Edit/Delete ---
  const [editingAllocationId, setEditingAllocationId] = useState(null);
  const [editAllocationForm, setEditAllocationForm] = useState({ amount: "", locationTag: "", categoryId: "", subCategoryId: "" });

  function startEditAllocation(a) {
    const cat = categories.find(c => c.name === a.categoryName);
    const subCat = cat?.subCategories?.find(sc => sc.name === a.subCategoryName);

    setEditingAllocationId(a.id);
    setEditAllocationForm({ 
      amount: a.amount.toFixed(2), 
      locationTag: a.locationTag || "",
      categoryId: cat ? cat.id : "",
      subCategoryId: subCat ? subCat.id : null
    });
  }

  function cancelEditAllocation() {
    setEditingAllocationId(null);
    setEditAllocationForm({ amount: "", locationTag: "", categoryId: "", subCategoryId: "" });
  }

  async function saveEditAllocation(id) {
    try {
      const payload = {
        categoryId: parseInt(editAllocationForm.categoryId, 10),
        subCategoryId: editAllocationForm.subCategoryId ? parseInt(editAllocationForm.subCategoryId, 10) : null,
        amount: parseFloat(editAllocationForm.amount),
        locationTag: editAllocationForm.locationTag || null,
      };
      await apiPut(`/Budget/${selectedBudgetId}/allocations/${id}`, payload);
      await loadAllocations(selectedBudgetId);
      cancelEditAllocation();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteAllocation(id) {
    if (!confirm("Delete this allocation?")) return;
    try {
      await apiDelete(`/Budget/${selectedBudgetId}/allocations/${id}`);
      await loadAllocations(selectedBudgetId);
    } catch (err) {
      setError(err?.message || 'Delete failed');
    }
  }

  const runningTotal = allocations.reduce((sum, a) => sum + a.amount, 0);
  const remaining = summary ? (summary.disposableIncome - runningTotal) : 0;

  if (loading) return <div className="budget-state-message">Loading...</div>;

  return (
    <AppLayout>
      <div className="budget-page">
        <header className="budget-header">
          <h1 className="budget-title">Budget Creator</h1>
          <button
            type="button"
            className="budget-secondary-btn"
            onClick={() => {
              setPickerMode("month");
              setStartPicker(defaultMonth);
              setEndPicker(defaultMonth);
              setShowPeriodPopup(true);
            }}
          >
            + New Period
          </button>
        </header>

        {error && <div className="budget-error-banner">{error}</div>}

        <section className="budget-top-grid">
          <div className="overview-left">
            <div className="overview-cards">
              <div className="overview-card available">
                <div>
                  <div className="label">Available to allocate</div>
                  <div className="value">R{(remaining).toFixed(2)}</div>
                </div>
                <div className="meta">Allocated: R{runningTotal.toFixed(2)}</div>
              </div>
              <div className="overview-card allocated">
                <div>
                  <div className="label">Currently Allocated</div>
                  <div className="value">R{runningTotal.toFixed(2)}</div>
                </div>
                <div className="progress">
                  <div className="bar" style={{ width: `${Math.min(100, Math.round((runningTotal / Math.max(1, runningTotal + remaining)) * 100))}%` }} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="period-panel">
            <h3 className="panel-title">Period Settings</h3>
            <div className="panel-body">
              <label className="budget-field-label">Select Allocation Period</label>
              <div className="period-display">
                {budgets.find((budget) => String(budget.id) === String(selectedBudgetId))?.startDate || startPicker}
                {" → "}
                {budgets.find((budget) => String(budget.id) === String(selectedBudgetId))?.endDate || endPicker}
              </div>
              <label className="budget-field-label" style={{ marginTop: '0.6rem' }}>Allocate To</label>
              <select
                className="budget-period-select"
                value={selectedBudgetId || ""}
                onChange={(e) => setSelectedBudgetId(parseInt(e.target.value, 10))}
              >
                <option value="">Select a budget period</option>
                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {new Date(b.startDate).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })} — {b.startDate} to {b.endDate}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Date Picker Popup */}
        {showPeriodPopup && (
          <div className="period-popup" role="dialog" aria-modal>
            <div className="period-popup-inner">
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label className="budget-field-label">Start</label>
                  <input type="date" value={popupStart} onChange={(e) => setPopupStart(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label className="budget-field-label">End</label>
                  <input type="date" value={popupEnd} onChange={(e) => setPopupEnd(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button type="button" className="budget-secondary-btn" onClick={() => setShowPeriodPopup(false)}>Cancel</button>
                <button type="button" className="budget-primary-btn" onClick={() => {
                  if (!popupStart || !popupEnd || new Date(popupStart) > new Date(popupEnd)) {
                    setError("Invalid date range selected.");
                    return;
                  }
                  setStartPicker(popupStart);
                  setEndPicker(popupEnd);
                  setShowPeriodPopup(false);
                  selectOrCreateForRange(popupStart, popupEnd);
                }}>Apply</button>
              </div>
            </div>
          </div>
        )}

        {!selectedBudgetId ? (
          <div className="budget-empty-state-card">
            <p>No budget period created yet.</p>
            <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: "1rem" }}>
              Create your first budget period to start planning your expenses.
            </p>
            <button type="button" className="budget-primary-btn" onClick={createBudgetPeriod}>
              Start This Month's Budget
            </button>
          </div>
        ) : (
          <div className="budget-content-wrapper">
            {/* --- Form Section --- */}
            <form className="budget-form-card" onSubmit={handleAddAllocation}>
              <h2 style={{ margin: "0 0 0.8rem 0", fontSize: "0.95rem", color: "#1f2937", fontWeight: 700 }}>
                Add New Expense Allocation
              </h2>
              
              <div className="budget-form-row">
                <div className="budget-field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="budget-field-label">Category</label>
                    {isAdmin && (
                      <button type="button" className="budget-secondary-btn small" onClick={() => setShowManageCategories((s) => !s)}>
                        {showManageCategories ? "Hide" : "Manage"}
                      </button>
                    )}
                  </div>
                  <select
                    className="budget-input"
                    value={form.categoryId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((p) => ({ ...p, categoryId: v, subCategoryId: "", customCategory: "", customSubCategory: "" }));
                    }}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                    {isAdmin && <option value="other">Other (create new)</option>}
                  </select>
                  
                  {isAdmin && form.categoryId === "other" && (
                    <input
                      className="budget-input"
                      placeholder="New category name"
                      value={form.customCategory}
                      onChange={(e) => setForm((p) => ({ ...p, customCategory: e.target.value }))}
                      required
                    />
                  )}
                  
                  {isAdmin && showManageCategories && (
                    <div className="category-manager" style={{ marginTop: "0.5rem", padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                      {manageError && <div style={{ color: "#b91c1c", marginBottom: "0.5rem" }}>{manageError}</div>}
                      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <input className="budget-input" placeholder="New category name" value={creatingCategoryName} onChange={(e) => setCreatingCategoryName(e.target.value)} />
                        <button type="button" className="budget-primary-btn" onClick={createCategory}>Add</button>
                      </div>
                      <div>
                        {categories.map((c) => (
                          <div key={c.id} style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.25rem 0" }}>
                            {editingCategoryId === c.id ? (
                              <>
                                <input className="budget-input" value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} />
                                <button type="button" className="budget-primary-btn" onClick={saveEditCategory}>Save</button>
                                <button type="button" className="budget-secondary-btn" onClick={cancelEditCategory}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <div style={{ flex: 1, fontSize: "0.85rem" }}>{c.name}</div>
                                <button type="button" className="budget-secondary-btn small" onClick={() => startEditCategory(c)}>Edit</button>
                                <button type="button" className="budget-secondary-btn small" style={{color: "#b91c1c"}} onClick={() => deleteCategory(c.id)}>Del</button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {selectedCategory?.subCategories?.length > 0 && (
                  <div className="budget-field">
                    <label className="budget-field-label">Subcategory</label>
                    <select
                      className="budget-input"
                      value={form.subCategoryId}
                      onChange={(e) => setForm((p) => ({ ...p, subCategoryId: e.target.value, customSubCategory: "" }))}
                    >
                      <option value="">Any</option>
                      {selectedCategory.subCategories.map((sc) => (
                        <option key={sc.id} value={String(sc.id)}>{sc.name}</option>
                      ))}
                      {isAdmin && <option value="other">Other (create new)</option>}
                    </select>
                    {isAdmin && form.subCategoryId === "other" && (
                      <input
                        className="budget-input"
                        placeholder="New subcategory name"
                        value={form.customSubCategory}
                        onChange={(e) => setForm((p) => ({ ...p, customSubCategory: e.target.value }))}
                        required
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="budget-form-row">
                <div className="budget-field">
                  <label className="budget-field-label">Amount (R)</label>
                  <input
                    className={`budget-input ${autoFlagged ? "warning-border" : ""}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                    required
                  />
                  {autoFlagged && (
                    <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                      <span className="budget-warning-pill">Exceeds 20% limit</span>
                      <button
                        type="button"
                        className="budget-secondary-btn small"
                        onClick={() => setForm((p) => ({ ...p, amount: twentyPercentCap.toFixed(2) }))}
                      >
                        Use 20% cap
                      </button>
                    </div>
                  )}
                </div>
                <div className="budget-field">
                  <label className="budget-field-label">Location (optional)</label>
                  <input
                    className="budget-input"
                    placeholder="e.g., Campus cafeteria"
                    value={form.locationTag}
                    onChange={(e) => setForm((p) => ({ ...p, locationTag: e.target.value }))}
                  />
                </div>
              </div>

              {autoFlagged && (
                <div className="budget-feedback flagged" style={{ marginBottom: "0.8rem" }}>
                  <p className="budget-feedback-title">Automatically flagged — exceeds 20% of balance</p>
                  <p className="budget-feedback-sub">This item exceeds 20% of your total disposable income.</p>
                </div>
              )}

              {feedback && !feedback.isUnderReview && (
                <div className="budget-feedback ok">
                  <p className="budget-feedback-title">Successfully added — {feedback.verdict}</p>
                </div>
              )}

              {/* Review / Override Modal */}
              {showFlagModal && feedback && (
                <div className="budget-flag-modal-overlay" role="dialog" aria-modal="true" style={{
                  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
                  background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', 
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <div className="budget-flag-modal" style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', maxWidth: '400px' }}>
                    <h3 style={{ marginTop: 0, color: '#92400e' }}>High Allocation Detected</h3>
                    <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                      This amount exceeds 20% of your disposable income. 
                      Suggested cap: <strong>R{feedback.suggestedCap?.toFixed(2)}</strong>.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem' }}>
                      <button
                        type="button"
                        className="budget-primary-btn"
                        onClick={async () => {
                          const suggested = feedback.suggestedCap;
                          setShowFlagModal(false);
                          try {
                            await submitAllocation(parseFloat(suggested));
                          } catch (err) {
                            setError(err.message);
                          }
                        }}
                      >
                        Use suggested amount (R{feedback.suggestedCap?.toFixed(2)})
                      </button>
                      <button
                        type="button"
                        className="budget-secondary-btn"
                        onClick={async () => {
                          setShowFlagModal(false);
                          try {
                            await submitAllocation(parseFloat(form.amount));
                          } catch (err) {
                            setError(err.message);
                          }
                        }}
                      >
                        Keep original amount
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto" }}>
                <button type="submit" className="budget-primary-btn" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Allocation"}
                </button>
              </div>
            </form>

            {/* --- Allocations List Section --- */}
            <div className="budget-list-card">
              <h2 className="budget-list-title">Current Allocations</h2>
              {allocations.length === 0 ? (
                <div className="budget-empty-state-card" style={{ padding: "2rem" }}>
                  <p>No allocations added yet for this period.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {allocations.map((a) => (
                    <div className="budget-list-row" key={a.id}>
                      {editingAllocationId === a.id ? (
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", width: "100%", flexWrap: "wrap" }}>
                          <input
                            className="budget-input"
                            type="number"
                            step="0.01"
                            value={editAllocationForm.amount}
                            onChange={(e) => setEditAllocationForm({ ...editAllocationForm, amount: e.target.value })}
                            style={{ width: "100px", border: "1px solid #d1d5db" }}
                          />
                          <input
                            className="budget-input"
                            placeholder="Location"
                            value={editAllocationForm.locationTag}
                            onChange={(e) => setEditAllocationForm({ ...editAllocationForm, locationTag: e.target.value })}
                            style={{ width: "140px", border: "1px solid #d1d5db" }}
                          />
                          <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                            <button type="button" className="budget-primary-btn small" onClick={() => saveEditAllocation(a.id)}>Save</button>
                            <button type="button" className="budget-secondary-btn small" onClick={cancelEditAllocation}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="budget-list-category">{a.categoryName || `Category ${a.categoryId}`}</p>
                            {a.subCategoryName && <p className="budget-list-sub">{a.subCategoryName}</p>}
                            {a.locationTag && <p className="budget-list-location">{a.locationTag}</p>}
                          </div>
                          <div className="budget-list-amount-wrap">
                            {a.isUnderReview && <span className="budget-flag-pill">Review</span>}
                            <p className="budget-list-amount" style={{ color: a.isUnderReview ? "#b91c1c" : "var(--accent)" }}>
                              R{a.amount.toFixed(2)}
                            </p>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button type="button" className="icon-btn" onClick={() => startEditAllocation(a)} title="Edit">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                              </button>
                              <button type="button" className="icon-btn" style={{ color: "#ef4444" }} onClick={() => deleteAllocation(a.id)} title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="budget-list-card">
              <h2 className="budget-list-title">Budget vs Actual</h2>
              {budgetSummary.length === 0 ? (
                <div className="budget-empty-state-card" style={{ padding: "2rem" }}>
                  <p>No logged transactions for this period yet.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {budgetSummary.map((item) => {
                    const variance = (item.planned || 0) - (item.actual || 0);
                    return (
                      <div className="budget-list-row" key={item.id || item.categoryName}>
                        <div>
                          <p className="budget-list-category">{item.categoryName}</p>
                          <p className="budget-list-sub">Budgeted R{Number(item.planned || 0).toFixed(2)}</p>
                        </div>
                        <div className="budget-list-amount-wrap">
                          <p className="budget-list-amount" style={{ color: variance < 0 ? "#b91c1c" : "var(--accent)" }}>
                            Actual: R{Number(item.actual || 0).toFixed(2)}
                          </p>
                          <p className="budget-list-sub" style={{ color: variance < 0 ? "#b91c1c" : "#059669" }}>
                            {variance < 0 ? "Over by" : "Under by"} R{Math.abs(variance).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="budget-list-card">
              <h2 className="budget-list-title">Log a Transaction</h2>
              <form className="budget-form-card" style={{ marginTop: "0.75rem", border: "1px solid #e5e7eb" }} onSubmit={handleAddTransaction}>
                <div className="budget-form-row">
                  <div className="budget-field">
                    <label className="budget-field-label">Budget item</label>
                    <select
                      className="budget-input"
                      value={selectedTransactionItemId}
                      onChange={(e) => setSelectedTransactionItemId(e.target.value)}
                      required
                    >
                      <option value="">Select a budget item</option>
                      {allocations.map((a) => (
                        <option key={a.id} value={String(a.id)}>
                          {a.categoryName || `Category ${a.categoryId}`} {a.subCategoryName ? `• ${a.subCategoryName}` : ""} — R{Number(a.amount || 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="budget-field">
                    <label className="budget-field-label">Amount (R)</label>
                    <input
                      className="budget-input"
                      type="number"
                      step="0.01"
                      value={transactionAmount}
                      onChange={(e) => setTransactionAmount(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="budget-form-row">
                  <div className="budget-field">
                    <label className="budget-field-label">Date</label>
                    <input
                      className="budget-input"
                      type="date"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="budget-field">
                    <label className="budget-field-label">Location (optional)</label>
                    <input
                      className="budget-input"
                      value={transactionLocation}
                      onChange={(e) => setTransactionLocation(e.target.value)}
                      placeholder="Campus cafeteria"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" className="budget-primary-btn" disabled={transactionSubmitting}>
                    {transactionSubmitting ? "Logging..." : "Log Transaction"}
                  </button>
                </div>
              </form>
              
              {budgetTransactions.length === 0 ? (
                <div className="budget-empty-state-card" style={{ padding: "1.2rem", marginTop: "1rem" }}>
                  <p>No transactions logged yet for this period.</p>
                </div>
              ) : (
                <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {budgetTransactions.map((t) => (
                    <div className="budget-list-row" key={t.id}>
                      <div>
                        <p className="budget-list-category">{t.categoryName || "Category"}</p>
                        <p className="budget-list-sub">{t.date}</p>
                        {t.locationTag && <p className="budget-list-location">{t.locationTag}</p>}
                      </div>
                      <div className="budget-list-amount-wrap">
                        <p className="budget-list-amount">R{Number(t.amount || 0).toFixed(2)}</p>
                        <button type="button" className="budget-secondary-btn small" style={{ color: "#b91c1c" }} onClick={() => handleDeleteTransaction(t.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default BudgetPage;