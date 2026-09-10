import { getAccessToken } from "./apiClient";

export function hasAdminAccess() {
  if (localStorage.getItem("isAdmin") === "true") return true;

  const token = getAccessToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const roles = payload.role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    return Array.isArray(roles) ? roles.includes("Admin") : roles === "Admin";
  } catch {
    return false;
  }
}