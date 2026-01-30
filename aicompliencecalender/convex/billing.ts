/**
 * Billing and subscription management.
 */

import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Plan configuration (mirrored from lib/billing/plans.ts for Convex)
const PLANS = {
  starter: {
    name: "Starter",
    features: {
      users: 1,
      deadlines: 25,
      storage: 1, // GB
      emailAlerts: true,
      smsAlerts: false,
      formPreFills: 0,
    },
  },
  professional: {
    name: "Professional",
    features: {
      users: 5,
      deadlines: -1,
      storage: 10,
      emailAlerts: true,
      smsAlerts: true,
      formPreFills: 10,
    },
  },
  business: {
    name: "Business",
    features: {
      users: 15,
      deadlines: -1,
      storage: 50,
      emailAlerts: true,
      smsAlerts: true,
      formPreFills: -1,
    },
  },
} as const;

type PlanId = keyof typeof PLANS;
type FeatureKey = keyof typeof PLANS.starter.features;

// Trial period in days
const TRIAL_PERIOD_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Get subscription for an organization.
 */
export const getSubscription = query({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.union(
    v.object({
      _id: v.id("subscriptions"),
      orgId: v.id("organizations"),
      stripeCustomerId: v.string(),
      stripeSubscriptionId: v.string(),
      stripePriceId: v.string(),
      plan: v.union(
        v.literal("starter"),
        v.literal("professional"),
        v.literal("business"),
      ),
      billingCycle: v.union(v.literal("monthly"), v.literal("yearly")),
      status: v.string(),
      currentPeriodStart: v.number(),
      currentPeriodEnd: v.number(),
      cancelAtPeriodEnd: v.boolean(),
      trialEnd: v.union(v.number(), v.null()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (!subscription) return null;

    return {
      ...subscription,
      trialEnd: subscription.trialEnd ?? null,
    };
  },
});

/**
 * Get or create Stripe customer ID for an organization.
 */
export const getOrCreateStripeCustomerId = mutation({
  args: {
    orgId: v.id("organizations"),
    stripeCustomerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if subscription already exists
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (existing) {
      // Update customer ID if needed
      if (existing.stripeCustomerId !== args.stripeCustomerId) {
        await ctx.db.patch(existing._id, {
          stripeCustomerId: args.stripeCustomerId,
        });
      }
    }
    // Customer ID will be saved when subscription is created via webhook

    return null;
  },
});

/**
 * Create subscription record (called from webhook).
 */
export const createSubscription = internalMutation({
  args: {
    orgId: v.id("organizations"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    plan: v.union(
      v.literal("starter"),
      v.literal("professional"),
      v.literal("business"),
    ),
    billingCycle: v.union(v.literal("monthly"), v.literal("yearly")),
    status: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    trialEnd: v.optional(v.number()),
  },
  returns: v.id("subscriptions"),
  handler: async (ctx, args) => {
    // Check if subscription already exists
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId: args.stripePriceId,
        plan: args.plan,
        billingCycle: args.billingCycle,
        status: args.status as
          | "trialing"
          | "active"
          | "past_due"
          | "canceled"
          | "unpaid"
          | "incomplete"
          | "incomplete_expired"
          | "paused",
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        trialEnd: args.trialEnd,
      });
      return existing._id;
    }

    // Create new subscription
    return await ctx.db.insert("subscriptions", {
      orgId: args.orgId,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      plan: args.plan,
      billingCycle: args.billingCycle,
      status: args.status as
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "paused",
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      trialEnd: args.trialEnd,
    });
  },
});

/**
 * Update subscription (called from webhook).
 */
export const updateSubscription = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    stripePriceId: v.optional(v.string()),
    plan: v.optional(
      v.union(
        v.literal("starter"),
        v.literal("professional"),
        v.literal("business"),
      ),
    ),
    billingCycle: v.optional(
      v.union(v.literal("monthly"), v.literal("yearly")),
    ),
    status: v.optional(v.string()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    trialEnd: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .first();

    if (!subscription) {
      console.error(
        "Subscription not found for update:",
        args.stripeSubscriptionId,
      );
      return null;
    }

    const updates: Record<string, unknown> = {};
    if (args.stripePriceId) updates.stripePriceId = args.stripePriceId;
    if (args.plan) updates.plan = args.plan;
    if (args.billingCycle) updates.billingCycle = args.billingCycle;
    if (args.status) updates.status = args.status;
    if (args.currentPeriodStart)
      updates.currentPeriodStart = args.currentPeriodStart;
    if (args.currentPeriodEnd) updates.currentPeriodEnd = args.currentPeriodEnd;
    if (args.cancelAtPeriodEnd !== undefined)
      updates.cancelAtPeriodEnd = args.cancelAtPeriodEnd;
    if (args.trialEnd !== undefined) updates.trialEnd = args.trialEnd;

    await ctx.db.patch(subscription._id, updates);
    return null;
  },
});

/**
 * Cancel subscription (called from webhook).
 */
export const cancelSubscription = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .first();

    if (!subscription) {
      return null;
    }

    await ctx.db.patch(subscription._id, {
      status: "canceled",
    });

    return null;
  },
});

/**
 * Get trial status for an organization.
 */
export const getTrialStatus = query({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.object({
    inTrial: v.boolean(),
    daysRemaining: v.number(),
    trialEnd: v.union(v.number(), v.null()),
    expired: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    // No subscription - check org creation for free trial
    if (!subscription) {
      const org = await ctx.db.get(args.orgId);
      if (!org) {
        return {
          inTrial: false,
          daysRemaining: 0,
          trialEnd: null,
          expired: true,
        };
      }

      const trialEnd = org.createdAt + TRIAL_PERIOD_DAYS * MS_PER_DAY;
      const now = Date.now();
      const daysRemaining = Math.ceil((trialEnd - now) / MS_PER_DAY);

      return {
        inTrial: now < trialEnd,
        daysRemaining: Math.max(0, daysRemaining),
        trialEnd,
        expired: now >= trialEnd,
      };
    }

    // Has subscription - check if trialing
    if (subscription.status === "trialing" && subscription.trialEnd) {
      const now = Date.now();
      const daysRemaining = Math.ceil(
        (subscription.trialEnd - now) / MS_PER_DAY,
      );

      return {
        inTrial: true,
        daysRemaining: Math.max(0, daysRemaining),
        trialEnd: subscription.trialEnd,
        expired: false,
      };
    }

    // Active subscription, not in trial
    return {
      inTrial: false,
      daysRemaining: 0,
      trialEnd: null,
      expired: false,
    };
  },
});

/**
 * Get current usage for an organization.
 */
export const getCurrentUsage = query({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.object({
    deadlinesCreated: v.number(),
    documentsUploaded: v.number(),
    storageUsedBytes: v.number(),
    formPreFills: v.number(),
    alertsSent: v.number(),
    month: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const usage = await ctx.db
      .query("usage")
      .withIndex("by_org_month", (q) =>
        q.eq("orgId", args.orgId).eq("month", currentMonth),
      )
      .first();

    if (!usage) {
      return {
        deadlinesCreated: 0,
        documentsUploaded: 0,
        storageUsedBytes: 0,
        formPreFills: 0,
        alertsSent: 0,
        month: currentMonth,
      };
    }

    return {
      deadlinesCreated: usage.deadlinesCreated,
      documentsUploaded: usage.documentsUploaded,
      storageUsedBytes: usage.storageUsedBytes,
      formPreFills: usage.formPreFills,
      alertsSent: usage.alertsSent,
      month: usage.month,
    };
  },
});

/**
 * Increment usage for a metric.
 */
export const incrementUsage = internalMutation({
  args: {
    orgId: v.id("organizations"),
    metric: v.union(
      v.literal("deadlinesCreated"),
      v.literal("documentsUploaded"),
      v.literal("storageUsedBytes"),
      v.literal("formPreFills"),
      v.literal("alertsSent"),
    ),
    amount: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const incrementBy = args.amount ?? 1;

    const usage = await ctx.db
      .query("usage")
      .withIndex("by_org_month", (q) =>
        q.eq("orgId", args.orgId).eq("month", currentMonth),
      )
      .first();

    if (!usage) {
      // Create new usage record
      await ctx.db.insert("usage", {
        orgId: args.orgId,
        month: currentMonth,
        deadlinesCreated: args.metric === "deadlinesCreated" ? incrementBy : 0,
        documentsUploaded:
          args.metric === "documentsUploaded" ? incrementBy : 0,
        storageUsedBytes: args.metric === "storageUsedBytes" ? incrementBy : 0,
        formPreFills: args.metric === "formPreFills" ? incrementBy : 0,
        alertsSent: args.metric === "alertsSent" ? incrementBy : 0,
      });
    } else {
      // Increment existing record
      const updates = {
        [args.metric]: (usage[args.metric] || 0) + incrementBy,
      };
      await ctx.db.patch(usage._id, updates);
    }

    return null;
  },
});

/**
 * Check if usage is within plan limits.
 */
export const checkLimit = query({
  args: {
    orgId: v.id("organizations"),
    limitType: v.union(
      v.literal("deadlines"),
      v.literal("storage"),
      v.literal("formPreFills"),
      v.literal("users"),
    ),
  },
  returns: v.object({
    allowed: v.boolean(),
    remaining: v.union(v.number(), v.null()),
    limit: v.union(v.number(), v.literal("unlimited")),
    current: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    // No subscription - use free trial limits (professional)
    const planId: PlanId = subscription?.plan || "professional";
    const plan = PLANS[planId];

    // Map limitType to feature key
    const featureMap: Record<string, FeatureKey> = {
      deadlines: "deadlines",
      storage: "storage",
      formPreFills: "formPreFills",
      users: "users",
    };

    const featureKey = featureMap[args.limitType];
    const limit = plan.features[featureKey];

    // If limit is -1, it's unlimited
    if (limit === -1 || typeof limit === "boolean") {
      return {
        allowed: true,
        remaining: null,
        limit: "unlimited" as const,
        current: 0,
      };
    }

    // Get current usage
    let current = 0;

    if (args.limitType === "deadlines") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usage = await ctx.db
        .query("usage")
        .withIndex("by_org_month", (q) =>
          q.eq("orgId", args.orgId).eq("month", currentMonth),
        )
        .first();
      current = usage?.deadlinesCreated || 0;
    } else if (args.limitType === "storage") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usage = await ctx.db
        .query("usage")
        .withIndex("by_org_month", (q) =>
          q.eq("orgId", args.orgId).eq("month", currentMonth),
        )
        .first();
      // Convert bytes to GB for comparison
      current = Math.ceil(
        (usage?.storageUsedBytes || 0) / (1024 * 1024 * 1024),
      );
    } else if (args.limitType === "formPreFills") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usage = await ctx.db
        .query("usage")
        .withIndex("by_org_month", (q) =>
          q.eq("orgId", args.orgId).eq("month", currentMonth),
        )
        .first();
      current = usage?.formPreFills || 0;
    } else if (args.limitType === "users") {
      const members = await ctx.db
        .query("user_organizations")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
        .collect();
      current = members.length;
    }

    const allowed = current < limit;
    const remaining = Math.max(0, limit - current);

    return {
      allowed,
      remaining,
      limit: limit as number,
      current,
    };
  },
});

/**
 * Get organizations in trial for warning emails.
 */
export const getTrialingOrgs = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      orgId: v.id("organizations"),
      trialEnd: v.number(),
      orgName: v.string(),
      ownerId: v.string(),
    }),
  ),
  handler: async (ctx) => {
    // Get orgs with trialing subscriptions
    const trialingSubscriptions = await ctx.db
      .query("subscriptions")
      .filter((q) => q.eq(q.field("status"), "trialing"))
      .collect();

    const results = [];

    for (const sub of trialingSubscriptions) {
      if (!sub.trialEnd) continue;
      const org = await ctx.db.get(sub.orgId);
      if (!org) continue;

      results.push({
        orgId: sub.orgId,
        trialEnd: sub.trialEnd,
        orgName: org.name,
        ownerId: org.ownerId,
      });
    }

    // Also get orgs without subscriptions (free trial from org creation)
    const allOrgs = await ctx.db.query("organizations").collect();

    for (const org of allOrgs) {
      // Check if already has a subscription
      const hasSub = trialingSubscriptions.some((s) => s.orgId === org._id);
      if (hasSub) continue;

      const trialEnd = org.createdAt + TRIAL_PERIOD_DAYS * MS_PER_DAY;
      const now = Date.now();

      // Only include if still in trial or recently expired
      if (trialEnd > now - 7 * MS_PER_DAY) {
        results.push({
          orgId: org._id,
          trialEnd,
          orgName: org.name,
          ownerId: org.ownerId,
        });
      }
    }

    return results;
  },
});

/**
 * Record that a trial warning was sent.
 */
export const recordTrialWarning = internalMutation({
  args: {
    orgId: v.id("organizations"),
    daysRemaining: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("trial_warnings", {
      orgId: args.orgId,
      daysRemaining: args.daysRemaining,
      sentAt: Date.now(),
    });
    return null;
  },
});

/**
 * Check if trial warning was already sent.
 */
export const checkTrialWarningSent = internalQuery({
  args: {
    orgId: v.id("organizations"),
    daysRemaining: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const warnings = await ctx.db
      .query("trial_warnings")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    return warnings.some((w) => w.daysRemaining === args.daysRemaining);
  },
});

// Type for trialing org data (matching getTrialingOrgs return)
interface TrialingOrg {
  orgId: Id<"organizations">;
  trialEnd: number;
  orgName: string;
  ownerId: string;
}

/**
 * Send trial expiry warnings.
 */
export const sendTrialWarnings = internalAction({
  args: {},
  returns: v.object({
    processed: v.number(),
    sent: v.number(),
  }),
  handler: async (ctx): Promise<{ processed: number; sent: number }> => {
    const trialingOrgs: TrialingOrg[] = await ctx.runQuery(
      internal.billing.getTrialingOrgs,
    );

    let sent = 0;

    for (const org of trialingOrgs) {
      const now = Date.now();
      const daysRemaining = Math.ceil((org.trialEnd - now) / MS_PER_DAY);

      // Send warnings at 7, 3, 1, 0 days
      if ([7, 3, 1, 0].includes(daysRemaining)) {
        // Check if already sent
        const alreadySent = await ctx.runQuery(
          internal.billing.checkTrialWarningSent,
          {
            orgId: org.orgId,
            daysRemaining,
          },
        );

        if (!alreadySent) {
          // In production, send email via Resend
          // await sendTrialWarningEmail(org, daysRemaining);

          await ctx.runMutation(internal.billing.recordTrialWarning, {
            orgId: org.orgId,
            daysRemaining,
          });
          sent++;
        }
      }
    }

    return {
      processed: trialingOrgs.length,
      sent,
    };
  },
});

/**
 * Update subscription status to past_due (payment failed).
 */
export const markPaymentFailed = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .first();

    if (!subscription) {
      return null;
    }

    await ctx.db.patch(subscription._id, {
      status: "past_due",
    });

    // Create notification for org owner
    const org = await ctx.db.get(subscription.orgId);
    if (org) {
      await ctx.db.insert("notifications", {
        orgId: subscription.orgId,
        userId: org.ownerId,
        type: "payment_failed",
        title: "Payment Failed",
        message:
          "Your payment failed. Please update your payment method to avoid service interruption.",
        createdAt: Date.now(),
      });
    }

    return null;
  },
});

/**
 * Check limit internally (for use within mutations).
 */
export const checkLimitInternal = internalQuery({
  args: {
    orgId: v.id("organizations"),
    limitType: v.union(
      v.literal("deadlines"),
      v.literal("storage"),
      v.literal("formPreFills"),
      v.literal("users"),
    ),
  },
  returns: v.object({
    allowed: v.boolean(),
    remaining: v.union(v.number(), v.null()),
    limit: v.union(v.number(), v.literal("unlimited")),
    current: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .first();

    // No subscription - use free trial limits (professional)
    const planId: PlanId = subscription?.plan || "professional";
    const plan = PLANS[planId];

    // Map limitType to feature key
    const featureMap: Record<string, FeatureKey> = {
      deadlines: "deadlines",
      storage: "storage",
      formPreFills: "formPreFills",
      users: "users",
    };

    const featureKey = featureMap[args.limitType];
    const limit = plan.features[featureKey];

    // If limit is -1, it's unlimited
    if (limit === -1 || typeof limit === "boolean") {
      return {
        allowed: true,
        remaining: null,
        limit: "unlimited" as const,
        current: 0,
      };
    }

    // Get current usage
    let current = 0;

    if (args.limitType === "deadlines") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usage = await ctx.db
        .query("usage")
        .withIndex("by_org_month", (q) =>
          q.eq("orgId", args.orgId).eq("month", currentMonth),
        )
        .first();
      current = usage?.deadlinesCreated || 0;
    } else if (args.limitType === "storage") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usage = await ctx.db
        .query("usage")
        .withIndex("by_org_month", (q) =>
          q.eq("orgId", args.orgId).eq("month", currentMonth),
        )
        .first();
      current = Math.ceil(
        (usage?.storageUsedBytes || 0) / (1024 * 1024 * 1024),
      );
    } else if (args.limitType === "formPreFills") {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const usage = await ctx.db
        .query("usage")
        .withIndex("by_org_month", (q) =>
          q.eq("orgId", args.orgId).eq("month", currentMonth),
        )
        .first();
      current = usage?.formPreFills || 0;
    } else if (args.limitType === "users") {
      const members = await ctx.db
        .query("user_organizations")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
        .collect();
      current = members.length;
    }

    const allowed = current < limit;
    const remaining = Math.max(0, limit - current);

    return {
      allowed,
      remaining,
      limit: limit as number,
      current,
    };
  },
});

/**
 * Get subscription by Stripe customer ID.
 */
export const getSubscriptionByCustomer = internalQuery({
  args: {
    stripeCustomerId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("subscriptions"),
      orgId: v.id("organizations"),
      stripeSubscriptionId: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId),
      )
      .first();

    if (!subscription) return null;

    return {
      _id: subscription._id,
      orgId: subscription.orgId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    };
  },
});
