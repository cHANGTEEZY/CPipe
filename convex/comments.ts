import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAuth(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/** List all comments for a card */
export const list = query({
  args: { cardId: v.id("cards") },
  handler: async (ctx, { cardId }) => {
    await requireAuth(ctx);
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_card", (q: any) => q.eq("cardId", cardId))
      .collect();
    
    // Sort and enrich with user profiles
    const enriched = await Promise.all(
      comments
        .filter((c: any) => !c.deletedAt)
        .sort((a: any, b: any) => a.createdAt - b.createdAt)
        .map(async (c: any) => {
          const user = await ctx.db.get(c.userId);
          const profile = await ctx.db
            .query("userProfiles")
            .withIndex("by_userId", (q: any) => q.eq("userId", c.userId))
            .unique();
          return { ...c, user: { ...user, profile } };
        })
    );
    return enriched;
  },
});

/** Add a comment to a card */
export const create = mutation({
  args: { cardId: v.id("cards"), content: v.string() },
  handler: async (ctx, { cardId, content }) => {
    const userId = await requireAuth(ctx);
    if (!content.trim()) throw new Error("Comment cannot be empty");
    
    const commentId = await ctx.db.insert("comments", {
      cardId,
      userId,
      content: content.trim(),
      createdAt: Date.now(),
    });

    // Also log this as an activity
    const card = await ctx.db.get(cardId);
    if (card) {
      const project = await ctx.db.get(card.projectId);
      if (project) {
        await ctx.db.insert("activity", {
          workspaceId: project.workspaceId,
          projectId: project._id,
          entityType: "card",
          entityId: cardId,
          userId,
          action: "commented",
          meta: { commentId },
          createdAt: Date.now(),
        });
      }
    }

    return commentId;
  },
});

/** Delete a comment */
export const remove = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const userId = await requireAuth(ctx);
    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.userId !== userId) throw new Error("Unauthorized");
    
    await ctx.db.patch(commentId, { deletedAt: Date.now() });
  },
});
