import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAuth(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/** List all columns for a project, ordered */
export const list = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    await requireAuth(ctx);
    const cols = await ctx.db
      .query("columns")
      .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
      .collect();
    return cols.sort((a: any, b: any) => a.order - b.order);
  },
});

/** Add a new column */
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, name, color }) => {
    await requireAuth(ctx);
    const existing = await ctx.db
      .query("columns")
      .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
      .collect();
    const maxOrder = existing.reduce(
      (max: number, c: any) => Math.max(max, c.order),
      -1
    );
    return await ctx.db.insert("columns", {
      projectId,
      name,
      color,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });
  },
});

/** Rename a column */
export const rename = mutation({
  args: { columnId: v.id("columns"), name: v.string() },
  handler: async (ctx, { columnId, name }) => {
    await requireAuth(ctx);
    await ctx.db.patch(columnId, { name });
  },
});

/** Reorder all columns in a project */
export const reorder = mutation({
  args: {
    projectId: v.id("projects"),
    orderedIds: v.array(v.id("columns")),
  },
  handler: async (ctx, { orderedIds }) => {
    await requireAuth(ctx);
    await Promise.all(
      orderedIds.map((id, index) => ctx.db.patch(id, { order: index }))
    );
  },
});

/** Delete a column */
export const remove = mutation({
  args: { columnId: v.id("columns") },
  handler: async (ctx, { columnId }) => {
    await requireAuth(ctx);
    // Also soft-delete all cards in this column
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_column", (q: any) => q.eq("columnId", columnId))
      .collect();
    await Promise.all(
      cards.map((c: any) => ctx.db.patch(c._id, { deletedAt: Date.now() }))
    );
    await ctx.db.delete(columnId);
  },
});
