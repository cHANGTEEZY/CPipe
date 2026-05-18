/** Display a stored tag slug (e.g. on_track → On Track). */
export function formatTagLabel(value: string): string {
  return value
    .trim()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Normalize user input into a stable tag key. */
export function normalizeTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "");
}
