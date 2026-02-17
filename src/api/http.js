// Centralized Axios client for all API requests.
// Keeps base URL and auth header logic in one place.
import axios from "axios";

export const http = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach JWT token automatically on each request.
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
