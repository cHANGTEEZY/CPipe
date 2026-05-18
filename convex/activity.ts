import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAuth(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

async function requireWorkspaceMember(ctx: any, workspaceId: any) {
  const userId = await requireAuth(ctx);
  const member = await ctx.db
    .query("members")
    .withIndex("by_workspace_user", (q: any) =>
      q.eq("workspaceId", workspaceId).eq("userId", userId),
    )
    .unique();
  if (!member) throw new Error("Not a member of this workspace");
  return { userId, member };
}

/** Get activity log for a workspace (any workspace member) */
export const listByWorkspace = query({
  args: { workspaceId: v.id("workspaces"), limit: v.optional(v.number()) },
  handler: async (ctx, { workspaceId, limit }) => {
    await requireWorkspaceMember(ctx, workspaceId);
    const logs = await ctx.db
      .query("activity")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .take(limit ?? 200);
    
    const enriched = await Promise.all(
      logs.map(async (log: any) => {
        const user = await ctx.db.get(log.userId);
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q: any) => q.eq("userId", log.userId))
          .unique();
        
        const userWithProfile = { ...user, profile };
        let targetName = "Unknown";
        let projectName = undefined;

        if (log.projectId) {
          const project = await ctx.db.get(log.projectId as any);
          projectName = (project as any)?.name;
        }
        
        if (log.entityType === "card") {
          const card = await ctx.db.get(log.entityId as any);
          targetName = (card as any)?.title || "Deleted Card";
        } else if (log.entityType === "project") {
          const project = await ctx.db.get(log.entityId as any);
          targetName = (project as any)?.name || "Deleted Project";
        } else if (log.entityType === "column") {
          const column = await ctx.db.get(log.entityId as any);
          targetName = (column as any)?.name || "Deleted Column";
        } else if (log.entityType === "workspace") {
          const workspace = await ctx.db.get(log.entityId as any);
          targetName = (workspace as any)?.name || "Deleted Workspace";
        } else if (log.entityType === "member") {
          if (log.meta?.targetName) {
            targetName = log.meta.targetName;
          } else if (log.meta?.targetUserId) {
            const targetUser = await ctx.db.get(log.meta.targetUserId as any);
            const targetProfile = await ctx.db
              .query("userProfiles")
              .withIndex("by_userId", (q: any) =>
                q.eq("userId", log.meta.targetUserId),
              )
              .unique();
            targetName =
              targetProfile?.displayName ??
              targetUser?.name ??
              targetUser?.email ??
              "Member";
          } else {
            const member = await ctx.db.get(log.entityId as any);
            if (member) {
              const memberUser = await ctx.db.get((member as any).userId);
              const memberProfile = await ctx.db
                .query("userProfiles")
                .withIndex("by_userId", (q: any) =>
                  q.eq("userId", (member as any).userId),
                )
                .unique();
              targetName =
                memberProfile?.displayName ??
                memberUser?.name ??
                memberUser?.email ??
                "Member";
            } else if (log.meta?.removedUserId) {
              const removedUser = await ctx.db.get(log.meta.removedUserId as any);
              const removedProfile = await ctx.db
                .query("userProfiles")
                .withIndex("by_userId", (q: any) =>
                  q.eq("userId", log.meta.removedUserId),
                )
                .unique();
              targetName =
                removedProfile?.displayName ??
                removedUser?.name ??
                removedUser?.email ??
                "Removed Member";
            }
          }
        }
        
        // Additional enrichment for moved cards
        if (log.entityType === "card" && log.action === "moved") {
          const fromCol = log.meta?.fromColumnId ? await ctx.db.get(log.meta.fromColumnId as any) : null;
          const toCol = log.meta?.toColumnId ? await ctx.db.get(log.meta.toColumnId as any) : null;
          log.meta = { 
            ...log.meta, 
            fromColumnName: (fromCol as any)?.name || "Unknown",
            toColumnName: (toCol as any)?.name || "Unknown" 
          };
        }
        
        return { ...log, user: userWithProfile, targetName, projectName };
      })
    );
    return enriched;
  },
});

/** Get activity log for an entity (paginated) */
export const list = query({
  args: { entityId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { entityId, limit }) => {
    await requireAuth(ctx);
    const logs = await ctx.db
      .query("activity")
      .withIndex("by_entity", (q: any) => q.eq("entityId", entityId))
      .order("desc")
      .take(limit ?? 20);
    const withUsers = await Promise.all(
      logs.map(async (log: any) => {
        const user = await ctx.db.get(log.userId);
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q: any) => q.eq("userId", log.userId))
          .unique();
        return { ...log, user: { ...user, profile } };
      })
    );
    return withUsers;
  },
});
