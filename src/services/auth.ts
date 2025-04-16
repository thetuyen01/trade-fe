import api from "./api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  user: User;
  access_token: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
    localStorage.removeItem("access_token");
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get("/users/profile");
    return response.data;
  },

  saveToken(token: string): void {
    localStorage.setItem("access_token", token);
  },

  getToken(): string | null {
    return localStorage.getItem("access_token");
  },

  isLoggedIn(): boolean {
    return !!this.getToken();
  },
};
