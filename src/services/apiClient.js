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

// --- Core request function ---

async function request(endpoint, options = {}) {
  const accessToken = getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAccessToken();
    window.location.href = "/login";
    return null;
  }

  return handleResponse(response);
}

async function handleResponse(response) {
  if (!response) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || data?.title || "Something went wrong.";
    throw new Error(message);
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