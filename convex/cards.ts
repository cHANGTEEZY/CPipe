import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

async function requireAuth(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/** List active cards for a column */
export const listByColumn = query({
  args: { columnId: v.id("columns") },
  handler: async (ctx, { columnId }) => {
    await requireAuth(ctx);
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_column", (q: any) => q.eq("columnId", columnId))
      .collect();
    return cards
      .filter((c: any) => !c.deletedAt)
      .sort((a: any, b: any) => a.order - b.order);
  },
});

/** List all active cards for a project (for search) */
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await requireAuth(ctx);
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
      .collect();
    return cards.filter((c: any) => !c.deletedAt);
  },
});

/** Full-text search cards */
export const search = query({
  args: {
    projectId: v.id("projects"),
    query: v.string(),
    assigneeId: v.optional(v.id("users")),
  },
  handler: async (ctx, { projectId, query: q, assigneeId }) => {
    await requireAuth(ctx);
    if (!q.trim()) return [];
    let searchQuery = ctx.db.query("cards").withSearchIndex("search_title", (sq: any) =>
      sq.search("title", q).eq("projectId", projectId).eq("deletedAt", undefined)
    );
    const results = await searchQuery.take(50);
    if (assigneeId) {
      return results.filter((c: any) => c.assigneeId === assigneeId);
    }
    return results;
  },
});

/** Create a card */
export const create = mutation({
  args: {
    columnId: v.id("columns"),
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    assigneeId: v.optional(v.id("users")),
    labels: v.optional(v.array(v.string())),
    points: v.optional(v.number()),
  },
  handler: async (ctx, { columnId, projectId, title, description, assigneeId, labels, points }) => {
    const userId = await requireAuth(ctx);
    const existing = await ctx.db
      .query("cards")
      .withIndex("by_column", (q: any) => q.eq("columnId", columnId))
      .collect();
    const activeCards = existing.filter((c: any) => !c.deletedAt);
    const maxOrder = activeCards.reduce(
      (max: number, c: any) => Math.max(max, c.order),
      -1
    );
    const cardId = await ctx.db.insert("cards", {
      columnId,
      projectId,
      title,
      description,
      assigneeId,
      labels: labels ?? [],
      points,
      order: maxOrder + 1,
      createdBy: userId,
      createdAt: Date.now(),
    });
    await ctx.db.insert("activity", {
      entityType: "card",
      entityId: cardId,
      userId,
      action: "created",
      meta: { title },
      createdAt: Date.now(),
    });
    return cardId;
  },
});

/** Update card fields */
export const update = mutation({
  args: {
    cardId: v.id("cards"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    assigneeId: v.optional(v.union(v.id("users"), v.null())),
    labels: v.optional(v.array(v.string())),
    points: v.optional(v.number()),
  },
  handler: async (ctx, { cardId, ...patch }) => {
    const userId = await requireAuth(ctx);
    const existing = await ctx.db.get(cardId);
    if (!existing) throw new Error("Card not found");

    // Send email if assigned to a new user
    if (patch.assigneeId !== undefined && patch.assigneeId !== existing.assigneeId && patch.assigneeId !== null) {
      const assignedUser = await ctx.db.get(patch.assigneeId);
      const assigner = await ctx.db.get(userId);
      const project = await ctx.db.get(existing.projectId);
      
      if (assignedUser && assignedUser.email && project) {
        const assignerProfile = await ctx.db.query("userProfiles").withIndex("by_userId", (q: any) => q.eq("userId", userId)).unique();
        const assigneeProfile = await ctx.db.query("userProfiles").withIndex("by_userId", (q: any) => q.eq("userId", assignedUser._id)).unique();
        
        await ctx.scheduler.runAfter(0, internal.emails.sendTaskAssignedEmail, {
          email: assignedUser.email,
          name: assigneeProfile?.displayName || assignedUser.name || "User",
          taskTitle: patch.title ?? existing.title,
          projectName: project.name,
          assignedBy: assignerProfile?.displayName || assigner?.name || "Someone",
        });
      }
    }

    // Convert null to undefined for Convex patch if needed, but Convex supports null to clear optional fields if using v.optional(v.union(v.id("users"), v.null())). Wait, `patch.assigneeId` can be null.
    const patchData: any = { ...patch };
    if (patchData.assigneeId === null) {
      patchData.assigneeId = undefined; // convex handles optional clearing with undefined in patch
    }

    await ctx.db.patch(cardId, patchData);
    await ctx.db.insert("activity", {
      entityType: "card",
      entityId: cardId,
      userId,
      action: "updated",
      meta: patchData,
      createdAt: Date.now(),
    });
  },
});

/** Move a card to a different column with a new order position */
export const move = mutation({
  args: {
    cardId: v.id("cards"),
    toColumnId: v.id("columns"),
    newOrder: v.number(),
  },
  handler: async (ctx, { cardId, toColumnId, newOrder }) => {
    const userId = await requireAuth(ctx);
    const card = await ctx.db.get(cardId);
    if (!card) throw new Error("Card not found");
    const fromColumnId = card.columnId;
    await ctx.db.patch(cardId, { columnId: toColumnId, order: newOrder });
    await ctx.db.insert("activity", {
      entityType: "card",
      entityId: cardId,
      userId,
      action: "moved",
      meta: { fromColumnId, toColumnId },
      createdAt: Date.now(),
    });
  },
});

/** Reorder cards within a column */
export const reorder = mutation({
  args: {
    columnId: v.id("columns"),
    orderedIds: v.array(v.id("cards")),
  },
  handler: async (ctx, { orderedIds }) => {
    await requireAuth(ctx);
    await Promise.all(
      orderedIds.map((id, index) => ctx.db.patch(id, { order: index }))
    );
  },
});

/** Soft-delete a card */
export const remove = mutation({
  args: { cardId: v.id("cards") },
  handler: async (ctx, { cardId }) => {
    const userId = await requireAuth(ctx);
    await ctx.db.patch(cardId, { deletedAt: Date.now() });
    await ctx.db.insert("activity", {
      entityType: "card",
      entityId: cardId,
      userId,
      action: "deleted",
      createdAt: Date.now(),
    });
  },
});
