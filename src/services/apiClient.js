// Base URL for your ASP.NET Core backend.
const API_BASE_URL = "http://localhost:5199/api";

const ACCESS_TOKEN_KEY = "accessToken";

// --- Token storage helpers ---

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function notifyFinancialDataChanged() {
  window.dispatchEvent(new CustomEvent("EduWallet:FinancialDataChanged"));
}

// --- Core request function ---

async function request(endpoint, options = {}) {
  const accessToken = getAccessToken();

  const headers = {
    ...options.headers,
  };

  // Only set Content-Type when there's a body to avoid preflight on simple GET requests
  if (options.body !== undefined && options.body !== null) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.startsWith("/Auth/login")) {
    clearAccessToken();
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    return null;
  }

  return handleResponse(response);
}

async function handleResponse(response) {
  if (!response) return null;

  const rawText = await response.text().catch(() => "");
  let data = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  if (!response.ok) {
    const validationMessages = data && typeof data === "object" && data.errors
      ? Object.values(data.errors).flat().filter(Boolean).join(" ")
      : "";

    const message = typeof data === "string"
      ? data
      : data?.message || data?.detail || data?.title || validationMessages ||
        (response.status === 400 ? "Please check the information entered and try again."
          : response.status === 401 && response.url?.includes("/Auth/login") ? "Incorrect email or password."
            : response.status === 403 ? "You do not have permission to perform this action."
              : response.status >= 500 ? "The server could not complete the request. Please try again."
                : "Something went wrong.");

    // Log detailed error info for debugging
    console.error(`API Error (${response.status}):`, {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      message,
      fullData: data
    });

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

// --- Convenience methods ---

export async function apiGet(endpoint) {
  return request(endpoint, { method: "GET" });
}

export async function apiPost(endpoint, body) {
  return request(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPut(endpoint, body) {
  return request(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function apiPatch(endpoint, body) {
  return request(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function apiDelete(endpoint) {
  return request(endpoint, {
    method: "DELETE",
  });
}
