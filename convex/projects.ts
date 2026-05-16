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

/** List active projects in a workspace */
export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_user", (q: any) =>
        q.eq("workspaceId", workspaceId).eq("userId", userId)
      )
      .unique();
      
    if (!member) return [];

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_workspace", (q: any) =>
        q.eq("workspaceId", workspaceId)
      )
      .collect();
    return projects.filter((p: any) => !p.deletedAt);
  },
});

/** Get single project */
export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const project = await ctx.db.get(projectId);
    if (!project) return null;

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_user", (q: any) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", userId)
      )
      .unique();
      
    if (!member) throw new Error("Not a member of this workspace");
    
    return project;
  },
});

/** Create a project + seed 3 default columns */
export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    pointsEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, { workspaceId, name, description, pointsEnabled }) => {
    const { userId } = await requireMember(ctx, workspaceId, "editor");
    const projectId = await ctx.db.insert("projects", {
      workspaceId,
      name,
      description,
      pointsEnabled: pointsEnabled ?? false,
      createdBy: userId,
      createdAt: Date.now(),
    });
    // Seed default columns
    const defaults = ["To Do", "Doing", "Done"];
    for (let i = 0; i < defaults.length; i++) {
      await ctx.db.insert("columns", {
        projectId,
        name: defaults[i],
        order: i,
        createdAt: Date.now(),
      });
    }
    await ctx.db.insert("activity", {
      workspaceId,
      projectId,
      entityType: "project",
      entityId: projectId,
      userId,
      action: "created",
      meta: { name },
      createdAt: Date.now(),
    });
    return projectId;
  },
});

/** Update project metadata */
export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    pointsEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, { projectId, ...patch }) => {
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");
    await requireMember(ctx, project.workspaceId, "editor");
    const userId = await requireAuth(ctx);
    await ctx.db.patch(projectId, patch);
    await ctx.db.insert("activity", {
      workspaceId: project.workspaceId,
      projectId,
      entityType: "project",
      entityId: projectId,
      userId,
      action: "updated",
      meta: patch,
      createdAt: Date.now(),
    });
  },
});

/** Soft-delete a project */
export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");
    await requireMember(ctx, project.workspaceId, "admin");
    const userId = await requireAuth(ctx);
    await ctx.db.patch(projectId, { deletedAt: Date.now() });
    await ctx.db.insert("activity", {
      workspaceId: project.workspaceId,
      projectId,
      entityType: "project",
      entityId: projectId,
      userId,
      action: "deleted",
      createdAt: Date.now(),
    });
  },
});
