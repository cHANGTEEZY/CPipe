export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  role: string;
  status: string;
  avatar: string;
  joinDate: string;
}

export const ROLES = [
  "Admin",
  "Editor",
  "Viewer",
  "Moderator",
  "Contributor",
] as const;

export const STATUSES = ["Active", "Inactive", "Pending"] as const;
