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
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 (expired/invalid token).
// Clears stale token and redirects to login to prevent silent failures.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      // Don't redirect if already on login or making a login request
      if (path !== "/login" && !error.config?.url?.includes("/auth/login")) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
