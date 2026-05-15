// ─── Generic response shapes ──────────────────────────────────────────────────

/** Single-resource response envelope: { data: T, message?: string } */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** Paginated list response envelope */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total:    number;
  page:     number;
  perPage:  number;
  lastPage: number;
}

// ─── Request param shapes ─────────────────────────────────────────────────────

export interface PaginationParams {
  page?:    number;
  perPage?: number;
  sortBy?:  string;
  sortDir?: "asc" | "desc";
}
