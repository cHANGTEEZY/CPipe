import type { AuthUser } from "@/api/auth";

export type ProfileDemo = AuthUser & {
  phone: string;
  jobTitle: string;
  timezone: string;
  bio: string;
  memberSinceLabel: string;
  weeklyDigestEmail: boolean;
  showOnlineStatus: boolean;
};

/** Static seed data — swap for API payloads later. */
export const MOCK_USER: ProfileDemo = {
  id: "ctz_23",
  email: "chang@example.com",
  firstName: "Chang",
  lastName: "Teezy",
  role: "administrator",
  avatar: undefined,
  phone: "+1 (555) 012-3491",
  jobTitle: "Senior Software Engineer",
  timezone: "America/Los_Angeles",
  bio: "Focused on internal tools and design systems. Based in Oakland; working across product, research, and engineering.",
  memberSinceLabel: "January 2024",
  weeklyDigestEmail: true,
  showOnlineStatus: false,
};
