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
    console.error("API Error:", error);

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error message:", error.message);
    }

    if (error.response && error.response.status === 401) {
      // Clear token and notify about unauthorized access
      console.log("Unauthorized access detected, clearing tokens");
      authService.removeToken();
    }
    return Promise.reject(error);
  }
);

export default api;
