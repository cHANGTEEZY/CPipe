import { api } from "@/lib/apiClient";
import { ENDPOINTS } from "./endpoints";
import type { User } from "@/features/users/data/constants";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserFilters extends PaginationParams {
  search?: string;
  role?:   string;
  status?: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName:  string;
  email:     string;
  password:  string;
  phone?:    string;
  username?: string;
  role:      string;
  status?:   string;
}

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">>;

// ─── Users API ────────────────────────────────────────────────────────────────

export const usersApi = {
  /**
   * Fetch a paginated, filterable list of users.
   * @example
   * const res = await usersApi.list({ page: 1, perPage: 20, role: "Admin" });
   */
  list: (filters?: UserFilters) =>
    api.get<PaginatedResponse<User>>(ENDPOINTS.users.list, { params: filters }),

  /**
   * Fetch a single user by id.
   */
  get: (id: string | number) =>
    api.get<ApiResponse<User>>(ENDPOINTS.users.detail(id)),

  /**
   * Create a new user.
   */
  create: (payload: CreateUserPayload) =>
    api.post<ApiResponse<User>>(ENDPOINTS.users.create, payload),

  /**
   * Full update (PUT) of a user.
   */
  update: (id: string | number, payload: UpdateUserPayload) =>
    api.put<ApiResponse<User>>(ENDPOINTS.users.update(id), payload),

  /**
   * Partial update (PATCH) of a user.
   */
  patch: (id: string | number, payload: UpdateUserPayload) =>
    api.patch<ApiResponse<User>>(ENDPOINTS.users.update(id), payload),

  /**
   * Delete a user.
   */
  remove: (id: string | number) =>
    api.delete<void>(ENDPOINTS.users.delete(id)),

  /**
   * Upload a user's avatar with optional progress reporting.
   * @example
   * await usersApi.uploadAvatar(userId, file, (pct) => setProgress(pct));
   */
  uploadAvatar: (
    id:          string | number,
    file:        File,
    onProgress?: (percent: number) => void,
  ) => {
    const form = new FormData();
    form.append("avatar", file);
    return api.upload<ApiResponse<User>>(ENDPOINTS.users.avatar(id), form, onProgress);
  },
};
