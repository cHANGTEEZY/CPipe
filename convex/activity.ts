import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAuth(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

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
        return { ...log, user };
      })
    );
    return withUsers;
  },
});
