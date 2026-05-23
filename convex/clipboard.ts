import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

async function requireAuth(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

async function nextOrder(ctx: any, userId: Id<"users">) {
  const items = await ctx.db
    .query("clipboardItems")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  return items.reduce((max: number, i: { order: number }) => Math.max(max, i.order), -1) + 1;
}

async function insertItem(
  ctx: any,
  userId: Id<"users">,
  data: {
    kind: "todo" | "card" | "link";
    title: string;
    sourceLabel: string;
    sourceProjectId?: Id<"projects">;
    sourceCardId?: Id<"cards">;
    sourceTodoId?: Id<"projectTodos">;
    url?: string;
  },
) {
  const order = await nextOrder(ctx, userId);
  return await ctx.db.insert("clipboardItems", {
    userId,
    kind: data.kind,
    title: data.title,
    sourceLabel: data.sourceLabel,
    sourceProjectId: data.sourceProjectId,
    sourceCardId: data.sourceCardId,
    sourceTodoId: data.sourceTodoId,
    url: data.url,
    completed: false,
    pinned: false,
    order,
    createdAt: Date.now(),
  });
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const items = await ctx.db
      .query("clipboardItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return items.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return a.order - b.order || b.createdAt - a.createdAt;
    });
  },
});

/** Todo/card IDs already saved on this user's clipboard (for UI indicators). */
export const listLinkedSourceIds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { todoIds: [] as Id<"projectTodos">[], cardIds: [] as Id<"cards">[] };
    }

    const items = await ctx.db
      .query("clipboardItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const todoIds: Id<"projectTodos">[] = [];
    const cardIds: Id<"cards">[] = [];
    for (const item of items) {
      if (item.sourceTodoId) todoIds.push(item.sourceTodoId);
      if (item.sourceCardId) cardIds.push(item.sourceCardId);
    }
    return { todoIds, cardIds };
  },
});

export const addTodo = mutation({
  args: { todoId: v.id("projectTodos") },
  handler: async (ctx, { todoId }) => {
    const userId = await requireAuth(ctx);
    const todo = await ctx.db.get(todoId);
    if (!todo) throw new Error("Todo not found");

    const project = await ctx.db.get(todo.projectId);
    if (!project) throw new Error("Project not found");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_user", (q: any) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) throw new Error("Not a member of this workspace");

    const existing = await ctx.db
      .query("clipboardItems")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    const already = existing.find((i) => i.sourceTodoId === todoId);
    if (already) return already._id;

    return await insertItem(ctx, userId, {
      kind: "todo",
      title: todo.title,
      sourceLabel: project.name,
      sourceProjectId: project._id,
      sourceTodoId: todoId,
    });
  },
});

export const addCard = mutation({
  args: { cardId: v.id("cards") },
  handler: async (ctx, { cardId }) => {
    const userId = await requireAuth(ctx);
    const card = await ctx.db.get(cardId);
    if (!card || card.deletedAt) throw new Error("Card not found");

    const project = await ctx.db.get(card.projectId);
    if (!project) throw new Error("Project not found");

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_user", (q: any) =>
        q.eq("workspaceId", project.workspaceId).eq("userId", userId),
      )
      .unique();
    if (!member) throw new Error("Not a member of this workspace");

    const existing = await ctx.db
      .query("clipboardItems")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    const already = existing.find((i) => i.sourceCardId === cardId);
    if (already) return already._id;

    return await insertItem(ctx, userId, {
      kind: "card",
      title: card.title,
      sourceLabel: project.name,
      sourceProjectId: project._id,
      sourceCardId: cardId,
    });
  },
});

export const addLink = mutation({
  args: {
    title: v.string(),
    url: v.string(),
    sourceLabel: v.optional(v.string()),
  },
  handler: async (ctx, { title, url, sourceLabel }) => {
    const userId = await requireAuth(ctx);
    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();
    if (!trimmedTitle) throw new Error("Title is required");
    if (!trimmedUrl) throw new Error("URL is required");

    return await insertItem(ctx, userId, {
      kind: "link",
      title: trimmedTitle,
      url: trimmedUrl,
      sourceLabel: sourceLabel?.trim() || "Link",
    });
  },
});

export const addQuickNote = mutation({
  args: { title: v.string() },
  handler: async (ctx, { title }) => {
    const userId = await requireAuth(ctx);
    const trimmed = title.trim();
    if (!trimmed) throw new Error("Title is required");

    return await insertItem(ctx, userId, {
      kind: "todo",
      title: trimmed,
      sourceLabel: "Quick note",
    });
  },
});

export const update = mutation({
  args: {
    itemId: v.id("clipboardItems"),
    title: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, { itemId, ...patch }) => {
    const userId = await requireAuth(ctx);
    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");

    const updates: Record<string, unknown> = {};
    if (patch.title !== undefined) {
      const trimmed = patch.title.trim();
      if (!trimmed) throw new Error("Title is required");
      updates.title = trimmed;
    }
    if (patch.pinned !== undefined) updates.pinned = patch.pinned;
    if (patch.completed !== undefined) updates.completed = patch.completed;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(itemId, updates);
    }
  },
});

export const remove = mutation({
  args: { itemId: v.id("clipboardItems") },
  handler: async (ctx, { itemId }) => {
    const userId = await requireAuth(ctx);
    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    await ctx.db.delete(itemId);
  },
});
