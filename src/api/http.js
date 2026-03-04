// Centralized Axios client for all API requests.
// Keeps base URL and auth header logic in one place.
// Must NOT contain React code or UI logic.
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  console.error("VITE_API_URL is not set. API requests may fail.");
}

export const http = axios.create({
  baseURL: baseURL || "/api",
  timeout: 15000,
});

// Attach JWT token automatically on each request.
http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 (expired/invalid token) or 403 (deactivated account).
// Clears stale token and redirects to login to prevent silent failures.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const path = window.location.pathname;
    const isLoginReq = error.config?.url?.includes("/auth/login");
    const isDeactivated = status === 403 && error.response?.data?.message === "Account is deactivated.";

    if ((status === 401 || isDeactivated) && path !== "/login" && !isLoginReq) {
      sessionStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
