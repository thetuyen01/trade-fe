import { create } from "zustand";
import { authService } from "../services/auth";

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (
    email: string,
    password: string
  ) => Promise<{
    status: number;
    message: string;
  }>;
  register: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<{ status: number; message: string }>;
  logout: () => Promise<{ status: number; message: string }>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
  checkTokenExpiration: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!authService.getToken(),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      authService.saveToken(response.access_token);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
      return { status: 200, message: "Login successful" };
    } catch (error: any) {
      set({ error: error?.message, isLoading: false });
      throw error;
    }
  },

  register: async (fullName: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.register({
        fullName: fullName,
        email,
        password,
      });
      set({ isLoading: false });
      return { status: 201, message: "Registration successful" };
    } catch (error: any) {
      set({ error: error?.message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      authService.removeToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
      return { status: 200, message: "Logout successful" };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Logout failed";
      set({ error: errorMessage, isLoading: false });
      return { status: 500, message: "Logout failed" };
    }
  },

  fetchUser: async () => {
    if (!authService.getToken()) return;

    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      authService.removeToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  checkTokenExpiration: () => {
    if (authService.isTokenExpired()) {
      authService.removeToken();
      set({ user: null, isAuthenticated: false });
    }
  },
}));
