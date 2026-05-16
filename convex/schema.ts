import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // User profile (extends Convex auth users)
  userProfiles: defineTable({
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    // Approval status for admin-gated signups
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("suspended"),
        v.literal("banned")
      )
    ),
    rejectionReason: v.optional(v.string()),
    // Super admin flag
    superAdmin: v.optional(v.boolean()),
  }).index("by_userId", ["userId"]),

  // Workspaces (orgs)
  workspaces: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"]),

  // Workspace members
  members: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer")
    ),
    joinedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_workspace_user", ["workspaceId", "userId"]),

  // Workspace invites
  invites: defineTable({
    workspaceId: v.id("workspaces"),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer")
    ),
    token: v.string(),
    invitedBy: v.id("users"),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_token", ["token"]),

  // Projects
  projects: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    pointsEnabled: v.boolean(),
    createdBy: v.id("users"),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_active", ["workspaceId", "deletedAt"]),

  // Columns (statuses)
  columns: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    order: v.number(),
    color: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_order", ["projectId", "order"]),

  // Cards (tasks)
  cards: defineTable({
    columnId: v.id("columns"),
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    assigneeId: v.optional(v.id("users")),
    labels: v.array(v.string()),
    points: v.optional(v.number()),
    startDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    status: v.optional(v.union(v.literal("on_track"), v.literal("at_risk"), v.literal("off_track"))),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    order: v.number(),
    deletedAt: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_column", ["columnId"])
    .index("by_project", ["projectId"])
    .index("by_column_order", ["columnId", "order"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["projectId", "assigneeId", "deletedAt"],
    }),

  comments: defineTable({
    cardId: v.id("cards"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
  }).index("by_card", ["cardId"]),

  // Activity log
  activity: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    projectId: v.optional(v.id("projects")),
    entityType: v.union(
      v.literal("card"),
      v.literal("project"),
      v.literal("column"),
      v.literal("workspace"),
      v.literal("member")
    ),
    entityId: v.string(),
    userId: v.id("users"),
    action: v.string(), // e.g. "moved", "created", "updated", "deleted"
    meta: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_project", ["projectId"])
    .index("by_entity", ["entityId"])
    .index("by_user", ["userId"]),
});
