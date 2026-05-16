import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
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

    const user = await ctx.db.get(userId);
    if (user && user.email) {
      await ctx.scheduler.runAfter(0, internal.emails.sendStatusEmail, {
        email: user.email,
        name: displayName || user.name || "User",
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

    const user = await ctx.db.get(userId);
    if (user && user.email) {
      const name = existing?.displayName || user.name || "User";
      await ctx.scheduler.runAfter(0, internal.emails.sendStatusEmail, {
        email: user.email,
        name,
        status,
        reason: rejectionReason,
      });
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
    
    // Clean up auth accounts and sessions
    const authAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("userId", (q: any) => q.eq("userId", userId))
      .collect();
    for (const a of authAccounts) {
      await ctx.db.delete(a._id);
    }
    
    const authSessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q: any) => q.eq("userId", userId))
      .collect();
    for (const s of authSessions) {
      await ctx.db.delete(s._id);
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

export const makeSuperAdminByEmail = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    // Convex auth stores email in users table by default when using email/password
    const users = await ctx.db.query("users").collect();
    const user = users.find((u: any) => u.email === email);
    if (!user) throw new Error("User not found: " + email);
    
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .unique();
      
    if (existing) {
      await ctx.db.patch(existing._id, { superAdmin: true, status: "approved", firstName: "Super", lastName: "Admin", displayName: "Super Admin" });
    } else {
      await ctx.db.insert("userProfiles", { userId: user._id, superAdmin: true, status: "approved", firstName: "Super", lastName: "Admin", displayName: "Super Admin" });
    }
  }
});

export const cleanOrphanedAccounts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("authAccounts").collect();
    for (const acc of accounts) {
      const user = await ctx.db.get(acc.userId);
      if (!user) {
        await ctx.db.delete(acc._id);
      }
    }
    const sessions = await ctx.db.query("authSessions").collect();
    for (const sess of sessions) {
      const user = await ctx.db.get(sess.userId);
      if (!user) {
        await ctx.db.delete(sess._id);
      }
    }
  }
});
