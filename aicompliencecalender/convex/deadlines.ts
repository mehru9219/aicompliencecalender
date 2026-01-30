import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// ============ ALERT SCHEDULING HELPERS ============

const URGENCY_THRESHOLDS = {
  early: 14,
  medium: 7,
  high: 1,
  critical: 0,
} as const;

const DEFAULT_ALERT_PREFS = {
  earlyChannels: ["email"],
  mediumChannels: ["email", "in_app"],
  highChannels: ["email", "sms", "in_app"],
  criticalChannels: ["email", "sms", "in_app"],
  alertDays: [30, 14, 7, 3, 1, 0],
};

type AlertChannel = "email" | "sms" | "push" | "in_app";
type AlertUrgency = "early" | "medium" | "high" | "critical";

function getUrgencyFromDays(daysBefore: number): AlertUrgency {
  if (daysBefore <= URGENCY_THRESHOLDS.critical) return "critical";
  if (daysBefore <= URGENCY_THRESHOLDS.high) return "high";
  if (daysBefore <= URGENCY_THRESHOLDS.medium) return "medium";
  return "early";
}

function getChannelsForUrgency(
  urgency: AlertUrgency,
  prefs: typeof DEFAULT_ALERT_PREFS,
): string[] {
  switch (urgency) {
    case "critical":
      return prefs.criticalChannels;
    case "high":
      return prefs.highChannels;
    case "medium":
      return prefs.mediumChannels;
    case "early":
      return prefs.earlyChannels;
  }
}

/** Internal helper to schedule alerts for a deadline */
async function scheduleAlertsForDeadlineInternal(
  ctx: MutationCtx,
  args: {
    deadlineId: Id<"deadlines">;
    dueDate: number;
    orgId: Id<"organizations">;
    assignedTo?: string;
  },
): Promise<Id<"alerts">[]> {
  const now = Date.now();

  let prefs = await ctx.db
    .query("alert_preferences")
    .withIndex("by_org_user", (q) =>
      q.eq("orgId", args.orgId).eq("userId", args.assignedTo),
    )
    .first();

  if (!prefs) {
    prefs = await ctx.db
      .query("alert_preferences")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", undefined),
      )
      .first();
  }

  const preferences = prefs ?? DEFAULT_ALERT_PREFS;
  const alertDays = preferences.alertDays;
  const alertIds: Id<"alerts">[] = [];

  for (const daysBefore of alertDays) {
    const scheduledFor = args.dueDate - daysBefore * MS_PER_DAY;
    if (scheduledFor < now) continue;

    const urgency = getUrgencyFromDays(daysBefore);
    const channels = getChannelsForUrgency(
      urgency,
      preferences as typeof DEFAULT_ALERT_PREFS,
    );

    for (const channel of channels) {
      const alertId = await ctx.db.insert("alerts", {
        deadlineId: args.deadlineId,
        orgId: args.orgId,
        userId: args.assignedTo,
        scheduledFor,
        channel: channel as AlertChannel,
        urgency,
        status: "scheduled",
        retryCount: 0,
      });

      await ctx.db.insert("alert_audit_log", {
        alertId,
        orgId: args.orgId,
        action: "scheduled",
        details: { daysBefore, channel, urgency },
        timestamp: now,
      });

      alertIds.push(alertId);
    }
  }

  return alertIds;
}

/** Internal helper to cancel pending alerts */
async function cancelPendingAlertsInternal(
  ctx: MutationCtx,
  deadlineId: Id<"deadlines">,
): Promise<number> {
  const now = Date.now();
  const alerts = await ctx.db
    .query("alerts")
    .withIndex("by_deadline", (q) => q.eq("deadlineId", deadlineId))
    .collect();

  let cancelledCount = 0;
  for (const alert of alerts) {
    if (alert.status === "scheduled") {
      await ctx.db.delete(alert._id);
      await ctx.db.insert("alert_audit_log", {
        alertId: alert._id,
        orgId: alert.orgId,
        action: "cancelled",
        details: { reason: "deadline_completed_or_deleted" },
        timestamp: now,
      });
      cancelledCount++;
    }
  }
  return cancelledCount;
}

// ============ DEADLINE HELPERS ============
const DUE_SOON_DAYS = 14;
const SOFT_DELETE_DAYS = 30;

type DeadlineStatus = "upcoming" | "due_soon" | "overdue" | "completed";

/** Calculate status from deadline data */
function calculateStatus(
  dueDate: number,
  completedAt: number | undefined,
  now: number = Date.now(),
): DeadlineStatus {
  if (completedAt) return "completed";
  const daysUntil = (dueDate - now) / MS_PER_DAY;
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= DUE_SOON_DAYS) return "due_soon";
  return "upcoming";
}

/** Calculate next due date for recurring deadlines */
function calculateNextDueDate(
  currentDue: number,
  recurrence: {
    type: string;
    interval?: number;
    endDate?: number;
    baseDate?: string;
  },
  completionDate?: number,
): number | null {
  const base =
    recurrence.baseDate === "completion_date" && completionDate
      ? completionDate
      : currentDue;

  const date = new Date(base);
  let next: Date;

  switch (recurrence.type) {
    case "weekly":
      next = new Date(date.getTime() + 7 * MS_PER_DAY);
      break;
    case "monthly":
      next = new Date(date);
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next = new Date(date);
      next.setMonth(next.getMonth() + 3);
      break;
    case "semi_annual":
      next = new Date(date);
      next.setMonth(next.getMonth() + 6);
      break;
    case "annual":
      next = new Date(date);
      next.setFullYear(next.getFullYear() + 1);
      break;
    case "custom":
      if (!recurrence.interval) return null;
      next = new Date(date.getTime() + recurrence.interval * MS_PER_DAY);
      break;
    default:
      return null;
  }

  const nextTs = next.getTime();
  if (recurrence.endDate && nextTs > recurrence.endDate) return null;
  return nextTs;
}

// ============ QUERIES ============

/** List deadlines for org with optional filters */
export const list = query({
  args: {
    orgId: v.id("organizations"),
    status: v.optional(v.array(v.string())),
    category: v.optional(v.array(v.string())),
    assignedTo: v.optional(v.string()),
    includeDeleted: v.optional(v.boolean()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    let deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Filter deleted
    if (!args.includeDeleted) {
      deadlines = deadlines.filter((d) => !d.deletedAt);
    }

    // Filter by category
    if (args.category?.length) {
      deadlines = deadlines.filter((d) => args.category!.includes(d.category));
    }

    // Filter by assignee
    if (args.assignedTo) {
      deadlines = deadlines.filter((d) => d.assignedTo === args.assignedTo);
    }

    // Add status and filter
    const now = Date.now();
    const withStatus = deadlines.map((d) => ({
      ...d,
      status: calculateStatus(d.dueDate, d.completedAt, now),
    }));

    if (args.status?.length) {
      return withStatus.filter((d) => args.status!.includes(d.status));
    }

    return withStatus;
  },
});

/** Get single deadline by ID */
export const get = query({
  args: { id: v.id("deadlines") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const deadline = await ctx.db.get(args.id);
    if (!deadline) return null;
    return {
      ...deadline,
      status: calculateStatus(deadline.dueDate, deadline.completedAt),
    };
  },
});

/** Get upcoming deadlines within N days */
export const upcoming = query({
  args: {
    orgId: v.id("organizations"),
    days: v.number(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const now = Date.now();
    const cutoff = now + args.days * MS_PER_DAY;

    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org_due", (q) => q.eq("orgId", args.orgId))
      .collect();

    return deadlines
      .filter(
        (d) =>
          !d.deletedAt &&
          !d.completedAt &&
          d.dueDate >= now &&
          d.dueDate <= cutoff,
      )
      .map((d) => ({
        ...d,
        status: calculateStatus(d.dueDate, d.completedAt, now),
      }));
  },
});

/** Get overdue deadlines */
export const overdue = query({
  args: { orgId: v.id("organizations") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const now = Date.now();
    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    return deadlines
      .filter((d) => !d.deletedAt && !d.completedAt && d.dueDate < now)
      .map((d) => ({ ...d, status: "overdue" as const }));
  },
});

/** Get deadlines by category */
export const byCategory = query({
  args: {
    orgId: v.id("organizations"),
    category: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org_category", (q) =>
        q.eq("orgId", args.orgId).eq("category", args.category),
      )
      .collect();

    const now = Date.now();
    return deadlines
      .filter((d) => !d.deletedAt)
      .map((d) => ({
        ...d,
        status: calculateStatus(d.dueDate, d.completedAt, now),
      }));
  },
});

/** Get trashed (soft-deleted) deadlines */
export const trash = query({
  args: { orgId: v.id("organizations") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const deadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    return deadlines.filter((d) => d.deletedAt);
  },
});

// ============ MUTATIONS ============

// Plan configuration for limit checking
const PLANS = {
  starter: { deadlines: 25 },
  professional: { deadlines: -1 },
  business: { deadlines: -1 },
} as const;

type PlanId = keyof typeof PLANS;

/** Helper to check deadline limit within mutation */
async function checkDeadlineLimit(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
): Promise<{ allowed: boolean; limit: number | "unlimited"; current: number }> {
  // Get subscription
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .first();

  const planId: PlanId = (subscription?.plan as PlanId) || "professional";
  const limit = PLANS[planId].deadlines;

  // If limit is -1, it's unlimited
  if (limit === -1) {
    return { allowed: true, limit: "unlimited", current: 0 };
  }

  // Get current month's usage
  const currentMonth = new Date().toISOString().slice(0, 7);
  const usage = await ctx.db
    .query("usage")
    .withIndex("by_org_month", (q) =>
      q.eq("orgId", orgId).eq("month", currentMonth),
    )
    .first();

  const current = usage?.deadlinesCreated || 0;
  return { allowed: current < limit, limit, current };
}

/** Helper to increment deadline usage */
async function incrementDeadlineUsage(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
): Promise<void> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const usage = await ctx.db
    .query("usage")
    .withIndex("by_org_month", (q) =>
      q.eq("orgId", orgId).eq("month", currentMonth),
    )
    .first();

  if (!usage) {
    await ctx.db.insert("usage", {
      orgId,
      month: currentMonth,
      deadlinesCreated: 1,
      documentsUploaded: 0,
      storageUsedBytes: 0,
      formPreFills: 0,
      alertsSent: 0,
    });
  } else {
    await ctx.db.patch(usage._id, {
      deadlinesCreated: (usage.deadlinesCreated || 0) + 1,
    });
  }
}

/** Create new deadline */
export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.number(),
    category: v.string(),
    recurrence: v.optional(
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
        endDate: v.optional(v.number()),
        baseDate: v.optional(
          v.union(v.literal("due_date"), v.literal("completion_date")),
        ),
      }),
    ),
    assignedTo: v.optional(v.string()),
    createdBy: v.string(),
    scheduleAlerts: v.optional(v.boolean()),
  },
  returns: v.id("deadlines"),
  handler: async (ctx, args) => {
    // Check deadline limit before creating
    const limitCheck = await checkDeadlineLimit(ctx, args.orgId);
    if (!limitCheck.allowed) {
      throw new ConvexError({
        code: "LIMIT_EXCEEDED",
        message: `You have reached your plan limit of ${limitCheck.limit} deadlines this month. Upgrade your plan for more.`,
        current: limitCheck.current,
        limit: limitCheck.limit,
      });
    }

    const id = await ctx.db.insert("deadlines", {
      orgId: args.orgId,
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      category: args.category,
      recurrence: args.recurrence,
      assignedTo: args.assignedTo,
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });

    // Increment usage
    await incrementDeadlineUsage(ctx, args.orgId);

    // Log audit
    await ctx.db.insert("deadline_audit_log", {
      deadlineId: id,
      orgId: args.orgId,
      userId: args.createdBy,
      action: "created",
      timestamp: Date.now(),
    });

    // Schedule alerts (default: true)
    if (args.scheduleAlerts !== false) {
      await scheduleAlertsForDeadlineInternal(ctx, {
        deadlineId: id,
        dueDate: args.dueDate,
        orgId: args.orgId,
        assignedTo: args.assignedTo,
      });
    }

    return id;
  },
});

/** Update deadline */
export const update = mutation({
  args: {
    id: v.id("deadlines"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    category: v.optional(v.string()),
    recurrence: v.optional(
      v.union(
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
          endDate: v.optional(v.number()),
          baseDate: v.optional(
            v.union(v.literal("due_date"), v.literal("completion_date")),
          ),
        }),
        v.null(),
      ),
    ),
    assignedTo: v.optional(v.union(v.string(), v.null())),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Deadline not found");

    const updates: Record<string, unknown> = {};
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    if (args.title !== undefined && args.title !== existing.title) {
      updates.title = args.title;
      changes.title = { from: existing.title, to: args.title };
    }
    if (args.description !== undefined) {
      updates.description = args.description;
      changes.description = {
        from: existing.description,
        to: args.description,
      };
    }
    if (args.dueDate !== undefined && args.dueDate !== existing.dueDate) {
      updates.dueDate = args.dueDate;
      changes.dueDate = { from: existing.dueDate, to: args.dueDate };
    }
    if (args.category !== undefined && args.category !== existing.category) {
      updates.category = args.category;
      changes.category = { from: existing.category, to: args.category };
    }
    if (args.recurrence !== undefined) {
      updates.recurrence = args.recurrence ?? undefined;
      changes.recurrence = { from: existing.recurrence, to: args.recurrence };
    }
    if (args.assignedTo !== undefined) {
      updates.assignedTo = args.assignedTo ?? undefined;
      changes.assignedTo = { from: existing.assignedTo, to: args.assignedTo };
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.id, updates);

      await ctx.db.insert("deadline_audit_log", {
        deadlineId: args.id,
        orgId: existing.orgId,
        userId: args.userId,
        action: "updated",
        changes,
        timestamp: Date.now(),
      });

      // If due date changed, reschedule alerts
      if (args.dueDate !== undefined && args.dueDate !== existing.dueDate) {
        await cancelPendingAlertsInternal(ctx, args.id);
        await scheduleAlertsForDeadlineInternal(ctx, {
          deadlineId: args.id,
          dueDate: args.dueDate,
          orgId: existing.orgId,
          assignedTo: args.assignedTo ?? existing.assignedTo,
        });
      }
    }

    return null;
  },
});

/** Mark deadline complete */
export const complete = mutation({
  args: {
    id: v.id("deadlines"),
    userId: v.string(),
  },
  returns: v.union(v.id("deadlines"), v.null()),
  handler: async (ctx, args) => {
    const deadline = await ctx.db.get(args.id);
    if (!deadline) throw new Error("Deadline not found");
    if (deadline.completedAt) throw new Error("Already completed");

    const now = Date.now();

    await ctx.db.patch(args.id, {
      completedAt: now,
      completedBy: args.userId,
    });

    await ctx.db.insert("deadline_audit_log", {
      deadlineId: args.id,
      orgId: deadline.orgId,
      userId: args.userId,
      action: "completed",
      timestamp: now,
    });

    // Cancel pending alerts for this deadline
    await cancelPendingAlertsInternal(ctx, args.id);

    // Create next deadline if recurring
    if (deadline.recurrence) {
      const nextDue = calculateNextDueDate(
        deadline.dueDate,
        deadline.recurrence,
        now,
      );

      if (nextDue) {
        const nextId = await ctx.db.insert("deadlines", {
          orgId: deadline.orgId,
          title: deadline.title,
          description: deadline.description,
          dueDate: nextDue,
          category: deadline.category,
          recurrence: deadline.recurrence,
          assignedTo: deadline.assignedTo,
          createdAt: now,
          createdBy: deadline.createdBy,
        });

        await ctx.db.insert("deadline_audit_log", {
          deadlineId: nextId,
          orgId: deadline.orgId,
          userId: args.userId,
          action: "created",
          changes: { source: "recurrence", parentId: args.id },
          timestamp: now,
        });

        return nextId;
      }
    }

    return null;
  },
});

/** Soft delete deadline */
export const softDelete = mutation({
  args: {
    id: v.id("deadlines"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const deadline = await ctx.db.get(args.id);
    if (!deadline) throw new Error("Deadline not found");

    await ctx.db.patch(args.id, { deletedAt: Date.now() });

    await ctx.db.insert("deadline_audit_log", {
      deadlineId: args.id,
      orgId: deadline.orgId,
      userId: args.userId,
      action: "deleted",
      timestamp: Date.now(),
    });

    // Cancel pending alerts
    await cancelPendingAlertsInternal(ctx, args.id);

    return null;
  },
});

/** Restore soft-deleted deadline */
export const restore = mutation({
  args: {
    id: v.id("deadlines"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const deadline = await ctx.db.get(args.id);
    if (!deadline) throw new Error("Deadline not found");
    if (!deadline.deletedAt) throw new Error("Not deleted");

    await ctx.db.patch(args.id, { deletedAt: undefined });

    await ctx.db.insert("deadline_audit_log", {
      deadlineId: args.id,
      orgId: deadline.orgId,
      userId: args.userId,
      action: "restored",
      timestamp: Date.now(),
    });

    return null;
  },
});

/** Hard delete - only allowed after 30 days in trash */
export const hardDelete = mutation({
  args: {
    id: v.id("deadlines"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const deadline = await ctx.db.get(args.id);
    if (!deadline) throw new Error("Deadline not found");
    if (!deadline.deletedAt) throw new Error("Must soft-delete first");

    const daysSinceDelete = (Date.now() - deadline.deletedAt) / MS_PER_DAY;
    if (daysSinceDelete < SOFT_DELETE_DAYS) {
      throw new Error(
        `Cannot permanently delete until ${Math.ceil(SOFT_DELETE_DAYS - daysSinceDelete)} more days`,
      );
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

/** Get audit history for a deadline */
export const auditHistory = query({
  args: { deadlineId: v.id("deadlines") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("deadline_audit_log")
      .withIndex("by_deadline", (q) => q.eq("deadlineId", args.deadlineId))
      .order("desc")
      .collect();
  },
});
