import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const FIELD_KEYS = {
  status: "statusOptions",
  priority: "priorityOptions",
  label: "labelOptions",
} as const;

type FieldName = keyof typeof FIELD_KEYS;

function normalizeOption(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "");
}

async function requireEditor(ctx: any, projectId: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const project = await ctx.db.get(projectId);
  if (!project) throw new Error("Project not found");
  const member = await ctx.db
    .query("members")
    .withIndex("by_workspace_user", (q: any) =>
      q.eq("workspaceId", project.workspaceId).eq("userId", userId),
    )
    .unique();
  if (!member) throw new Error("Not a member of this workspace");
  const roleOrder = { viewer: 0, editor: 1, admin: 2, owner: 3 };
  if (roleOrder[member.role as keyof typeof roleOrder] < roleOrder.editor) {
    throw new Error("Insufficient permissions");
  }
  return project;
}

export const addOption = mutation({
  args: {
    projectId: v.id("projects"),
    field: v.union(v.literal("status"), v.literal("priority"), v.literal("label")),
    value: v.string(),
  },
  handler: async (ctx, { projectId, field, value }) => {
    const project = await requireEditor(ctx, projectId);
    const normalized = normalizeOption(value);
    if (!normalized) throw new Error("Invalid option name");

    const key = FIELD_KEYS[field as FieldName];
    const current = (project as any)[key] ?? [];
    if (current.includes(normalized)) return normalized;

    await ctx.db.patch(projectId, {
      [key]: [...current, normalized],
    });
    return normalized;
  },
});

export const removeOption = mutation({
  args: {
    projectId: v.id("projects"),
    field: v.union(v.literal("status"), v.literal("priority"), v.literal("label")),
    value: v.string(),
  },
  handler: async (ctx, { projectId, field, value }) => {
    const project = await requireEditor(ctx, projectId);
    const key = FIELD_KEYS[field as FieldName];
    const current: string[] = (project as any)[key] ?? [];
    await ctx.db.patch(projectId, {
      [key]: current.filter((o) => o !== value),
    });
  },
});
