import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

async function requireAuth(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

async function requireProjectMember(ctx: any, projectId: Id<"projects">) {
  const userId = await requireAuth(ctx);
  const project = await ctx.db.get(projectId);
  if (!project || project.deletedAt) throw new Error("Project not found");

  const member = await ctx.db
    .query("members")
    .withIndex("by_workspace_user", (q: any) =>
      q.eq("workspaceId", project.workspaceId).eq("userId", userId),
    )
    .unique();
  if (!member) throw new Error("Not a member of this workspace");
  return { userId, member, project };
}

function canEditProjectTodo(role: string) {
  const roleOrder = { viewer: 0, editor: 1, admin: 2, owner: 3 };
  return roleOrder[role as keyof typeof roleOrder] >= roleOrder.editor;
}

const scopeValidator = v.union(v.literal("project"), v.literal("personal"));

export const list = query({
  args: {
    projectId: v.id("projects"),
    scope: scopeValidator,
  },
  handler: async (ctx, { projectId, scope }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const project = await ctx.db.get(projectId);
    if (!project || project.deletedAt) return [];

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) return [];

    if (scope === "personal") {
      const todos = await ctx.db
        .query("projectTodos")
        .withIndex("by_project_user", (q) =>
          q.eq("projectId", projectId).eq("userId", userId),
        )
        .collect();
      return todos
        .filter((t) => t.scope === "personal")
        .sort((a, b) => a.order - b.order);
    }

    const todos = await ctx.db
      .query("projectTodos")
      .withIndex("by_project_scope", (q) =>
        q.eq("projectId", projectId).eq("scope", "project"),
      )
      .collect();
    return todos.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    scope: scopeValidator,
    title: v.string(),
  },
  handler: async (ctx, { projectId, scope, title }) => {
    const trimmed = title.trim();
    if (!trimmed) throw new Error("Title is required");

    const { userId, member } = await requireProjectMember(ctx, projectId);

    if (scope === "project" && !canEditProjectTodo(member.role)) {
      throw new Error("Insufficient permissions");
    }

    const existing = await ctx.db
      .query("projectTodos")
      .withIndex(
        scope === "personal" ? "by_project_user" : "by_project_scope",
        (q) =>
          scope === "personal"
            ? q.eq("projectId", projectId).eq("userId", userId)
            : q.eq("projectId", projectId).eq("scope", "project"),
      )
      .collect();

    const scoped = existing.filter((t) => t.scope === scope);
    const maxOrder = scoped.reduce((max, t) => Math.max(max, t.order), -1);

    return await ctx.db.insert("projectTodos", {
      projectId,
      scope,
      userId: scope === "personal" ? userId : undefined,
      title: trimmed,
      pinned: false,
      completed: false,
      order: maxOrder + 1,
      createdAt: Date.now(),
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    todoId: v.id("projectTodos"),
    title: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
    completed: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, { todoId, ...patch }) => {
    const todo = await ctx.db.get(todoId);
    if (!todo) throw new Error("Todo not found");

    const { userId, member } = await requireProjectMember(ctx, todo.projectId);

    if (todo.scope === "project") {
      if (!canEditProjectTodo(member.role)) {
        throw new Error("Insufficient permissions");
      }
    } else if (todo.userId !== userId) {
      throw new Error("Insufficient permissions");
    }

    const updates: Record<string, unknown> = {};
    if (patch.title !== undefined) {
      const trimmed = patch.title.trim();
      if (!trimmed) throw new Error("Title is required");
      updates.title = trimmed;
    }
    if (patch.pinned !== undefined) updates.pinned = patch.pinned;
    if (patch.completed !== undefined) updates.completed = patch.completed;
    if (patch.order !== undefined) updates.order = patch.order;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(todoId, updates);
    }
  },
});

export const remove = mutation({
  args: { todoId: v.id("projectTodos") },
  handler: async (ctx, { todoId }) => {
    const todo = await ctx.db.get(todoId);
    if (!todo) throw new Error("Todo not found");

    const { userId, member } = await requireProjectMember(ctx, todo.projectId);

    if (todo.scope === "project") {
      if (!canEditProjectTodo(member.role)) {
        throw new Error("Insufficient permissions");
      }
    } else if (todo.userId !== userId) {
      throw new Error("Insufficient permissions");
    }

    await ctx.db.delete(todoId);
  },
});

export const reorder = mutation({
  args: {
    todoId: v.id("projectTodos"),
    direction: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, { todoId, direction }) => {
    const todo = await ctx.db.get(todoId);
    if (!todo) throw new Error("Todo not found");

    const { userId, member } = await requireProjectMember(ctx, todo.projectId);

    if (todo.scope === "project") {
      if (!canEditProjectTodo(member.role)) {
        throw new Error("Insufficient permissions");
      }
    } else if (todo.userId !== userId) {
      throw new Error("Insufficient permissions");
    }

    const siblings =
      todo.scope === "personal"
        ? (
            await ctx.db
              .query("projectTodos")
              .withIndex("by_project_user", (q) =>
                q.eq("projectId", todo.projectId).eq("userId", userId),
              )
              .collect()
          ).filter((t) => t.scope === "personal")
        : await ctx.db
            .query("projectTodos")
            .withIndex("by_project_scope", (q) =>
              q.eq("projectId", todo.projectId).eq("scope", "project"),
            )
            .collect();

    const sorted = siblings.sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((t) => t._id === todoId);
    if (idx === -1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const other = sorted[swapIdx];
    await ctx.db.patch(todoId, { order: other.order });
    await ctx.db.patch(other._id, { order: todo.order });
  },
});
