import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getAccessToken } from "./services/apiClient";
import WelcomeGatePage from "./pages/WelcomeGatePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import IncomeSourcesPage from "./pages/IncomeSourcesPage";
import IncomeRecordsPage from "./pages/IncomeRecordsPage";
import ExpensesPage from "./pages/ExpensesPage";
import CategoriesPage from "./pages/CategoriesPage";
import BudgetPage from "./pages/BudgetPage";
import BudgetPeriodsPage from "./pages/BudgetPeriodsPage";
import TransactionsPage from "./pages/Transaction";
import BankStatementsPage from "./pages/BankStatementsPage";
import ReportsPage from "./pages/ReportsPage";
import TipsPage from "./pages/TipsPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import AdminRoute from "./components/AdminRoute";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import FeedbackPopup from "./components/FeedbackPopup";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminTipsPage from "./pages/AdminTipsPage";

function ProtectedRoute({ children }) {
  return getAccessToken() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <FeedbackPopup />
      <Routes>
        <Route path="/" element={<WelcomeGatePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/income-sources" element={<ProtectedRoute><IncomeSourcesPage /></ProtectedRoute>} />
        <Route path="/income-records" element={<ProtectedRoute><IncomeRecordsPage /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
        <Route path="/budget" element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
        <Route path="/budget-periods" element={<ProtectedRoute><BudgetPeriodsPage /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
        <Route path="/bank-statements" element={<ProtectedRoute><BankStatementsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/tips" element={<ProtectedRoute><TipsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><AdminCategoriesPage /></AdminRoute>} />
        <Route path="/admin/tips" element={<AdminRoute><AdminTipsPage /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;