import { useState, useEffect } from "react";
import { apiGet, apiPost } from "../services/apiClient";
import "./BudgetPage.css";

function BudgetPage() {
  const [budgets, setBudgets] = useState([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    categoryId: "",
    subCategoryId: "",
    amount: "",
    locationTag: "",
    manualReview: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        console.log("Fetching categories, budgets, and dashboard summary...");
        
        const catsPromise = apiGet("/Category").catch(err => {
          console.error("Category fetch failed:", err);
          throw err;
        });
        
        const budgetPromise = apiGet("/Budget").catch(err => {
          console.error("Budget fetch failed:", err);
          throw err;
        });
        
        const dashboardPromise = apiGet("/Dashboard/summary").catch(err => {
          console.error("Dashboard summary fetch failed:", err);
          throw err;
        });

        const [cats, budgetList, dashboardSummary] = await Promise.all([
          catsPromise,
          budgetPromise,
          dashboardPromise,
        ]);
        
        console.log("API data loaded:", { cats, budgetList, dashboardSummary });
        setCategories(cats || []);
        setBudgets(budgetList || []);
        setSummary(dashboardSummary);

        if (budgetList?.length > 0) {
          setSelectedBudgetId(budgetList[0].id);
        }
      } catch (err) {
        console.error("Init error:", err);
        setError(`API Error: ${err.message}. Make sure the backend API is running at localhost:5199`);
        
        // Fallback: Use mock data for UI testing
        const mockCategories = [
          { id: 1, name: "Food & Dining", subCategories: [{ id: 101, name: "Groceries" }, { id: 102, name: "Restaurants" }] },
          { id: 2, name: "Transport", subCategories: [{ id: 201, name: "Bus" }, { id: 202, name: "Taxi" }] },
          { id: 3, name: "Entertainment", subCategories: [] },
        ];
        
        const mockBudgets = [
          { id: 1, startDate: "2026-08-01", endDate: "2026-08-31", savingsGoalPercentage: 20 }
        ];
        
        const mockSummary = { disposableIncome: 5000 };
        
        setCategories(mockCategories);
        setBudgets(mockBudgets);
        setSummary(mockSummary);
        setSelectedBudgetId(1);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (selectedBudgetId) {
      loadAllocations(selectedBudgetId);
    }
  }, [selectedBudgetId]);

  async function loadAllocations(id) {
    try {
      const data = await apiGet(`/Budget/${id}/allocations`);
      setAllocations(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function createBudgetPeriod() {
    setError("");
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split("T")[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString().split("T")[0];

    try {
      const data = await apiPost("/Budget", { startDate, endDate });
      const updatedList = await apiGet("/Budget");
      setBudgets(updatedList);
      setSelectedBudgetId(data.budgetId);
    } catch (err) {
      setError(err.message);
    }
  }

  const selectedCategory = categories.find(
    (c) => c.id === parseInt(form.categoryId, 10)
  );

  async function handleAddAllocation(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setFeedback(null);

    try {
      const data = await apiPost(`/Budget/${selectedBudgetId}/allocations`, {
        categoryId: parseInt(form.categoryId, 10),
        subCategoryId: form.subCategoryId ? parseInt(form.subCategoryId, 10) : null,
        amount: parseFloat(form.amount),
        locationTag: form.locationTag || null,
        manualReview: form.manualReview,
      });

      setFeedback(data);
      setForm({ categoryId: "", subCategoryId: "", amount: "", locationTag: "", manualReview: false });
      loadAllocations(selectedBudgetId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function applyCap() {
    if (feedback?.suggestedCap) {
      setForm((prev) => ({ ...prev, amount: feedback.suggestedCap.toFixed(2) }));
      setFeedback(null);
    }
  }

  const runningTotal = allocations.reduce((sum, a) => sum + a.amount, 0);
  const selectedBudget = budgets.find((b) => b.id === selectedBudgetId);

  if (loading) return <div className="budget-state-message">Loading...</div>;

  return (
    <div className="budget-page">
      <header className="budget-header">
        <h1 className="budget-title">Budget Creator</h1>
        <button type="button" className="budget-secondary-btn" onClick={createBudgetPeriod}>
          + New Period
        </button>
      </header>

      {error && <div className="budget-error-banner">{error}</div>}

      {budgets.length > 0 && (
        <div className="budget-period-picker">
          <label className="budget-field-label">Select Budget Period</label>
          <select
            className="budget-period-select"
            value={selectedBudgetId || ""}
            onChange={(e) => setSelectedBudgetId(parseInt(e.target.value, 10))}
          >
            {budgets.map((b) => (
              <option key={b.id} value={b.id}>
                {new Date(b.startDate).toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
                {" "}({b.startDate} to {b.endDate})
              </option>
            ))}
          </select>
        </div>
      )}

      {summary && (
        <div className="budget-disposable-card">
          <span>Available to allocate this period</span>
          <strong>R{summary.disposableIncome.toFixed(2)}</strong>
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
        <>
          <div className="budget-content-wrapper">
          <form className="budget-form-card" onSubmit={handleAddAllocation}>
            <h2 style={{ margin: "0 0 0.8rem 0", fontSize: "0.95rem", color: "#1f2937", fontWeight: 700 }}>
              Add New Expense Allocation
            </h2>
            
            <div className="budget-form-row">
              <div className="budget-field">
                <label className="budget-field-label">Category</label>
                <select
                  className="budget-input"
                  value={form.categoryId}
                  onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value, subCategoryId: "" }))}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {selectedCategory?.subCategories?.length > 0 && (
                <div className="budget-field">
                  <label className="budget-field-label">Subcategory</label>
                  <select
                    className="budget-input"
                    value={form.subCategoryId}
                    onChange={(e) => setForm((p) => ({ ...p, subCategoryId: e.target.value }))}
                  >
                    <option value="">Any</option>
                    {selectedCategory.subCategories.map((sc) => (
                      <option key={sc.id} value={sc.id}>{sc.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="budget-form-row">
              <div className="budget-field">
                <label className="budget-field-label">Amount (R)</label>
                <input
                  className="budget-input"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  required
                />
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

            <label className="budget-manual-toggle">
              <input
                type="checkbox"
                checked={form.manualReview}
                onChange={(e) => setForm((p) => ({ ...p, manualReview: e.target.checked }))}
              />
              <span>Flag for manual review (overrides 20% rule)</span>
            </label>

            {feedback && (
              <div className={`budget-feedback ${feedback.isUnderReview ? "flagged" : "ok"}`}>
                {feedback.isUnderReview ? (
                  <>
                    <p className="budget-feedback-title">
                      {feedback.autoFlagged ? "Exceeds 20% limit" : "Flagged for review"}
                    </p>
                    {feedback.suggestedCap && (
                      <>
                        <p className="budget-feedback-sub">
                          Suggested cap: <strong>R{feedback.suggestedCap.toFixed(2)}</strong>
                        </p>
                        <button type="button" className="budget-cap-btn" onClick={applyCap}>
                          Use suggested amount
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <p className="budget-feedback-title">Successfully added — {feedback.verdict}</p>
                )}
              </div>
            )}

            <button type="submit" className="budget-primary-btn" disabled={submitting}>
              {submitting ? "Adding..." : "Add to Budget"}
            </button>
          </form>

          <div className="budget-list-card">
            <h2 className="budget-list-title">This Period's Allocations</h2>
            {allocations.length === 0 ? (
              <p className="budget-empty-state">No allocations yet. Add your first expense above to get started.</p>
            ) : (
              allocations.map((a) => (
                <div key={a.id} className="budget-list-row">
                  <div>
                    <p className="budget-list-category">{a.categoryName}</p>
                    {a.subCategoryName && <p className="budget-list-sub">• {a.subCategoryName}</p>}
                    {a.locationTag && <p className="budget-list-location">{a.locationTag}</p>}
                  </div>
                  <div className="budget-list-amount-wrap">
                    <p className="budget-list-amount">R{a.amount.toFixed(2)}</p>
                    {a.isUnderReview && <span className="budget-flag-pill">Flagged</span>}
                  </div>
                </div>
              ))
            )}

            <div className="budget-footer">
              <span>Total budgeted for period</span>
              <span className="budget-footer-total">R{runningTotal.toFixed(2)}</span>
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  );
}

export default BudgetPage;