import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAuth(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

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

async function requireOwner(ctx: any, workspaceId: any) {
  const { member } = await requireMember(ctx, workspaceId);
  if (member.role !== "owner") {
    throw new Error("Only the workspace owner can manage member roles");
  }
  return member;
}

/** List all members of a workspace (any member can view) */
export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    await requireMember(ctx, workspaceId);
    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", workspaceId))
      .collect();
    const withUsers = await Promise.all(
      members.map(async (m: any) => {
        const user = await ctx.db.get(m.userId);
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q: any) => q.eq("userId", m.userId))
          .unique();
        return { ...m, user: { ...user, profile } };
      })
    );
    return withUsers;
  },
});

/** Get current user's membership in a workspace */
export const getMyMembership = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("members")
      .withIndex("by_workspace_user", (q: any) =>
        q.eq("workspaceId", workspaceId).eq("userId", userId)
      )
      .unique();
  },
});

/** Update a member's role */
export const updateRole = mutation({
  args: {
    memberId: v.id("members"),
    role: v.union(
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer")
    ),
  },
  handler: async (ctx, { memberId, role }) => {
    const member = await ctx.db.get(memberId);
    if (!member) throw new Error("Member not found");
    if (member.role === "owner") {
      throw new Error("Cannot change the owner's role");
    }
    await requireOwner(ctx, member.workspaceId);
    const userId = await requireAuth(ctx);
    await ctx.db.patch(memberId, { role });

    const targetUser = await ctx.db.get(member.userId);
    const targetProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", member.userId))
      .unique();

    await ctx.db.insert("activity", {
      workspaceId: member.workspaceId,
      entityType: "member",
      entityId: memberId,
      userId,
      action: "role_updated",
      meta: {
        role,
        targetUserId: member.userId,
        targetName:
          targetProfile?.displayName ??
          targetUser?.name ??
          targetUser?.email ??
          "Member",
      },
      createdAt: Date.now(),
    });
  },
});

/** Remove a member */
export const remove = mutation({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }) => {
    const member = await ctx.db.get(memberId);
    if (!member) throw new Error("Member not found");
    if (member.role === "owner") {
      throw new Error("Cannot remove the workspace owner");
    }
    await requireOwner(ctx, member.workspaceId);
    const userId = await requireAuth(ctx);
    await ctx.db.delete(memberId);
    
    await ctx.db.insert("activity", {
      workspaceId: member.workspaceId,
      entityType: "member",
      entityId: memberId,
      userId,
      action: "removed",
      meta: { removedUserId: member.userId },
      createdAt: Date.now(),
    });
  },
});
