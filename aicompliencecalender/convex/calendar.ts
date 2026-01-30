import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Query deadlines optimized for calendar display.
 * Returns minimal fields needed for rendering calendar events.
 */
export const listForCalendar = query({
  args: {
    orgId: v.id("organizations"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    includeCompleted: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("deadlines"),
      title: v.string(),
      dueDate: v.number(),
      category: v.string(),
      completedAt: v.union(v.number(), v.null()),
      assignedTo: v.union(v.string(), v.null()),
      description: v.union(v.string(), v.null()),
      recurrence: v.union(
        v.object({
          type: v.union(
            v.literal("weekly"),
            v.literal("monthly"),
            v.literal("quarterly"),
            v.literal("semi_annual"),
            v.literal("annual"),
            v.literal("custom"),
          ),
          interval: v.optional(v.number()),
        }),
        v.null(),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const { orgId, startDate, endDate, includeCompleted = true } = args;

    // Fetch all deadlines for the org
    let deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    // Filter by date range if provided
    if (startDate !== undefined) {
      deadlines = deadlines.filter((d) => d.dueDate >= startDate);
    }
    if (endDate !== undefined) {
      deadlines = deadlines.filter((d) => d.dueDate <= endDate);
    }

    // Filter out completed if requested
    if (!includeCompleted) {
      deadlines = deadlines.filter((d) => !d.completedAt);
    }

    // Return minimal fields for calendar
    return deadlines.map((d) => ({
      _id: d._id,
      title: d.title,
      dueDate: d.dueDate,
      category: d.category,
      completedAt: d.completedAt ?? null,
      assignedTo: d.assignedTo ?? null,
      description: d.description ?? null,
      recurrence: d.recurrence ?? null,
    }));
  },
});

/**
 * Get deadlines for a specific date.
 */
export const getDeadlinesForDate = query({
  args: {
    orgId: v.id("organizations"),
    date: v.number(), // Start of day timestamp
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const { orgId, date } = args;

    // Calculate end of day
    const startOfDay = date;
    const endOfDay = date + 24 * 60 * 60 * 1000 - 1;

    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org_due", (q) =>
        q
          .eq("orgId", orgId)
          .gte("dueDate", startOfDay)
          .lte("dueDate", endOfDay),
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    return deadlines;
  },
});

/**
 * Get available categories for filtering.
 */
export const getCategories = query({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    const categories = new Set<string>();
    for (const d of deadlines) {
      categories.add(d.category);
    }

    return Array.from(categories).sort();
  },
});

/**
 * Get team members who have deadlines assigned.
 */
export const getAssignees = query({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    const assignees = new Set<string>();
    for (const d of deadlines) {
      if (d.assignedTo) {
        assignees.add(d.assignedTo);
      }
    }

    return Array.from(assignees).sort();
  },
});
