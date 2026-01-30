import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calculate compliance score from deadlines.
 * - Overdue: -2 per day overdue (max -20 per deadline)
 * - Due in 7 days: -5 per deadline
 * - Due in 30 days: -1 per deadline
 * - Bonus: +1 per recent on-time completion (max +10)
 */
function calculateScore(deadlines: Doc<"deadlines">[], now: number): number {
  if (deadlines.length === 0) return 100;

  let score = 100;
  const activeDeadlines = deadlines.filter((d) => !d.completedAt);

  for (const deadline of activeDeadlines) {
    const daysUntilDue = (deadline.dueDate - now) / DAY_MS;

    if (daysUntilDue < 0) {
      const daysOverdue = Math.abs(daysUntilDue);
      score -= Math.min(20, Math.floor(daysOverdue) * 2);
    } else if (daysUntilDue <= 7) {
      score -= 5;
    } else if (daysUntilDue <= 30) {
      score -= 1;
    }
  }

  // Bonus for on-time completions in last 30 days
  const thirtyDaysAgo = now - 30 * DAY_MS;
  const onTimeCompletions = deadlines.filter(
    (d) =>
      d.completedAt &&
      d.completedAt >= thirtyDaysAgo &&
      d.completedAt <= d.dueDate,
  );

  score += Math.min(10, onTimeCompletions.length);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Group deadlines by category with counts.
 */
function groupByCategory(
  deadlines: Doc<"deadlines">[],
  now: number,
): Array<{
  category: string;
  count: number;
  overdueCount: number;
}> {
  const groups = new Map<string, { count: number; overdueCount: number }>();

  for (const d of deadlines) {
    if (!groups.has(d.category)) {
      groups.set(d.category, { count: 0, overdueCount: 0 });
    }
    const group = groups.get(d.category)!;
    group.count++;
    if (d.dueDate < now) {
      group.overdueCount++;
    }
  }

  return Array.from(groups.entries()).map(([category, stats]) => ({
    category,
    ...stats,
  }));
}

/**
 * Main dashboard data query.
 * Returns all data needed for the dashboard in a single query.
 */
export const getDashboardData = query({
  args: {
    orgId: v.id("organizations"),
    viewMode: v.optional(
      v.union(v.literal("team"), v.literal("my_items"), v.literal("category")),
    ),
    userId: v.optional(v.string()),
  },
  returns: v.object({
    score: v.number(),
    overdue: v.array(v.any()),
    dueToday: v.array(v.any()),
    dueThisWeek: v.array(v.any()),
    upcoming: v.array(v.any()),
    stats: v.object({
      totalActive: v.number(),
      completedThisMonth: v.number(),
      documentsStored: v.number(),
      onTimeRate: v.number(),
    }),
    byCategory: v.array(
      v.object({
        category: v.string(),
        count: v.number(),
        overdueCount: v.number(),
      }),
    ),
    recentActivity: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayEnd = new Date().setHours(23, 59, 59, 999);
    const sevenDaysMs = 7 * DAY_MS;
    const thirtyDaysMs = 30 * DAY_MS;

    // Fetch all non-deleted deadlines for the org
    let allDeadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    // Filter by user if "my_items" view mode
    if (args.viewMode === "my_items" && args.userId) {
      allDeadlines = allDeadlines.filter(
        (d) => d.assignedTo === args.userId || d.createdBy === args.userId,
      );
    }

    // Categorize active (not completed) deadlines
    const activeDeadlines = allDeadlines.filter((d) => !d.completedAt);

    const overdue = activeDeadlines
      .filter((d) => d.dueDate < now)
      .sort((a, b) => a.dueDate - b.dueDate);

    const dueToday = activeDeadlines
      .filter((d) => d.dueDate >= todayStart && d.dueDate <= todayEnd)
      .sort((a, b) => a.dueDate - b.dueDate);

    const dueThisWeek = activeDeadlines
      .filter((d) => d.dueDate > now && d.dueDate <= now + sevenDaysMs)
      .sort((a, b) => a.dueDate - b.dueDate);

    const upcoming = activeDeadlines
      .filter(
        (d) => d.dueDate > now + sevenDaysMs && d.dueDate <= now + thirtyDaysMs,
      )
      .sort((a, b) => a.dueDate - b.dueDate)
      .slice(0, 10); // Limit to 10 for dashboard

    // Stats
    const completedThisMonth = allDeadlines.filter(
      (d) => d.completedAt && d.completedAt >= now - thirtyDaysMs,
    );

    const onTimeCompletions = allDeadlines.filter(
      (d) =>
        d.completedAt &&
        d.completedAt >= now - thirtyDaysMs &&
        d.completedAt <= d.dueDate,
    );

    const onTimeRate =
      completedThisMonth.length > 0
        ? Math.round(
            (onTimeCompletions.length / completedThisMonth.length) * 100,
          )
        : 100;

    // Document count
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    // Recent activity
    const recentActivity = await ctx.db
      .query("activity_log")
      .withIndex("by_org_timestamp", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(10);

    // Category breakdown
    const byCategory = groupByCategory(activeDeadlines, now);

    // Calculate compliance score
    const score = calculateScore(allDeadlines, now);

    return {
      score,
      overdue,
      dueToday,
      dueThisWeek,
      upcoming,
      stats: {
        totalActive: activeDeadlines.length,
        completedThisMonth: completedThisMonth.length,
        documentsStored: documents.length,
        onTimeRate,
      },
      byCategory,
      recentActivity,
    };
  },
});

/**
 * Get recent activity feed.
 */
export const getRecentActivity = query({
  args: {
    orgId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("activity_log")
      .withIndex("by_org_timestamp", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Log an activity event.
 */
export const logActivity = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
    action: v.union(
      v.literal("deadline_created"),
      v.literal("deadline_completed"),
      v.literal("deadline_updated"),
      v.literal("deadline_deleted"),
      v.literal("document_uploaded"),
      v.literal("document_deleted"),
      v.literal("alert_sent"),
      v.literal("alert_acknowledged"),
      v.literal("template_imported"),
      v.literal("settings_updated"),
    ),
    targetType: v.union(
      v.literal("deadline"),
      v.literal("document"),
      v.literal("alert"),
      v.literal("template"),
      v.literal("organization"),
    ),
    targetId: v.optional(v.string()),
    targetTitle: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.id("activity_log"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("activity_log", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

/**
 * Get user dashboard preferences.
 */
export const getPreferences = query({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("dashboard_preferences"),
      _creationTime: v.number(),
      orgId: v.id("organizations"),
      userId: v.string(),
      viewMode: v.union(
        v.literal("team"),
        v.literal("my_items"),
        v.literal("category"),
      ),
      sectionsOrder: v.optional(v.array(v.string())),
      hiddenSections: v.optional(v.array(v.string())),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dashboard_preferences")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.userId),
      )
      .unique();
  },
});

/**
 * Save user dashboard preferences.
 */
export const savePreferences = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
    viewMode: v.union(
      v.literal("team"),
      v.literal("my_items"),
      v.literal("category"),
    ),
    sectionsOrder: v.optional(v.array(v.string())),
    hiddenSections: v.optional(v.array(v.string())),
  },
  returns: v.id("dashboard_preferences"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dashboard_preferences")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.userId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        viewMode: args.viewMode,
        sectionsOrder: args.sectionsOrder,
        hiddenSections: args.hiddenSections,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("dashboard_preferences", {
      orgId: args.orgId,
      userId: args.userId,
      viewMode: args.viewMode,
      sectionsOrder: args.sectionsOrder,
      hiddenSections: args.hiddenSections,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get dashboard stats summary (lightweight query for header/nav).
 */
export const getStatsSummary = query({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.object({
    score: v.number(),
    overdueCount: v.number(),
    dueTodayCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const todayEnd = new Date().setHours(23, 59, 59, 999);

    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    const activeDeadlines = deadlines.filter((d) => !d.completedAt);
    const overdueCount = activeDeadlines.filter((d) => d.dueDate < now).length;
    const dueTodayCount = activeDeadlines.filter(
      (d) => d.dueDate >= todayStart && d.dueDate <= todayEnd,
    ).length;

    const score = calculateScore(deadlines, now);

    return {
      score,
      overdueCount,
      dueTodayCount,
    };
  },
});
