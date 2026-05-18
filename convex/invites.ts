import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
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
      q.eq("workspaceId", workspaceId).eq("userId", userId),
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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isInviteActive(invite: { acceptedAt?: number; expiresAt: number }) {
  return !invite.acceptedAt && invite.expiresAt > Date.now();
}

async function findUserByEmail(ctx: any, email: string) {
  const users = await ctx.db.query("users").collect();
  return users.find((u: any) => u.email?.toLowerCase() === email) ?? null;
}

/** Pending invites for the signed-in user's email */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user?.email) return [];

    const email = normalizeEmail(user.email);
    const invites = await ctx.db.query("invites").collect();
    const active = invites.filter(
      (i) => i.email.toLowerCase() === email && isInviteActive(i),
    );
    return Promise.all(
      active.map(async (invite) => {
        const workspace = await ctx.db.get(invite.workspaceId);
        const inviter = await ctx.db.get(invite.invitedBy);
        const inviterProfile = inviter
          ? await ctx.db
              .query("userProfiles")
              .withIndex("by_userId", (q: any) =>
                q.eq("userId", invite.invitedBy),
              )
              .unique()
          : null;
        return {
          ...invite,
          workspace,
          inviterName:
            inviterProfile?.displayName ?? inviter?.name ?? "Someone",
        };
      }),
    );
  },
});

/** Pending invites for a workspace (any member can view) */
export const listByWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    await requireMember(ctx, workspaceId);
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", workspaceId))
      .collect();
    return invites.filter(isInviteActive);
  },
});

/** Invite a user by email */
export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer"),
    ),
  },
  handler: async (ctx, { workspaceId, email, role }) => {
    const { userId } = await requireMember(ctx, workspaceId, "admin");
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail.includes("@")) {
      throw new Error("Enter a valid email address");
    }

    const targetUser = await findUserByEmail(ctx, normalizedEmail);
    if (targetUser) {
      const existingMember = await ctx.db
        .query("members")
        .withIndex("by_workspace_user", (q: any) =>
          q
            .eq("workspaceId", workspaceId)
            .eq("userId", targetUser._id),
        )
        .unique();
      if (existingMember) {
        throw new Error("This user is already a member of the workspace");
      }
    }

    const workspaceInvites = await ctx.db
      .query("invites")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", workspaceId))
      .collect();
    const duplicatePending = workspaceInvites.some(
      (i) => i.email === normalizedEmail && isInviteActive(i),
    );
    if (duplicatePending) {
      throw new Error("An invite is already pending for this email");
    }

    const token = crypto.randomUUID();
    const inviteId = await ctx.db.insert("invites", {
      workspaceId,
      email: normalizedEmail,
      role,
      token,
      invitedBy: userId,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    const workspace = await ctx.db.get(workspaceId);
    const inviter = await ctx.db.get(userId);
    const inviterProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .unique();

    const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";
    const inviteUrl = `${siteUrl}/accept-invite?token=${token}`;

    await ctx.scheduler.runAfter(0, internal.emails.sendWorkspaceInviteEmail, {
      email: normalizedEmail,
      workspaceName: workspace?.name ?? "a workspace",
      role,
      inviterName:
        inviterProfile?.displayName ?? inviter?.name ?? "A team member",
      inviteUrl,
    });

    return inviteId;
  },
});

/** Accept an invite by token */
export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await requireAuth(ctx);
    const user = await ctx.db.get(userId);
    if (!user?.email) {
      throw new Error("Your account has no email address");
    }

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q: any) => q.eq("token", token))
      .unique();
    if (!invite) throw new Error("Invalid or expired invite link");
    if (invite.acceptedAt) throw new Error("Invite already used");
    if (invite.expiresAt < Date.now()) throw new Error("Invite expired");

    if (normalizeEmail(user.email) !== invite.email) {
      throw new Error(
        `This invite was sent to ${invite.email}. Sign in with that email to accept.`,
      );
    }

    const existingMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_user", (q: any) =>
        q.eq("workspaceId", invite.workspaceId).eq("userId", userId),
      )
      .unique();
    if (existingMember) {
      await ctx.db.patch(invite._id, { acceptedAt: Date.now() });
      return invite.workspaceId;
    }

    const memberId = await ctx.db.insert("members", {
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role,
      joinedAt: Date.now(),
    });
    await ctx.db.patch(invite._id, { acceptedAt: Date.now() });

    const joiner = await ctx.db.get(userId);
    const joinerProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .unique();

    await ctx.db.insert("activity", {
      workspaceId: invite.workspaceId,
      entityType: "member",
      entityId: memberId,
      userId,
      action: "joined",
      meta: {
        role: invite.role,
        via: "invite",
        targetUserId: userId,
        targetName:
          joinerProfile?.displayName ??
          joiner?.name ??
          joiner?.email ??
          "Member",
      },
      createdAt: Date.now(),
    });

    return invite.workspaceId;
  },
});

/** Cancel a pending invite */
export const cancel = mutation({
  args: { inviteId: v.id("invites") },
  handler: async (ctx, { inviteId }) => {
    const invite = await ctx.db.get(inviteId);
    if (!invite) throw new Error("Invite not found");
    await requireMember(ctx, invite.workspaceId, "admin");
    if (invite.acceptedAt) throw new Error("Invite already accepted");
    await ctx.db.delete(inviteId);
  },
});
