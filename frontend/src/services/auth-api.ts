import { apiClient } from "./api-client";
import type { LoginRequest, RegisterRequest, TokenResponse } from "@/types/auth";

export const authApi = {
  login(data: LoginRequest): Promise<TokenResponse> {
    return apiClient.post("/auth/login", data);
  },

  register(data: RegisterRequest): Promise<TokenResponse> {
    return apiClient.post("/auth/register", data);
  },

  logout(): Promise<void> {
    return apiClient.delete("/auth/logout");
  },
};
