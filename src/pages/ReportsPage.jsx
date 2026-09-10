import { useState, useEffect } from "react";
import { apiGet } from "../services/apiClient";
import AppLayout from "../components/AppLayout";
import "./AppPages.css";

const STATUS_LABELS = {
  all: "All",
  wise: "Wise",
  caution: "Caution",
  reconsider: "Reconsider",
};

function ReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBudgetId, setSelectedBudgetId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationTag, setLocationTag] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [merchantSearch, setMerchantSearch] = useState("");
  const [minimumAmount, setMinimumAmount] = useState("");
  const [maximumAmount, setMaximumAmount] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    category: "all",
    status: "all",
    location: "all",
    dateRange: "all",
    merchant: "",
    minimumAmount: "",
    maximumAmount: "",
    budgetId: "all",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [txns, statementTxns, cats, budgetList] = await Promise.all([
          apiGet("/Transaction"),
          apiGet("/BankStatement/transactions"),
          apiGet("/Category"),
          apiGet("/Budget"),
        ]);

        const manual = (txns || []).map((t) => ({ ...t, source: "Manual" }));
        const fromStatements = (statementTxns || []).map((t) => ({ ...t, source: "Statement" }));

        setTransactions([...manual, ...fromStatements]);
        setCategories(cats || []);
        setBudgets(budgetList || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
    window.addEventListener("EduWallet:FinancialDataChanged", load);
    return () => window.removeEventListener("EduWallet:FinancialDataChanged", load);
  }, []);

  const locationOptions = ["all", ...new Set(
    transactions
      .map((tx) => (tx.locationTag || "").trim())
      .filter(Boolean)
  )].sort((a, b) => {
    if (a === "all") return -1;
    if (b === "all") return 1;
    return a.localeCompare(b);
  });

  const filteredTransactions = transactions.filter((tx) => {
    const matchesCategory = appliedFilters.category === "all" || tx.categoryName === appliedFilters.category;
    const selectedBudget = budgets.find((budget) => String(budget.id) === String(appliedFilters.budgetId));
    const matchesBudget = appliedFilters.budgetId === "all"
      || (selectedBudget && tx.date >= selectedBudget.startDate && tx.date <= selectedBudget.endDate);
    const matchesLocation = appliedFilters.location === "all" || (tx.locationTag || "") === appliedFilters.location;
    const searchableText = `${tx.locationTag || ""} ${tx.merchant || ""} ${tx.description || ""}`.toLowerCase();
    const matchesMerchant = !appliedFilters.merchant || searchableText.includes(appliedFilters.merchant.toLowerCase());
    const amount = Number(tx.amount || 0);
    const matchesMinimum = !appliedFilters.minimumAmount || amount >= Number(appliedFilters.minimumAmount);
    const matchesMaximum = !appliedFilters.maximumAmount || amount <= Number(appliedFilters.maximumAmount);
    const matchesStatus = (() => {
      if (appliedFilters.status === "all") return true;
      const ratio = Number(tx.amount || 0) > 0 ? Number(tx.amount || 0) / Math.max(1, Number(tx.amount || 0)) : 0;
      const verdict = ratio <= 0.1 ? "wise" : ratio <= 0.2 ? "caution" : "reconsider";
      return verdict === appliedFilters.status;
    })();

    const matchesDate = (() => {
      if (appliedFilters.dateRange === "all") return true;
      const txDate = new Date(tx.date);
      const today = new Date();
      const daysAgo = Number(appliedFilters.dateRange) || 30;
      const cutoff = new Date(today);
      cutoff.setDate(today.getDate() - daysAgo);
      return txDate >= cutoff;
    })();

    return matchesCategory && matchesBudget && matchesLocation && matchesStatus && matchesDate
      && matchesMerchant && matchesMinimum && matchesMaximum;
  });

  const totals = filteredTransactions.reduce(
    (acc, tx) => {
      const amount = Number(tx.amount || 0);
      acc.total += amount;
      if (amount > 0) acc.spend += amount;
      else acc.income += Math.abs(amount);
      acc.count += 1;
      return acc;
    },
    { total: 0, income: 0, spend: 0, count: 0 }
  );

  const reportRows = {};
  filteredTransactions.forEach((tx) => {
    const key = tx.categoryName || "Uncategorized";
    reportRows[key] = (reportRows[key] || 0) + Number(tx.amount || 0);
  });

  const verdictRows = Object.entries(reportRows).map(([category, total]) => {
    const pct = totals.total > 0 ? (total / totals.total) * 100 : 0;
    let status = "wise";
    if (pct > 20) status = "reconsider";
    else if (pct > 10) status = "caution";
    return { category, total, pct, status };
  }).sort((left, right) => right.total - left.total);

  const largestCategory = verdictRows[0];
  const largestCategoryAdvice = largestCategory
    ? largestCategory.category.toLowerCase().includes("food") || largestCategory.category.toLowerCase().includes("grocer")
      ? "Plan meals and shop with a list before the next budget period."
      : largestCategory.category.toLowerCase().includes("transport")
        ? "Compare public transport, carpooling, and trip costs before travelling."
        : largestCategory.category.toLowerCase().includes("entertainment")
          ? "Review subscriptions and recurring entertainment costs that may no longer be useful."
          : "Review the transactions in this category and decide which costs can be reduced next period."
    : "Upload a statement or log a transaction to receive spending advice.";

  function handleSearch() {
    setAppliedFilters({
      category: selectedCategory,
      status: statusFilter,
      location: locationTag,
      dateRange,
      merchant: merchantSearch.trim(),
      minimumAmount,
      maximumAmount,
      budgetId: selectedBudgetId,
    });
  }

  return (
    <AppLayout>
      <div className="app-page page-transition">
        <div className="app-page-header">
          <div>
            <h1 className="app-page-title">Reports & Analytics</h1>
            <p className="app-page-subtitle">See how spending is trending across categories and risk levels.</p>
          </div>
        </div>

        {error && <div className="app-error-banner">{error}</div>}

        <div className="app-panel">
          <div className="app-inline-form" style={{ flexWrap: "wrap", alignItems: "end" }}>
            <div className="app-inline-field">
              <label>Budget period</label>
              <select className="app-inline-select" value={selectedBudgetId} onChange={(e) => setSelectedBudgetId(e.target.value)}>
                <option value="all">All periods</option>
                {budgets.map((budget) => (
                  <option key={budget.id} value={budget.id}>
                    {budget.startDate} to {budget.endDate}
                  </option>
                ))}
              </select>
            </div>
            <div className="app-inline-field">
              <label>Category</label>
              <select className="app-inline-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="app-inline-field">
              <label>Risk status</label>
              <select className="app-inline-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="app-inline-field">
              <label>Location tag</label>
              <select className="app-inline-select" value={locationTag} onChange={(e) => setLocationTag(e.target.value)}>
                <option value="all">All</option>
                {locationOptions.filter((option) => option !== "all").map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="app-inline-field">
              <label>Date range</label>
              <select className="app-inline-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                <option value="all">All time</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 6 months</option>
              </select>
            </div>
            <div className="app-inline-field">
              <label>Merchant or description</label>
              <input className="app-inline-input" value={merchantSearch} onChange={(e) => setMerchantSearch(e.target.value)} placeholder="Search text" />
            </div>
            <div className="app-inline-field">
              <label>Minimum amount</label>
              <input className="app-inline-input" type="number" min="0" step="0.01" value={minimumAmount} onChange={(e) => setMinimumAmount(e.target.value)} placeholder="R0.00" />
            </div>
            <div className="app-inline-field">
              <label>Maximum amount</label>
              <input className="app-inline-input" type="number" min="0" step="0.01" value={maximumAmount} onChange={(e) => setMaximumAmount(e.target.value)} placeholder="No limit" />
            </div>
            <button type="button" className="app-inline-submit" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>

        {loading ? (
          <div className="app-state-message">Loading report data...</div>
        ) : (
          <>
            <div className="dashboard-stat-grid">
              <div className="dashboard-stat-card">
                <p className="dashboard-stat-label">Transactions in view</p>
                <p className="dashboard-stat-figure">{filteredTransactions.length}</p>
              </div>
              <div className="dashboard-stat-card">
                <p className="dashboard-stat-label">Net spend</p>
                <p className="dashboard-stat-figure">R{totals.total.toFixed(2)}</p>
              </div>
              <div className="dashboard-stat-card">
                <p className="dashboard-stat-label">Total expenses</p>
                <p className="dashboard-stat-figure">R{totals.spend.toFixed(2)}</p>
              </div>
              <div className="dashboard-stat-card">
                <p className="dashboard-stat-label">Largest category</p>
                <p className="dashboard-stat-figure">
                  {verdictRows[0]?.category || "—"}
                </p>
              </div>
              <div className="dashboard-stat-card">
                <p className="dashboard-stat-label">Total income</p>
                <p className="dashboard-stat-figure">R{totals.income.toFixed(2)}</p>
              </div>
              <div className="dashboard-stat-card">
                <p className="dashboard-stat-label">Top verdict</p>
                <p className="dashboard-stat-figure highlight">
                  {verdictRows.some((row) => row.status === "reconsider") ? "Reconsider" : verdictRows.some((row) => row.status === "caution") ? "Caution" : "Wise"}
                </p>
              </div>
            </div>

            <div className="app-panel">
              <h2 className="app-card-item-title" style={{ marginBottom: "0.5rem" }}>Spending insight</h2>
              <p className="app-card-item-desc" style={{ margin: 0 }}>
                {largestCategory
                  ? `${largestCategory.category} is your largest spending category at R${largestCategory.total.toFixed(2)} (${largestCategory.pct.toFixed(1)}% of the current view). ${largestCategoryAdvice}`
                  : largestCategoryAdvice}
              </p>
            </div>

            <div className="app-panel">
              <h2 className="app-card-item-title" style={{ marginBottom: "1rem" }}>Verdict matrix</h2>
              <div className="app-card-list">
                {verdictRows.length === 0 ? (
                  <div className="app-empty-state">
                    <p className="app-empty-title">No category data in this view</p>
                  </div>
                ) : (
                  verdictRows.map((row) => (
                    <div key={row.category} className="app-card-item" style={{ alignItems: "center" }}>
                      <div>
                        <p className="app-card-item-title">{row.category}</p>
                        <p className="app-card-item-desc">{row.pct.toFixed(1)}% of filtered spend</p>
                      </div>
                      <div className="app-table-actions">
                        <span className={`app-badge ${row.status === "wise" ? "app-badge-green" : row.status === "caution" ? "app-badge-amber" : "app-badge-red"}`}>
                          {row.status === "wise" ? "Wise" : row.status === "caution" ? "Caution" : "Reconsider"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="app-panel">
              <h2 className="app-card-item-title" style={{ marginBottom: "1rem" }}>Detailed ledger</h2>
              {filteredTransactions.length === 0 ? (
                <div className="app-empty-state">
                  <p className="app-empty-title">No transactions match the selected filters</p>
                </div>
              ) : (
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Source</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr key={`${tx.source || "Manual"}-${tx.id}`}>
                        <td>{tx.date}</td>
                        <td>{tx.categoryName}</td>
                        <td>{tx.locationTag || "—"}</td>
                        <td>
                          <span className={`app-badge ${tx.source === "Statement" ? "app-badge-teal" : "app-badge-green"}`}>
                            {tx.source || "Manual"}
                          </span>
                        </td>
                        <td>R{Number(tx.amount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default ReportsPage;
