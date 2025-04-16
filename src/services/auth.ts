import api from "./api";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

interface User {
  id: string;
  fullName: string;
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
    this.removeToken();
    await api.post("/auth/logout");
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get("/users/profile");
    return response.data;
  },

  saveToken(token: string): void {
    const expirationTime = new Date();
    expirationTime.setDate(expirationTime.getDate() + 1); // Set expiration to 1 day from now

    const tokenData = {
      token,
      expiresAt: expirationTime.getTime(),
    };

    localStorage.setItem("access_token", JSON.stringify(tokenData));
  },

  getToken(): string | null {
    const tokenData = localStorage.getItem("access_token");

    if (!tokenData) return null;

    try {
      const { token, expiresAt } = JSON.parse(tokenData);

      // Check if token is expired
      if (Date.now() > expiresAt) {
        this.removeToken();
        return null;
      }

      return token;
    } catch (error) {
      this.removeToken();
      return null;
    }
  },

  isLoggedIn(): boolean {
    return !!this.getToken();
  },

  removeToken(): void {
    localStorage.removeItem("access_token");
  },

  isTokenExpired(): boolean {
    const tokenData = localStorage.getItem("access_token");

    if (!tokenData) return true;

    try {
      const { expiresAt } = JSON.parse(tokenData);
      return Date.now() > expiresAt;
    } catch (error) {
      return true;
    }
  },
};
