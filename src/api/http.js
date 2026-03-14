// Centralized Axios client for all API requests.
// Keeps base URL and auth header logic in one place.
// Must NOT contain React code or UI logic.
import axios from "axios";
import logger from "../utils/logger";

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  logger.error("VITE_API_URL is not set. API requests may fail.");
}

export const http = axios.create({
  baseURL: baseURL || "/api",
  timeout: 15000,
});

// Track request start time for duration logging
http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Attach start time for response logging
  config.metadata = { startTime: Date.now() };

  logger.debug(`API Request: ${config.method.toUpperCase()} ${config.url}`, {
    method: config.method,
    url: config.url,
    params: config.params,
  });

  return config;
});

// Auto-logout on 401 (expired/invalid token) or 403 (deactivated account).
// Clears stale token and redirects to login to prevent silent failures.
http.interceptors.response.use(
  (response) => {
    // Log successful response
    if (response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      logger.logApiCall(
        response.config.method.toUpperCase(),
        response.config.url,
        response.status,
        duration
      );
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const path = window.location.pathname;
    const isLoginReq = error.config?.url?.includes("/auth/login");
    const isDeactivated = status === 403 && error.response?.data?.message === "Account is deactivated.";

    // Log failed response
    if (error.config?.metadata) {
      const duration = Date.now() - error.config.metadata.startTime;
      logger.logApiCall(
        error.config.method.toUpperCase(),
        error.config.url,
        status || 'unknown',
        duration,
        error.response?.data?.message || error.message
      );
    }

    if ((status === 401 || isDeactivated) && path !== "/login" && !isLoginReq) {
      logger.warn('Session expired or account deactivated - redirecting to login', { status });
      sessionStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default http;

