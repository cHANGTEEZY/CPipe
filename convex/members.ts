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

/** List all members of a workspace */
export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    await requireAuth(ctx);
    const members = await ctx.db
      .query("members")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", workspaceId))
      .collect();
    const withUsers = await Promise.all(
      members.map(async (m: any) => {
        const user = await ctx.db.get(m.userId);
        return { ...m, user };
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

/** Invite a user by email */
export const invite = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer")
    ),
  },
  handler: async (ctx, { workspaceId, email, role }) => {
    const { userId } = await requireMember(ctx, workspaceId, "admin");
    const token = `${Math.random().toString(36).slice(2)}${Date.now()}`;
    return await ctx.db.insert("invites", {
      workspaceId,
      email,
      role,
      token,
      invitedBy: userId,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  },
});

/** Accept an invite by token */
export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await requireAuth(ctx);
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q: any) => q.eq("token", token))
      .unique();
    if (!invite) throw new Error("Invalid invite token");
    if (invite.acceptedAt) throw new Error("Invite already used");
    if (invite.expiresAt < Date.now()) throw new Error("Invite expired");

    const memberId = await ctx.db.insert("members", {
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role,
      joinedAt: Date.now(),
    });
    await ctx.db.patch(invite._id, { acceptedAt: Date.now() });
    
    await ctx.db.insert("activity", {
      workspaceId: invite.workspaceId,
      entityType: "member",
      entityId: memberId,
      userId,
      action: "joined",
      meta: { role: invite.role },
      createdAt: Date.now(),
    });
    
    return invite.workspaceId;
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
    await requireMember(ctx, member.workspaceId, "admin");
    const userId = await requireAuth(ctx);
    await ctx.db.patch(memberId, { role });
    
    await ctx.db.insert("activity", {
      workspaceId: member.workspaceId,
      entityType: "member",
      entityId: memberId,
      userId,
      action: "role_updated",
      meta: { role },
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
    await requireMember(ctx, member.workspaceId, "admin");
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
