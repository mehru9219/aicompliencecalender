/**
 * Onboarding progress tracking.
 */

import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/permissions";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Step type validator
const stepValidator = v.union(
  v.literal("account_created"),
  v.literal("org_setup"),
  v.literal("template_imported"),
  v.literal("alerts_configured"),
  v.literal("first_deadline"),
  v.literal("team_invited"),
  v.literal("first_completion"),
);

// Default steps state
const defaultSteps = {
  account_created: true, // Always true at creation
  org_setup: false,
  template_imported: false,
  alerts_configured: false,
  first_deadline: false,
  team_invited: false,
  first_completion: false,
};

/**
 * Get onboarding progress for an organization.
 */
export const getProgress = query({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.union(
    v.object({
      _id: v.id("onboarding_progress"),
      orgId: v.id("organizations"),
      userId: v.string(),
      steps: v.object({
        account_created: v.boolean(),
        org_setup: v.boolean(),
        template_imported: v.boolean(),
        alerts_configured: v.boolean(),
        first_deadline: v.boolean(),
        team_invited: v.boolean(),
        first_completion: v.boolean(),
      }),
      startedAt: v.number(),
      completedAt: v.union(v.number(), v.null()),
      lastActivityAt: v.number(),
      remindersSent: v.union(
        v.array(
          v.object({
            type: v.union(v.literal("24h"), v.literal("7d")),
            sentAt: v.number(),
          }),
        ),
        v.null(),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("onboarding_progress")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!progress) return null;

    return {
      ...progress,
      completedAt: progress.completedAt ?? null,
      remindersSent: progress.remindersSent ?? null,
    };
  },
});

/**
 * Initialize onboarding progress for a new organization.
 * Creates record if not exists.
 */
export const initializeProgress = mutation({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.id("onboarding_progress"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Check if already exists
    const existing = await ctx.db
      .query("onboarding_progress")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new progress record
    const now = Date.now();
    return await ctx.db.insert("onboarding_progress", {
      orgId: args.orgId,
      userId: user.id,
      steps: defaultSteps,
      startedAt: now,
      lastActivityAt: now,
    });
  },
});

/**
 * Mark an onboarding step as complete.
 */
export const markStepComplete = mutation({
  args: {
    orgId: v.id("organizations"),
    step: stepValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("onboarding_progress")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!progress) {
      return false;
    }

    // Update the specific step
    const updatedSteps = {
      ...progress.steps,
      [args.step]: true,
    };

    await ctx.db.patch(progress._id, {
      steps: updatedSteps,
      lastActivityAt: Date.now(),
    });

    return true;
  },
});

/**
 * Mark entire onboarding as complete.
 */
export const markComplete = mutation({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("onboarding_progress")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!progress) {
      return false;
    }

    await ctx.db.patch(progress._id, {
      completedAt: Date.now(),
      lastActivityAt: Date.now(),
    });

    return true;
  },
});

/**
 * Get incomplete onboarding records for re-engagement.
 * Internal query for cron job.
 */
export const getIncomplete = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("onboarding_progress"),
      orgId: v.id("organizations"),
      userId: v.string(),
      steps: v.object({
        account_created: v.boolean(),
        org_setup: v.boolean(),
        template_imported: v.boolean(),
        alerts_configured: v.boolean(),
        first_deadline: v.boolean(),
        team_invited: v.boolean(),
        first_completion: v.boolean(),
      }),
      startedAt: v.number(),
      lastActivityAt: v.number(),
      remindersSent: v.union(
        v.array(
          v.object({
            type: v.union(v.literal("24h"), v.literal("7d")),
            sentAt: v.number(),
          }),
        ),
        v.null(),
      ),
    }),
  ),
  handler: async (ctx) => {
    // Get all records where completedAt is undefined
    const records = await ctx.db
      .query("onboarding_progress")
      .filter((q) => q.eq(q.field("completedAt"), undefined))
      .collect();

    return records.map((r) => ({
      _id: r._id,
      orgId: r.orgId,
      userId: r.userId,
      steps: r.steps,
      startedAt: r.startedAt,
      lastActivityAt: r.lastActivityAt,
      remindersSent: r.remindersSent ?? null,
    }));
  },
});

/**
 * Record that a reminder was sent.
 * Internal mutation for cron job.
 */
export const recordReminderSent = internalMutation({
  args: {
    progressId: v.id("onboarding_progress"),
    reminderType: v.union(v.literal("24h"), v.literal("7d")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const progress = await ctx.db.get(args.progressId);
    if (!progress) return null;

    const existingReminders = progress.remindersSent ?? [];
    const newReminder = {
      type: args.reminderType,
      sentAt: Date.now(),
    };

    await ctx.db.patch(args.progressId, {
      remindersSent: [...existingReminders, newReminder],
    });

    return null;
  },
});

/**
 * Reset onboarding progress (for testing/development).
 */
export const resetProgress = mutation({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("onboarding_progress")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!progress) {
      return false;
    }

    const now = Date.now();
    await ctx.db.patch(progress._id, {
      steps: defaultSteps,
      completedAt: undefined,
      lastActivityAt: now,
      remindersSent: undefined,
    });

    return true;
  },
});

/**
 * Get onboarding progress by user ID.
 * Useful for checking across organizations.
 */
export const getProgressByUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("onboarding_progress"),
      orgId: v.id("organizations"),
      userId: v.string(),
      steps: v.object({
        account_created: v.boolean(),
        org_setup: v.boolean(),
        template_imported: v.boolean(),
        alerts_configured: v.boolean(),
        first_deadline: v.boolean(),
        team_invited: v.boolean(),
        first_completion: v.boolean(),
      }),
      startedAt: v.number(),
      completedAt: v.union(v.number(), v.null()),
      lastActivityAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    const progress = await ctx.db
      .query("onboarding_progress")
      .withIndex("by_user", (q) => q.eq("userId", user.id))
      .first();

    if (!progress) return null;

    return {
      _id: progress._id,
      orgId: progress.orgId,
      userId: progress.userId,
      steps: progress.steps,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt ?? null,
      lastActivityAt: progress.lastActivityAt,
    };
  },
});

// Step titles for email (used in production when sending emails)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const STEP_TITLES: Record<string, string> = {
  org_setup: "Set Up Organization",
  template_imported: "Import Templates",
  alerts_configured: "Configure Alerts",
  first_deadline: "Create First Deadline",
  team_invited: "Invite Team",
};

/**
 * Send onboarding reminder emails.
 * Called by cron job daily at 2 PM UTC.
 */
export const sendOnboardingReminders = internalAction({
  args: {},
  returns: v.object({
    processed: v.number(),
    sent24h: v.number(),
    sent7d: v.number(),
  }),
  handler: async (
    ctx,
  ): Promise<{ processed: number; sent24h: number; sent7d: number }> => {
    // Get all incomplete onboarding records
    type IncompleteRecord = {
      _id: Id<"onboarding_progress">;
      lastActivityAt: number;
      remindersSent?: Array<{ type: string; sentAt: number }> | null;
      userId: string;
      orgId: Id<"organizations">;
    };
    const records = await ctx.runQuery(internal.onboarding.getIncomplete);
    const incompleteRecords = records as IncompleteRecord[];

    let sent24h = 0;
    let sent7d = 0;

    for (const progress of incompleteRecords) {
      const hoursSinceActivity =
        (Date.now() - progress.lastActivityAt) / (1000 * 60 * 60);

      const remindersSent = progress.remindersSent ?? [];
      const has24hReminder = remindersSent.some(
        (r: { type: string }) => r.type === "24h",
      );
      const has7dReminder = remindersSent.some(
        (r: { type: string }) => r.type === "7d",
      );

      // 24 hour reminder: 24-48 hours since last activity
      if (
        hoursSinceActivity >= 24 &&
        hoursSinceActivity < 48 &&
        !has24hReminder
      ) {
        // In production, send email via Resend
        // await sendOnboardingReminderEmail(progress, "24h");

        // Record that we sent the reminder
        await ctx.runMutation(internal.onboarding.recordReminderSent, {
          progressId: progress._id,
          reminderType: "24h",
        });
        sent24h++;
      }

      // 7 day reminder: 168-192 hours (7-8 days) since last activity
      if (
        hoursSinceActivity >= 168 &&
        hoursSinceActivity < 192 &&
        !has7dReminder
      ) {
        // In production, send email via Resend
        // await sendOnboardingReminderEmail(progress, "7d");

        // Record that we sent the reminder
        await ctx.runMutation(internal.onboarding.recordReminderSent, {
          progressId: progress._id,
          reminderType: "7d",
        });
        sent7d++;
      }
    }

    return {
      processed: incompleteRecords.length,
      sent24h,
      sent7d,
    };
  },
});
