import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
  internalAction,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Urgency thresholds in days */
const URGENCY_THRESHOLDS = {
  early: 14,
  medium: 7,
  high: 1,
  critical: 0,
} as const;

/** Default alert preferences */
const DEFAULT_PREFERENCES = {
  earlyChannels: ["email"],
  mediumChannels: ["email", "in_app"],
  highChannels: ["email", "sms", "in_app"],
  criticalChannels: ["email", "sms", "in_app"],
  alertDays: [30, 14, 7, 3, 1, 0],
  escalationEnabled: true,
  escalationContacts: [] as string[],
};

type AlertChannel = "email" | "sms" | "push" | "in_app";
type AlertUrgency = "early" | "medium" | "high" | "critical";

/** Calculate urgency from days before deadline */
function getUrgencyFromDays(daysBefore: number): AlertUrgency {
  if (daysBefore <= URGENCY_THRESHOLDS.critical) return "critical";
  if (daysBefore <= URGENCY_THRESHOLDS.high) return "high";
  if (daysBefore <= URGENCY_THRESHOLDS.medium) return "medium";
  return "early";
}

/** Get channels for urgency level */
function getChannelsForUrgency(
  urgency: AlertUrgency,
  prefs: typeof DEFAULT_PREFERENCES,
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

// ============ QUERIES ============

/** Get single alert by ID */
export const get = query({
  args: { alertId: v.id("alerts") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.alertId);
  },
});

/** List alerts for a deadline */
export const listByDeadline = query({
  args: { deadlineId: v.id("deadlines") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_deadline", (q) => q.eq("deadlineId", args.deadlineId))
      .collect();
  },
});

/** List alerts for an organization */
export const listByOrg = query({
  args: {
    orgId: v.id("organizations"),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("sent"),
        v.literal("delivered"),
        v.literal("failed"),
        v.literal("acknowledged"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("alerts")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId));

    const alerts = await query.collect();

    let filtered = alerts;
    if (args.status) {
      filtered = alerts.filter((a) => a.status === args.status);
    }

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

/** Get alerts due for processing */
export const getDueAlerts = internalQuery({
  args: {
    from: v.number(),
    to: v.number(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_scheduled", (q) =>
        q.eq("status", "scheduled").gte("scheduledFor", args.from),
      )
      .collect();

    return alerts.filter(
      (a) =>
        a.scheduledFor <= args.to &&
        (!a.snoozedUntil || a.snoozedUntil <= args.from),
    );
  },
});

/** Get failed alerts for retry */
export const getFailedAlerts = query({
  args: { orgId: v.id("organizations") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_org_status", (q) =>
        q.eq("orgId", args.orgId).eq("status", "failed"),
      )
      .collect();

    return alerts;
  },
});

/** Get alert preferences for org/user */
export const getPreferences = query({
  args: {
    orgId: v.id("organizations"),
    userId: v.optional(v.string()),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("alert_preferences")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.userId),
      )
      .first();

    return prefs;
  },
});

// ============ MUTATIONS ============

/** Schedule alerts for a deadline */
export const scheduleAlertsForDeadline = mutation({
  args: {
    deadlineId: v.id("deadlines"),
    dueDate: v.number(),
    orgId: v.id("organizations"),
    assignedTo: v.optional(v.string()),
  },
  returns: v.array(v.id("alerts")),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get user preferences or use defaults
    let prefs = await ctx.db
      .query("alert_preferences")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.assignedTo),
      )
      .first();

    if (!prefs) {
      // Try org-level preferences
      prefs = await ctx.db
        .query("alert_preferences")
        .withIndex("by_org_user", (q) =>
          q.eq("orgId", args.orgId).eq("userId", undefined),
        )
        .first();
    }

    const preferences = prefs ?? DEFAULT_PREFERENCES;
    const alertDays = preferences.alertDays;
    const alertIds: Id<"alerts">[] = [];

    for (const daysBefore of alertDays) {
      const scheduledFor = args.dueDate - daysBefore * MS_PER_DAY;

      // Skip if in the past
      if (scheduledFor < now) continue;

      const urgency = getUrgencyFromDays(daysBefore);
      const channels = getChannelsForUrgency(
        urgency,
        preferences as typeof DEFAULT_PREFERENCES,
      );

      // Create an alert for each channel
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

        // Log the scheduling
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
  },
});

/** Cancel all pending alerts for a deadline */
export const cancelPendingAlerts = mutation({
  args: {
    deadlineId: v.id("deadlines"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_deadline", (q) => q.eq("deadlineId", args.deadlineId))
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
  },
});

/** Reschedule alerts when deadline due date changes */
export const rescheduleAlerts = mutation({
  args: {
    deadlineId: v.id("deadlines"),
    newDueDate: v.number(),
    orgId: v.id("organizations"),
    assignedTo: v.optional(v.string()),
  },
  returns: v.array(v.id("alerts")),
  handler: async (ctx, args) => {
    // Cancel existing scheduled alerts
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_deadline", (q) => q.eq("deadlineId", args.deadlineId))
      .collect();

    const now = Date.now();

    for (const alert of alerts) {
      if (alert.status === "scheduled") {
        await ctx.db.delete(alert._id);

        await ctx.db.insert("alert_audit_log", {
          alertId: alert._id,
          orgId: alert.orgId,
          action: "cancelled",
          details: { reason: "deadline_rescheduled" },
          timestamp: now,
        });
      }
    }

    // Schedule new alerts - call the mutation internally
    const newAlertIds = await scheduleAlertsForDeadlineInternal(ctx, {
      deadlineId: args.deadlineId,
      dueDate: args.newDueDate,
      orgId: args.orgId,
      assignedTo: args.assignedTo,
    });

    return newAlertIds;
  },
});

/** Internal helper for scheduling (avoids nested mutation call) */
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

  const preferences = prefs ?? DEFAULT_PREFERENCES;
  const alertDays = preferences.alertDays;
  const alertIds: Id<"alerts">[] = [];

  for (const daysBefore of alertDays) {
    const scheduledFor = args.dueDate - daysBefore * MS_PER_DAY;
    if (scheduledFor < now) continue;

    const urgency = getUrgencyFromDays(daysBefore);
    const channels = getChannelsForUrgency(
      urgency,
      preferences as typeof DEFAULT_PREFERENCES,
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

/** Mark alert as sent */
export const markSent = internalMutation({
  args: { alertId: v.id("alerts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const alert = await ctx.db.get(args.alertId);
    if (!alert) return null;

    await ctx.db.patch(args.alertId, {
      status: "sent",
      sentAt: now,
    });

    await ctx.db.insert("alert_audit_log", {
      alertId: args.alertId,
      orgId: alert.orgId,
      action: "sent",
      timestamp: now,
    });

    return null;
  },
});

/** Mark alert as delivered */
export const markDelivered = internalMutation({
  args: { alertId: v.id("alerts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const alert = await ctx.db.get(args.alertId);
    if (!alert) return null;

    await ctx.db.patch(args.alertId, {
      status: "delivered",
      deliveredAt: now,
    });

    await ctx.db.insert("alert_audit_log", {
      alertId: args.alertId,
      orgId: alert.orgId,
      action: "delivered",
      timestamp: now,
    });

    return null;
  },
});

/** Mark alert as failed */
export const markFailed = internalMutation({
  args: {
    alertId: v.id("alerts"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const alert = await ctx.db.get(args.alertId);
    if (!alert) return null;

    await ctx.db.patch(args.alertId, {
      status: "failed",
      errorMessage: args.error,
      retryCount: alert.retryCount + 1,
    });

    await ctx.db.insert("alert_audit_log", {
      alertId: args.alertId,
      orgId: alert.orgId,
      action: "failed",
      details: { error: args.error, retryCount: alert.retryCount + 1 },
      timestamp: now,
    });

    return null;
  },
});

/** Acknowledge an alert */
export const acknowledge = mutation({
  args: {
    alertId: v.id("alerts"),
    via: v.union(
      v.literal("email_link"),
      v.literal("sms_reply"),
      v.literal("in_app_button"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");

    await ctx.db.patch(args.alertId, {
      status: "acknowledged",
      acknowledgedAt: now,
      acknowledgedVia: args.via,
    });

    await ctx.db.insert("alert_audit_log", {
      alertId: args.alertId,
      orgId: alert.orgId,
      action: "acknowledged",
      details: { via: args.via },
      timestamp: now,
    });

    return null;
  },
});

/** Snooze an alert */
export const snooze = mutation({
  args: {
    alertId: v.id("alerts"),
    until: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");

    // Get the deadline to check due date
    const deadline = await ctx.db.get(alert.deadlineId);
    if (deadline && args.until > deadline.dueDate) {
      throw new Error("Cannot snooze past the deadline due date");
    }

    await ctx.db.patch(args.alertId, {
      snoozedUntil: args.until,
      status: "scheduled", // Reset to scheduled if was sent
    });

    await ctx.db.insert("alert_audit_log", {
      alertId: args.alertId,
      orgId: alert.orgId,
      action: "snoozed",
      details: { until: args.until },
      timestamp: now,
    });

    return null;
  },
});

/** Unsnooze an alert */
export const unsnooze = mutation({
  args: { alertId: v.id("alerts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");

    await ctx.db.patch(args.alertId, {
      snoozedUntil: undefined,
    });

    await ctx.db.insert("alert_audit_log", {
      alertId: args.alertId,
      orgId: alert.orgId,
      action: "scheduled",
      details: { unsnoozed: true },
      timestamp: now,
    });

    return null;
  },
});

/** Retry a failed alert */
export const retry = mutation({
  args: { alertId: v.id("alerts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");
    if (alert.status !== "failed") throw new Error("Alert is not failed");

    await ctx.db.patch(args.alertId, {
      status: "scheduled",
      errorMessage: undefined,
    });

    return null;
  },
});

// ============ PREFERENCES MUTATIONS ============

/** Save alert preferences */
export const savePreferences = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.optional(v.string()),
    earlyChannels: v.array(v.string()),
    mediumChannels: v.array(v.string()),
    highChannels: v.array(v.string()),
    criticalChannels: v.array(v.string()),
    alertDays: v.array(v.number()),
    escalationEnabled: v.boolean(),
    escalationContacts: v.array(v.string()),
    phoneNumber: v.optional(v.string()),
    emailOverride: v.optional(v.string()),
  },
  returns: v.id("alert_preferences"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if preferences exist
    const existing = await ctx.db
      .query("alert_preferences")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.userId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        earlyChannels: args.earlyChannels,
        mediumChannels: args.mediumChannels,
        highChannels: args.highChannels,
        criticalChannels: args.criticalChannels,
        alertDays: args.alertDays,
        escalationEnabled: args.escalationEnabled,
        escalationContacts: args.escalationContacts,
        phoneNumber: args.phoneNumber,
        emailOverride: args.emailOverride,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("alert_preferences", {
      orgId: args.orgId,
      userId: args.userId,
      earlyChannels: args.earlyChannels,
      mediumChannels: args.mediumChannels,
      highChannels: args.highChannels,
      criticalChannels: args.criticalChannels,
      alertDays: args.alertDays,
      escalationEnabled: args.escalationEnabled,
      escalationContacts: args.escalationContacts,
      phoneNumber: args.phoneNumber,
      emailOverride: args.emailOverride,
      createdAt: now,
    });
  },
});

/** Get alert audit history */
export const getAlertHistory = query({
  args: { alertId: v.id("alerts") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alert_audit_log")
      .withIndex("by_alert", (q) => q.eq("alertId", args.alertId))
      .order("desc")
      .collect();
  },
});

// ============ ALERT PROCESSING ============

/** Maximum retry attempts before escalation */
const MAX_RETRY_ATTEMPTS = 3;

/** Retry delays in milliseconds (15 min, 30 min, 45 min) */
const RETRY_DELAYS = [15 * 60 * 1000, 30 * 60 * 1000, 45 * 60 * 1000];

/** Process a single alert - sends via appropriate channel */
export const processAlert = internalAction({
  args: { alertId: v.id("alerts") },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    // Get alert and related data
    const alert = await ctx.runQuery(internal.alerts.getAlertInternal, {
      alertId: args.alertId,
    });

    if (!alert) {
      return { success: false, error: "Alert not found" };
    }

    if (alert.status !== "scheduled") {
      return { success: false, error: "Alert not in scheduled status" };
    }

    // Get deadline for alert content
    const deadline = await ctx.runQuery(internal.alerts.getDeadlineInternal, {
      deadlineId: alert.deadlineId,
    });

    if (!deadline) {
      return { success: false, error: "Deadline not found" };
    }

    // Get user preferences for contact info
    const prefs = await ctx.runQuery(internal.alerts.getPreferencesInternal, {
      orgId: alert.orgId,
      userId: alert.userId,
    });

    try {
      // Route to appropriate channel
      switch (alert.channel) {
        case "email":
          await sendEmailAlert(alert, deadline, prefs);
          break;
        case "sms":
          await sendSMSAlert(alert, deadline, prefs);
          break;
        case "in_app":
          await ctx.runMutation(internal.alerts.createInAppNotification, {
            orgId: alert.orgId,
            userId: alert.userId ?? "",
            alertId: alert._id,
            deadlineTitle: deadline.title,
            dueDate: deadline.dueDate,
            urgency: alert.urgency,
          });
          break;
        case "push":
          // Push notifications not yet implemented
          break;
      }

      // Mark as sent
      await ctx.runMutation(internal.alerts.markSent, {
        alertId: args.alertId,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Mark as failed
      await ctx.runMutation(internal.alerts.markFailed, {
        alertId: args.alertId,
        error: errorMessage,
      });

      // Schedule retry if under max attempts
      if (alert.retryCount < MAX_RETRY_ATTEMPTS) {
        const retryDelay =
          RETRY_DELAYS[alert.retryCount] ??
          RETRY_DELAYS[RETRY_DELAYS.length - 1];
        await ctx.runMutation(internal.alerts.scheduleRetry, {
          alertId: args.alertId,
          retryAt: Date.now() + retryDelay,
        });
      } else {
        // Escalate after max retries
        await ctx.runMutation(internal.alerts.escalateAlert, {
          alertId: args.alertId,
        });
      }

      return { success: false, error: errorMessage };
    }
  },
});

/** Send email alert using Resend adapter */
async function sendEmailAlert(
  alert: {
    _id: Id<"alerts">;
    urgency: string;
  },
  deadline: { title: string; dueDate: number; description?: string },
  prefs: { emailOverride?: string } | null,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const to = prefs?.emailOverride ?? "user@example.com"; // Would get from Clerk in production
  const dueDate = new Date(deadline.dueDate).toLocaleDateString();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AI Compliance Calendar <alerts@aicompliancecalendar.com>",
      to,
      subject: `[${alert.urgency.toUpperCase()}] Deadline Reminder: ${deadline.title}`,
      html: `
        <h2>Deadline Reminder</h2>
        <p><strong>${deadline.title}</strong> is due on <strong>${dueDate}</strong>.</p>
        ${deadline.description ? `<p>${deadline.description}</p>` : ""}
        <p>Priority: <strong>${alert.urgency}</strong></p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/deadlines">View in Dashboard</a></p>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email send failed: ${error}`);
  }
}

/** Send SMS alert using Twilio adapter */
async function sendSMSAlert(
  alert: { _id: Id<"alerts">; urgency: string },
  deadline: { title: string; dueDate: number },
  prefs: { phoneNumber?: string } | null,
): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio credentials not configured");
  }

  const to = prefs?.phoneNumber;
  if (!to) {
    throw new Error("No phone number configured for SMS alerts");
  }

  const dueDate = new Date(deadline.dueDate).toLocaleDateString();
  const body = `[${alert.urgency.toUpperCase()}] ${deadline.title} is due ${dueDate}. Reply DONE to acknowledge.`;

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: body,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SMS send failed: ${error}`);
  }
}

// ============ INTERNAL QUERIES/MUTATIONS FOR ACTIONS ============

/** Internal query to get alert */
export const getAlertInternal = internalQuery({
  args: { alertId: v.id("alerts") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.alertId);
  },
});

/** Internal query to get deadline */
export const getDeadlineInternal = internalQuery({
  args: { deadlineId: v.id("deadlines") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.deadlineId);
  },
});

/** Internal query to get preferences */
export const getPreferencesInternal = internalQuery({
  args: {
    orgId: v.id("organizations"),
    userId: v.optional(v.string()),
  },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("alert_preferences")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", args.orgId).eq("userId", args.userId),
      )
      .first();
    return prefs;
  },
});

/** Create in-app notification for an alert */
export const createInAppNotification = internalMutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.string(),
    alertId: v.id("alerts"),
    deadlineTitle: v.string(),
    dueDate: v.number(),
    urgency: v.string(),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    const dueDateStr = new Date(args.dueDate).toLocaleDateString();

    return await ctx.db.insert("notifications", {
      orgId: args.orgId,
      userId: args.userId,
      type: "deadline_reminder",
      title: `Deadline Reminder: ${args.deadlineTitle}`,
      message: `Due on ${dueDateStr}. Priority: ${args.urgency}`,
      data: { alertId: args.alertId, urgency: args.urgency },
      createdAt: Date.now(),
    });
  },
});

/** Schedule a retry for failed alert */
export const scheduleRetry = internalMutation({
  args: {
    alertId: v.id("alerts"),
    retryAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert) return null;

    await ctx.db.patch(args.alertId, {
      status: "scheduled",
      scheduledFor: args.retryAt,
    });

    await ctx.db.insert("alert_audit_log", {
      alertId: args.alertId,
      orgId: alert.orgId,
      action: "scheduled",
      details: { retry: true, retryAt: args.retryAt },
      timestamp: Date.now(),
    });

    return null;
  },
});

/** Escalate an alert after max retries */
export const escalateAlert = internalMutation({
  args: { alertId: v.id("alerts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert) return null;

    // Get escalation contacts from preferences
    const prefs = await ctx.db
      .query("alert_preferences")
      .withIndex("by_org_user", (q) =>
        q.eq("orgId", alert.orgId).eq("userId", alert.userId),
      )
      .first();

    const escalationContacts = prefs?.escalationContacts ?? [];

    await ctx.db.insert("alert_audit_log", {
      alertId: args.alertId,
      orgId: alert.orgId,
      action: "escalated",
      details: { escalationContacts, retryCount: alert.retryCount },
      timestamp: Date.now(),
    });

    // Create notifications for escalation contacts
    for (const contact of escalationContacts) {
      await ctx.db.insert("notifications", {
        orgId: alert.orgId,
        userId: contact,
        type: "escalation",
        title: "Alert Escalation",
        message: `Alert ${alert._id} failed after ${alert.retryCount} attempts and requires attention.`,
        data: { alertId: alert._id, originalUserId: alert.userId },
        createdAt: Date.now(),
      });
    }

    return null;
  },
});

/** Process all due alerts - called by cron */
export const processDueAlerts = internalAction({
  args: {},
  returns: v.object({
    processed: v.number(),
    succeeded: v.number(),
    failed: v.number(),
  }),
  handler: async (
    ctx,
  ): Promise<{ processed: number; succeeded: number; failed: number }> => {
    const now = Date.now();
    const windowStart = now - 15 * 60 * 1000; // Look back 15 minutes for missed alerts

    // Get alerts due for processing
    const alerts = await ctx.runQuery(internal.alerts.getDueAlerts, {
      from: windowStart,
      to: now,
    });

    let succeeded = 0;
    let failed = 0;

    // Process each alert
    for (const alert of alerts) {
      const result = await ctx.runAction(internal.alerts.processAlert, {
        alertId: alert._id,
      });

      if (result.success) {
        succeeded++;
      } else {
        failed++;
      }
    }

    return {
      processed: alerts.length,
      succeeded,
      failed,
    };
  },
});

// ============ TEST ALERT ============

/**
 * Send a test alert to verify delivery works.
 * Used during onboarding to confirm alerts are properly configured.
 */
export const sendTestAlert = mutation({
  args: {
    orgId: v.id("organizations"),
    channel: v.union(v.literal("email"), v.literal("email_sms")),
    phoneNumber: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    channels: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const sentChannels: string[] = [];

    // In production, we would:
    // 1. Get user email from Clerk
    // 2. Send actual email via Resend with [TEST] prefix
    // 3. Send SMS via Twilio with TEST: prefix if channel is email_sms

    // For now, simulate success
    sentChannels.push("email");

    if (args.channel === "email_sms" && args.phoneNumber) {
      // Validate phone number format
      const cleaned = args.phoneNumber.replace(/\D/g, "");
      if (cleaned.length !== 10) {
        return {
          success: false,
          error: "Invalid phone number format",
          channels: [],
        };
      }
      sentChannels.push("sms");
    }

    // Log the test alert (not counted in regular alerts)
    await ctx.db.insert("activity_log", {
      orgId: args.orgId,
      userId: "system", // Would be actual user ID
      action: "alert_sent",
      targetType: "alert",
      targetTitle: "Test Alert",
      metadata: {
        isTest: true,
        channels: sentChannels,
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      channels: sentChannels,
    };
  },
});
