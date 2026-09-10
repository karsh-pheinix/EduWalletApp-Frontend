import { Navigate } from "react-router-dom";
import { hasAdminAccess } from "../services/authUtils";

function AdminRoute({ children }) {
  return hasAdminAccess() ? children : <Navigate to="/dashboard" replace />;
}

export default AdminRoute;