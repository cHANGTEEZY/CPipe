export type ProfileDemo = {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  phone: string;
  jobTitle: string;
  timezone: string;
  bio: string;
  memberSinceLabel?: string;
  weeklyDigestEmail: boolean;
  showOnlineStatus: boolean;
  location?: string;
};

/** Fallback seed data — replaced at runtime by Convex `getMe` query */
export const MOCK_USER: ProfileDemo = {
  firstName: "Chang",
  lastName: "Teezy",
  email: "chang@example.com",
  avatar: undefined,
  phone: "+1 (555) 012-3491",
  jobTitle: "Senior Software Engineer",
  timezone: "America/Los_Angeles",
  bio: "Focused on internal tools and design systems. Based in Oakland; working across product, research, and engineering.",
  memberSinceLabel: "January 2024",
  weeklyDigestEmail: true,
  showOnlineStatus: false,
};
