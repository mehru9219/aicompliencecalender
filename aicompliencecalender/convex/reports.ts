/**
 * Report queries and mutations for Reporting & Analytics feature.
 */

import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper: Group array items by a key
function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      const groupKey = String(item[key] ?? "unknown");
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

// Helper: Resolve date range from preset type
function resolveDateRange(
  dateRangeType: string,
  customRange?: { from: number; to: number },
): { from: number; to: number } {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  switch (dateRangeType) {
    case "last_7_days":
      return { from: now - 7 * day, to: now };
    case "last_30_days":
      return { from: now - 30 * day, to: now };
    case "last_quarter":
      return { from: now - 90 * day, to: now };
    case "last_year":
      return { from: now - 365 * day, to: now };
    case "custom":
      if (customRange) return customRange;
      return { from: now - 30 * day, to: now };
    default:
      return { from: now - 30 * day, to: now };
  }
}

// Date range validator
const dateRangeValidator = v.object({
  from: v.number(),
  to: v.number(),
});

// Report config validator
const reportConfigValidator = v.object({
  dateRangeType: v.union(
    v.literal("last_7_days"),
    v.literal("last_30_days"),
    v.literal("last_quarter"),
    v.literal("last_year"),
    v.literal("custom"),
  ),
  customDateRange: v.optional(v.object({ from: v.number(), to: v.number() })),
  categories: v.array(v.string()),
  metrics: v.array(v.string()),
  chartTypes: v.array(v.string()),
  groupBy: v.optional(v.string()),
});

/**
 * Get compliance summary with stats, score history, and breakdown by category.
 */
export const getComplianceSummary = query({
  args: {
    orgId: v.id("organizations"),
    dateRange: dateRangeValidator,
  },
  returns: v.object({
    summary: v.object({
      total: v.number(),
      completed: v.number(),
      onTime: v.number(),
      late: v.number(),
      overdue: v.number(),
      pending: v.number(),
      completionRate: v.number(),
      onTimeRate: v.number(),
    }),
    scoreHistory: v.array(
      v.object({
        month: v.string(),
        score: v.number(),
      }),
    ),
    byCategory: v.array(
      v.object({
        category: v.string(),
        count: v.number(),
        overdue: v.number(),
      }),
    ),
    upcoming: v.array(
      v.object({
        _id: v.id("deadlines"),
        title: v.string(),
        dueDate: v.number(),
        category: v.string(),
      }),
    ),
    overdueItems: v.array(
      v.object({
        _id: v.id("deadlines"),
        title: v.string(),
        dueDate: v.number(),
        category: v.string(),
        daysOverdue: v.number(),
      }),
    ),
  }),
  handler: async (ctx, { orgId, dateRange }) => {
    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Filter to date range
    const inRange = deadlines.filter(
      (d) => d.dueDate >= dateRange.from && d.dueDate <= dateRange.to,
    );

    const completed = inRange.filter((d) => d.completedAt !== undefined);
    const onTime = completed.filter(
      (d) => d.completedAt !== undefined && d.completedAt <= d.dueDate,
    );
    const late = completed.filter(
      (d) => d.completedAt !== undefined && d.completedAt > d.dueDate,
    );
    const overdue = inRange.filter(
      (d) => d.completedAt === undefined && d.dueDate < now,
    );
    const pending = inRange.filter(
      (d) => d.completedAt === undefined && d.dueDate >= now,
    );

    // Calculate score history (last 12 months)
    const scoreHistory: { month: string; score: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const monthDeadlines = deadlines.filter(
        (d) =>
          d.dueDate >= monthStart.getTime() && d.dueDate < monthEnd.getTime(),
      );

      const monthCompleted = monthDeadlines.filter(
        (d) => d.completedAt !== undefined,
      );
      const monthOnTime = monthCompleted.filter(
        (d) => d.completedAt !== undefined && d.completedAt <= d.dueDate,
      );

      const score =
        monthDeadlines.length > 0
          ? Math.round((monthOnTime.length / monthDeadlines.length) * 100)
          : 100;

      scoreHistory.push({
        month: monthStart.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        score,
      });
    }

    // Group by category
    const pendingByCategory = groupBy(
      inRange.filter((d) => d.completedAt === undefined),
      "category",
    );

    const byCategory = Object.entries(pendingByCategory).map(
      ([category, items]) => ({
        category,
        count: items.length,
        overdue: items.filter((i) => i.dueDate < now).length,
      }),
    );

    // Get upcoming deadlines (next 10)
    const upcoming = pending
      .sort((a, b) => a.dueDate - b.dueDate)
      .slice(0, 10)
      .map((d) => ({
        _id: d._id,
        title: d.title,
        dueDate: d.dueDate,
        category: d.category,
      }));

    // Get overdue items
    const overdueItems = overdue
      .sort((a, b) => a.dueDate - b.dueDate)
      .map((d) => ({
        _id: d._id,
        title: d.title,
        dueDate: d.dueDate,
        category: d.category,
        daysOverdue: Math.floor((now - d.dueDate) / day),
      }));

    return {
      summary: {
        total: inRange.length,
        completed: completed.length,
        onTime: onTime.length,
        late: late.length,
        overdue: overdue.length,
        pending: pending.length,
        completionRate:
          inRange.length > 0
            ? Math.round((completed.length / inRange.length) * 100)
            : 0,
        onTimeRate:
          completed.length > 0
            ? Math.round((onTime.length / completed.length) * 100)
            : 0,
      },
      scoreHistory,
      byCategory,
      upcoming,
      overdueItems,
    };
  },
});

/**
 * Get team performance metrics by user.
 */
export const getTeamPerformance = query({
  args: {
    orgId: v.id("organizations"),
    dateRange: v.optional(dateRangeValidator),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      userName: v.optional(v.string()),
      role: v.optional(v.string()),
      completed: v.number(),
      onTimeRate: v.number(),
      avgDaysBefore: v.number(),
      activeAssignments: v.number(),
    }),
  ),
  handler: async (ctx, { orgId, dateRange }) => {
    // Get org members
    const memberships = await ctx.db
      .query("user_organizations")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect();

    // Get all completed deadlines
    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    const now = Date.now();
    const effectiveDateRange = dateRange || {
      from: now - 365 * 24 * 60 * 60 * 1000,
      to: now,
    };

    // Filter deadlines in range
    const completedDeadlines = deadlines.filter(
      (d) =>
        d.completedAt !== undefined &&
        d.completedAt >= effectiveDateRange.from &&
        d.completedAt <= effectiveDateRange.to,
    );

    // Group by completedBy
    const byUser = groupBy(
      completedDeadlines.filter((d) => d.completedBy),
      "completedBy",
    );

    return memberships.map((member) => {
      const userDeadlines = byUser[member.userId] || [];
      const onTime = userDeadlines.filter(
        (d) => d.completedAt !== undefined && d.completedAt <= d.dueDate,
      );

      // Calculate average days before due date
      let avgDaysBefore = 0;
      if (userDeadlines.length > 0) {
        const totalDays = userDeadlines.reduce((sum, d) => {
          if (d.completedAt) {
            return sum + (d.dueDate - d.completedAt) / (24 * 60 * 60 * 1000);
          }
          return sum;
        }, 0);
        avgDaysBefore = Math.round(totalDays / userDeadlines.length);
      }

      // Count active assignments
      const activeAssignments = deadlines.filter(
        (d) =>
          d.assignedTo === member.userId &&
          d.completedAt === undefined &&
          d.deletedAt === undefined,
      ).length;

      return {
        userId: member.userId,
        userName: undefined, // Would need Clerk lookup for actual names
        role: member.role,
        completed: userDeadlines.length,
        onTimeRate:
          userDeadlines.length > 0
            ? Math.round((onTime.length / userDeadlines.length) * 100)
            : 0,
        avgDaysBefore,
        activeAssignments,
      };
    });
  },
});

/**
 * Calculate cost avoidance estimates based on on-time completions.
 */
export const getCostAvoidance = query({
  args: {
    orgId: v.id("organizations"),
    dateRange: dateRangeValidator,
  },
  returns: v.object({
    totalAvoided: v.number(),
    deadlinesCompletedOnTime: v.number(),
    breakdown: v.array(
      v.object({
        deadlineId: v.id("deadlines"),
        title: v.string(),
        category: v.string(),
        completedAt: v.number(),
        estimatedPenalty: v.number(),
      }),
    ),
    byCategory: v.array(
      v.object({
        category: v.string(),
        count: v.number(),
        totalAvoided: v.number(),
      }),
    ),
    disclaimer: v.string(),
  }),
  handler: async (ctx, { orgId, dateRange }) => {
    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    // Find on-time completions in date range
    const onTimeCompletions = deadlines.filter(
      (d) =>
        d.completedAt !== undefined &&
        d.completedAt <= d.dueDate &&
        d.completedAt >= dateRange.from &&
        d.completedAt <= dateRange.to,
    );

    // Estimated penalties by category (industry averages)
    const penalties: Record<string, number> = {
      licenses: 5000,
      certifications: 3000,
      training_records: 1000,
      audit_reports: 10000,
      policies: 2000,
      insurance: 7500,
      contracts: 5000,
      tax_filing: 2500,
      regulatory: 15000,
      other: 1000,
    };

    let totalAvoided = 0;
    const breakdown: {
      deadlineId: Id<"deadlines">;
      title: string;
      category: string;
      completedAt: number;
      estimatedPenalty: number;
    }[] = [];

    const categoryTotals: Record<string, { count: number; total: number }> = {};

    for (const d of onTimeCompletions) {
      const penalty = penalties[d.category] || 1000;
      totalAvoided += penalty;

      breakdown.push({
        deadlineId: d._id,
        title: d.title,
        category: d.category,
        completedAt: d.completedAt!,
        estimatedPenalty: penalty,
      });

      if (!categoryTotals[d.category]) {
        categoryTotals[d.category] = { count: 0, total: 0 };
      }
      categoryTotals[d.category].count++;
      categoryTotals[d.category].total += penalty;
    }

    const byCategory = Object.entries(categoryTotals).map(
      ([category, data]) => ({
        category,
        count: data.count,
        totalAvoided: data.total,
      }),
    );

    return {
      totalAvoided,
      deadlinesCompletedOnTime: onTimeCompletions.length,
      breakdown: breakdown.slice(0, 50), // Limit to 50 items
      byCategory,
      disclaimer:
        "Estimates based on average industry penalties. Actual penalties vary by jurisdiction and violation type.",
    };
  },
});

/**
 * Run a custom report based on user-defined configuration.
 */
export const runCustomReport = query({
  args: {
    orgId: v.id("organizations"),
    config: reportConfigValidator,
  },
  returns: v.object({
    completionRate: v.optional(v.number()),
    onTimeRate: v.optional(v.number()),
    byCategory: v.optional(
      v.array(
        v.object({
          category: v.string(),
          total: v.number(),
          completed: v.number(),
          pending: v.number(),
          overdue: v.number(),
        }),
      ),
    ),
    byStatus: v.optional(
      v.array(
        v.object({
          status: v.string(),
          count: v.number(),
        }),
      ),
    ),
    trend: v.optional(
      v.array(
        v.object({
          period: v.string(),
          total: v.number(),
          completed: v.number(),
          onTime: v.number(),
        }),
      ),
    ),
  }),
  handler: async (ctx, { orgId, config }) => {
    const dateRange = resolveDateRange(
      config.dateRangeType,
      config.customDateRange,
    );

    let deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    // Filter by date range
    deadlines = deadlines.filter(
      (d) => d.dueDate >= dateRange.from && d.dueDate <= dateRange.to,
    );

    // Filter by categories if specified
    if (config.categories.length > 0) {
      deadlines = deadlines.filter((d) =>
        config.categories.includes(d.category),
      );
    }

    const now = Date.now();
    const result: {
      completionRate?: number;
      onTimeRate?: number;
      byCategory?: {
        category: string;
        total: number;
        completed: number;
        pending: number;
        overdue: number;
      }[];
      byStatus?: { status: string; count: number }[];
      trend?: {
        period: string;
        total: number;
        completed: number;
        onTime: number;
      }[];
    } = {};

    for (const metric of config.metrics) {
      switch (metric) {
        case "completion_rate": {
          const completed = deadlines.filter(
            (d) => d.completedAt !== undefined,
          );
          result.completionRate =
            deadlines.length > 0
              ? Math.round((completed.length / deadlines.length) * 100)
              : 0;
          break;
        }

        case "on_time_rate": {
          const completed = deadlines.filter(
            (d) => d.completedAt !== undefined,
          );
          const onTime = completed.filter(
            (d) => d.completedAt !== undefined && d.completedAt <= d.dueDate,
          );
          result.onTimeRate =
            completed.length > 0
              ? Math.round((onTime.length / completed.length) * 100)
              : 0;
          break;
        }

        case "by_category": {
          const byCategory = groupBy(deadlines, "category");
          result.byCategory = Object.entries(byCategory).map(
            ([category, items]) => ({
              category,
              total: items.length,
              completed: items.filter((i) => i.completedAt !== undefined)
                .length,
              pending: items.filter(
                (i) => i.completedAt === undefined && i.dueDate >= now,
              ).length,
              overdue: items.filter(
                (i) => i.completedAt === undefined && i.dueDate < now,
              ).length,
            }),
          );
          break;
        }

        case "by_status": {
          const completed = deadlines.filter(
            (d) => d.completedAt !== undefined,
          ).length;
          const pending = deadlines.filter(
            (d) => d.completedAt === undefined && d.dueDate >= now,
          ).length;
          const overdue = deadlines.filter(
            (d) => d.completedAt === undefined && d.dueDate < now,
          ).length;
          result.byStatus = [
            { status: "completed", count: completed },
            { status: "pending", count: pending },
            { status: "overdue", count: overdue },
          ];
          break;
        }

        case "trend": {
          const groupByPeriod = config.groupBy || "month";
          const periodMap: Record<
            string,
            { total: number; completed: number; onTime: number }
          > = {};

          for (const d of deadlines) {
            const date = new Date(d.dueDate);
            let periodKey: string;

            if (groupByPeriod === "week") {
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay());
              periodKey = weekStart.toISOString().slice(0, 10);
            } else if (groupByPeriod === "quarter") {
              const quarter = Math.floor(date.getMonth() / 3) + 1;
              periodKey = `${date.getFullYear()} Q${quarter}`;
            } else {
              // month
              periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            }

            if (!periodMap[periodKey]) {
              periodMap[periodKey] = { total: 0, completed: 0, onTime: 0 };
            }

            periodMap[periodKey].total++;
            if (d.completedAt !== undefined) {
              periodMap[periodKey].completed++;
              if (d.completedAt <= d.dueDate) {
                periodMap[periodKey].onTime++;
              }
            }
          }

          result.trend = Object.entries(periodMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, data]) => ({
              period,
              ...data,
            }));
          break;
        }
      }
    }

    return result;
  },
});

/**
 * Save a report configuration for later use or scheduling.
 */
export const saveReport = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    reportType: v.union(
      v.literal("compliance_summary"),
      v.literal("team_performance"),
      v.literal("cost_avoidance"),
      v.literal("custom"),
    ),
    config: reportConfigValidator,
    schedule: v.optional(
      v.object({
        frequency: v.union(
          v.literal("daily"),
          v.literal("weekly"),
          v.literal("monthly"),
        ),
        recipients: v.array(v.string()),
        dayOfWeek: v.optional(v.number()),
        dayOfMonth: v.optional(v.number()),
        hour: v.optional(v.number()),
        timezone: v.optional(v.string()),
      }),
    ),
    userId: v.string(),
  },
  returns: v.id("saved_reports"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Calculate next run time if scheduled
    let nextRun: number | undefined;
    if (args.schedule) {
      nextRun = calculateNextRunTime(args.schedule);
    }

    return await ctx.db.insert("saved_reports", {
      orgId: args.orgId,
      name: args.name,
      description: args.description,
      reportType: args.reportType,
      config: args.config,
      schedule: args.schedule
        ? {
            ...args.schedule,
            lastRun: undefined,
            nextRun,
          }
        : undefined,
      createdAt: now,
      createdBy: args.userId,
    });
  },
});

/**
 * List saved reports for an organization.
 */
export const listSavedReports = query({
  args: {
    orgId: v.id("organizations"),
    reportType: v.optional(
      v.union(
        v.literal("compliance_summary"),
        v.literal("team_performance"),
        v.literal("cost_avoidance"),
        v.literal("custom"),
      ),
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id("saved_reports"),
      name: v.string(),
      description: v.optional(v.string()),
      reportType: v.string(),
      hasSchedule: v.boolean(),
      createdAt: v.number(),
      createdBy: v.string(),
    }),
  ),
  handler: async (ctx, { orgId, reportType }) => {
    let reports;

    if (reportType) {
      reports = await ctx.db
        .query("saved_reports")
        .withIndex("by_org_type", (q) =>
          q.eq("orgId", orgId).eq("reportType", reportType),
        )
        .collect();
    } else {
      reports = await ctx.db
        .query("saved_reports")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();
    }

    return reports.map((r) => ({
      _id: r._id,
      name: r.name,
      description: r.description,
      reportType: r.reportType,
      hasSchedule: r.schedule !== undefined,
      createdAt: r.createdAt,
      createdBy: r.createdBy,
    }));
  },
});

/**
 * Get a saved report by ID.
 */
export const getSavedReport = query({
  args: {
    reportId: v.id("saved_reports"),
  },
  returns: v.union(
    v.object({
      _id: v.id("saved_reports"),
      orgId: v.id("organizations"),
      name: v.string(),
      description: v.optional(v.string()),
      reportType: v.string(),
      config: reportConfigValidator,
      schedule: v.optional(
        v.object({
          frequency: v.string(),
          recipients: v.array(v.string()),
          dayOfWeek: v.optional(v.number()),
          dayOfMonth: v.optional(v.number()),
          hour: v.optional(v.number()),
          timezone: v.optional(v.string()),
          lastRun: v.optional(v.number()),
          nextRun: v.optional(v.number()),
        }),
      ),
      createdAt: v.number(),
      createdBy: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, { reportId }) => {
    const report = await ctx.db.get(reportId);
    if (!report) return null;

    return {
      _id: report._id,
      orgId: report.orgId,
      name: report.name,
      description: report.description,
      reportType: report.reportType,
      config: report.config,
      schedule: report.schedule,
      createdAt: report.createdAt,
      createdBy: report.createdBy,
    };
  },
});

/**
 * Delete a saved report.
 */
export const deleteSavedReport = mutation({
  args: {
    reportId: v.id("saved_reports"),
  },
  returns: v.null(),
  handler: async (ctx, { reportId }) => {
    await ctx.db.delete(reportId);
    return null;
  },
});

/**
 * Update a saved report's schedule.
 */
export const updateReportSchedule = mutation({
  args: {
    reportId: v.id("saved_reports"),
    schedule: v.optional(
      v.object({
        frequency: v.union(
          v.literal("daily"),
          v.literal("weekly"),
          v.literal("monthly"),
        ),
        recipients: v.array(v.string()),
        dayOfWeek: v.optional(v.number()),
        dayOfMonth: v.optional(v.number()),
        hour: v.optional(v.number()),
        timezone: v.optional(v.string()),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, { reportId, schedule }) => {
    const report = await ctx.db.get(reportId);
    if (!report) return null;

    let updatedSchedule = undefined;
    if (schedule) {
      const nextRun = calculateNextRunTime(schedule);
      updatedSchedule = {
        ...schedule,
        lastRun: report.schedule?.lastRun,
        nextRun,
      };
    }

    await ctx.db.patch(reportId, {
      schedule: updatedSchedule,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Get scheduled reports that need to run.
 */
export const getScheduledReportsToRun = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("saved_reports"),
      orgId: v.id("organizations"),
      name: v.string(),
      reportType: v.string(),
      config: reportConfigValidator,
      schedule: v.object({
        frequency: v.string(),
        recipients: v.array(v.string()),
        dayOfWeek: v.optional(v.number()),
        dayOfMonth: v.optional(v.number()),
        hour: v.optional(v.number()),
        timezone: v.optional(v.string()),
        lastRun: v.optional(v.number()),
        nextRun: v.optional(v.number()),
      }),
    }),
  ),
  handler: async (ctx) => {
    const now = Date.now();

    const allReports = await ctx.db.query("saved_reports").collect();

    // Filter to reports with schedules that are due
    return allReports
      .filter(
        (r) => r.schedule && r.schedule.nextRun && r.schedule.nextRun <= now,
      )
      .map((r) => ({
        _id: r._id,
        orgId: r.orgId,
        name: r.name,
        reportType: r.reportType,
        config: r.config,
        schedule: r.schedule!,
      }));
  },
});

// Helper: Calculate next run time for a schedule
function calculateNextRunTime(schedule: {
  frequency: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour?: number;
  timezone?: string;
}): number {
  const now = new Date();
  const hour = schedule.hour ?? 9; // Default 9 AM

  const next = new Date();
  next.setHours(hour, 0, 0, 0);

  switch (schedule.frequency) {
    case "daily":
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      break;

    case "weekly": {
      const targetDay = schedule.dayOfWeek ?? 1; // Default Monday
      const currentDay = next.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0 || (daysUntil === 0 && next <= now)) {
        daysUntil += 7;
      }
      next.setDate(next.getDate() + daysUntil);
      break;
    }

    case "monthly": {
      const targetDay = schedule.dayOfMonth ?? 1;
      next.setDate(targetDay);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      break;
    }
  }

  return next.getTime();
}
