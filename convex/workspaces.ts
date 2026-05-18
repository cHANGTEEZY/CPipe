import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to assert auth
async function requireAuth(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

// Helper to assert workspace membership
async function requireMember(ctx: any, workspaceId: any, minRole?: string) {
  const userId = await requireAuth(ctx);
  const member = await ctx.db
    .query("members")
    .withIndex("by_workspace_user", (q: any) =>
      q.eq("workspaceId", workspaceId).eq("userId", userId)
    )
    .unique();
  if (!member) throw new Error("Not a member of this workspace");
  const roleOrder = { viewer: 0, editor: 1, admin: 2, owner: 3 };
  if (
    minRole &&
    roleOrder[member.role as keyof typeof roleOrder] <
      roleOrder[minRole as keyof typeof roleOrder]
  ) {
    throw new Error("Insufficient permissions");
  }
  return { userId, member };
}

/** List all workspaces the current user belongs to */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const memberships = await ctx.db
      .query("members")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    const workspaces = await Promise.all(
      memberships.map((m: any) => ctx.db.get(m.workspaceId))
    );
    return workspaces.filter(Boolean);
  },
});

/** Get a single workspace by slug */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    await requireAuth(ctx);
    return await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

/** Create a new workspace */
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await requireAuth(ctx);
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 40);
    // Ensure unique slug
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const workspaceId = await ctx.db.insert("workspaces", {
      name,
      slug: finalSlug,
      ownerId: userId,
      createdAt: Date.now(),
    });
    // Auto-add owner as member
    await ctx.db.insert("members", {
      workspaceId,
      userId,
      role: "owner",
      joinedAt: Date.now(),
    });
    return workspaceId;
  },
});

/** Update workspace name */
export const update = mutation({
  args: { workspaceId: v.id("workspaces"), name: v.string() },
  handler: async (ctx, { workspaceId, name }) => {
    await requireMember(ctx, workspaceId, "admin");
    await ctx.db.patch(workspaceId, { name });
  },
});

/** Delete workspace (owner only) */
export const remove = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    await requireMember(ctx, workspaceId, "owner");

    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", workspaceId))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    const invites = await ctx.db
      .query("invites")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", workspaceId))
      .collect();
    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", workspaceId))
      .collect();
    const now = Date.now();
    for (const project of projects) {
      await ctx.db.patch(project._id, { deletedAt: now });
    }

    await ctx.db.delete(workspaceId);
  },
});
