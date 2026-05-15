import { api, tokenStore } from "@/lib/apiClient";
import { ENDPOINTS } from "./endpoints";
import type { ApiResponse } from "./types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

export type LoginResponse = AuthTokens & { user: AuthUser };

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>(ENDPOINTS.auth.login, payload);
    tokenStore.setToken(res.access_token);
    tokenStore.setRefreshToken(res.refresh_token);
    return res;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post<void>(ENDPOINTS.auth.logout);
    } finally {
      tokenStore.clearAll();
    }
  },

  me: () => api.get<ApiResponse<AuthUser>>(ENDPOINTS.auth.me),
};
