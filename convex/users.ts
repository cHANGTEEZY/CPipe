import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAuth(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

async function requireSuperAdmin(ctx: any) {
  const userId = await requireAuth(ctx);
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();
  if (!profile?.superAdmin) throw new Error("Superadmin only");
  return userId;
}

/** Get current user profile */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .unique();
    return { ...user, profile };
  },
});

/** Update user profile */
export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
  },
  handler: async (ctx, patch) => {
    const userId = await requireAuth(ctx);
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("userProfiles", { userId, ...patch });
    }
  },
});

/** Initialize new user profile (called after signup) */
export const initNewUser = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, { firstName, lastName }) => {
    const userId = await requireAuth(ctx);
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .unique();
    const displayName = [firstName, lastName].filter(Boolean).join(" ") || undefined;
    // Don't overwrite superAdmin status if it already exists
    if (existing) {
      if (existing.superAdmin) return; // superadmin stays approved
      await ctx.db.patch(existing._id, {
        firstName,
        lastName,
        displayName,
        status: "pending",
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        firstName,
        lastName,
        displayName,
        status: "pending",
      });
    }
  },
});

/** List all users (super admin only) */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    const withProfiles = await Promise.all(
      users.map(async (u: any) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q: any) => q.eq("userId", u._id))
          .unique();
        return { ...u, profile };
      })
    );
    return withProfiles;
  },
});

/** Update user status (super admin only) */
export const updateStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("suspended"),
      v.literal("banned")
    ),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, { userId, status, rejectionReason }) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .unique();
    const patch: any = { status };
    if (rejectionReason !== undefined) patch.rejectionReason = rejectionReason;
    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("userProfiles", { userId, ...patch });
    }
  },
});

/** Delete a user (super admin only) */
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireSuperAdmin(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .unique();
    if (profile) await ctx.db.delete(profile._id);
    // Remove from all workspaces
    const memberships = await ctx.db
      .query("members")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    for (const m of memberships) {
      await ctx.db.delete(m._id);
    }
    await ctx.db.delete(userId);
  },
});

/** Set super admin (for bootstrapping - only works if no superadmin exists) */
export const bootstrapSuperAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    // Check if any superadmin exists
    const allProfiles = await ctx.db.query("userProfiles").collect();
    const hasSuperAdmin = allProfiles.some((p: any) => p.superAdmin === true);
    if (hasSuperAdmin) throw new Error("Super admin already exists");
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { superAdmin: true, status: "approved" });
    } else {
      await ctx.db.insert("userProfiles", { userId, superAdmin: true, status: "approved" });
    }
  },
});
