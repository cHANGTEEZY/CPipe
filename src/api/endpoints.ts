/**
 * Centralised endpoint registry.
 *
 * Rules:
 *  - Static paths are plain strings.
 *  - Dynamic paths are arrow functions so callers never hand-concat strings.
 *  - The `as const` assertion lets TypeScript narrow literal types for
 *    the static entries.
 */
export const ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    login:   "/auth/login",
    logout:  "/auth/logout",
    refresh: "/auth/refresh",
    me:      "/auth/me",
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  users: {
    list:   "/users",
    create: "/users",
    detail: (id: string | number) => `/users/${id}`,
    update: (id: string | number) => `/users/${id}`,
    delete: (id: string | number) => `/users/${id}`,
    avatar: (id: string | number) => `/users/${id}/avatar`,
  },
} as const;
