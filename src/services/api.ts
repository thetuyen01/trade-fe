import axios from "axios";
import { authService } from "./auth";

// Create a base API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const publicEndpoints = ["/auth/login", "/auth/register", "/products"];
    if (publicEndpoints.includes(config.url || "")) {
      console.log("Public endpoint:", config.url);
      return config;
    }

    const token = authService.getToken();
    if (token) {
      console.log(`Adding Authorization header for URL: ${config.url}`);
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn(`No auth token available for request to: ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("Error:", error);
    if (error.response && error.response.status === 401) {
      authService.removeToken();
    }
    return Promise.reject(error.response.data);
  }
);

export default api;
