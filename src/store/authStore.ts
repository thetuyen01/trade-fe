import { create } from "zustand";
import { authService } from "../services/auth";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      set({ error: errorMessage, isLoading: false });
    }
  },

  register: async (
    name: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register({
        name,
        email,
        password,
        passwordConfirmation,
      });
      authService.saveToken(response.access_token);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      set({ error: errorMessage, isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Logout failed";
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchUser: async () => {
    if (!authService.getToken()) return;

    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
