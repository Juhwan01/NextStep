import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  timeout: 300000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("nextstep_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("nextstep_token");
      localStorage.removeItem("nextstep_user");
      // Sync auth store if loaded
      try {
        const { useAuthStore } = require("@/stores/auth-store");
        useAuthStore.getState().clearAuth();
      } catch {
        // Store not yet loaded — localStorage cleanup is sufficient
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient };
