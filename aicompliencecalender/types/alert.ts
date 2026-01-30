import type { Id } from "../convex/_generated/dataModel";

/** Alert channel for delivery */
export type AlertChannel = "email" | "sms" | "push" | "in_app";

/** Alert urgency based on days until deadline */
export type AlertUrgency = "early" | "medium" | "high" | "critical";

/** Alert delivery status */
export type AlertStatus =
  | "scheduled"
  | "sent"
  | "delivered"
  | "failed"
  | "acknowledged";

/** How the alert was acknowledged */
export type AcknowledgmentMethod = "email_link" | "sms_reply" | "in_app_button";

/** Alert audit log action types */
export type AlertAuditAction =
  | "scheduled"
  | "sent"
  | "delivered"
  | "failed"
  | "acknowledged"
  | "snoozed"
  | "cancelled"
  | "escalated";

/** Alert entity from database */
export interface Alert {
  _id: Id<"alerts">;
  _creationTime: number;
  deadlineId: Id<"deadlines">;
  orgId: Id<"organizations">;
  userId?: string;
  scheduledFor: number;
  channel: AlertChannel;
  urgency: AlertUrgency;
  status: AlertStatus;
  sentAt?: number;
  deliveredAt?: number;
  acknowledgedAt?: number;
  acknowledgedVia?: AcknowledgmentMethod;
  errorMessage?: string;
  retryCount: number;
  snoozedUntil?: number;
}

/** Alert preferences for a user or organization */
export interface AlertPreferences {
  _id: Id<"alert_preferences">;
  _creationTime: number;
  orgId: Id<"organizations">;
  userId?: string;
  earlyChannels: string[];
  mediumChannels: string[];
  highChannels: string[];
  criticalChannels: string[];
  alertDays: number[];
  escalationEnabled: boolean;
  escalationContacts: string[];
  phoneNumber?: string;
  emailOverride?: string;
  createdAt: number;
  updatedAt?: number;
}

/** In-app notification */
export interface Notification {
  _id: Id<"notifications">;
  _creationTime: number;
  orgId: Id<"organizations">;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: number;
  readAt?: number;
}

/** Alert audit log entry */
export interface AlertAuditLog {
  _id: Id<"alert_audit_log">;
  _creationTime: number;
  alertId: Id<"alerts">;
  orgId: Id<"organizations">;
  action: AlertAuditAction;
  details?: Record<string, unknown>;
  timestamp: number;
}

/** Default alert preferences */
export const DEFAULT_ALERT_PREFERENCES: Omit<
  AlertPreferences,
  "_id" | "_creationTime" | "orgId" | "createdAt"
> = {
  earlyChannels: ["email"],
  mediumChannels: ["email", "in_app"],
  highChannels: ["email", "sms", "in_app"],
  criticalChannels: ["email", "sms", "in_app"],
  alertDays: [30, 14, 7, 3, 1, 0],
  escalationEnabled: true,
  escalationContacts: [],
};

/** Urgency thresholds in days */
export const URGENCY_THRESHOLDS = {
  early: 14,
  medium: 7,
  high: 1,
  critical: 0,
} as const;

/** Alert channel display labels */
export const ALERT_CHANNELS: Record<AlertChannel, string> = {
  email: "Email",
  sms: "SMS",
  push: "Push Notification",
  in_app: "In-App",
};

/** Alert urgency display labels */
export const ALERT_URGENCIES: Record<AlertUrgency, string> = {
  early: "Early (14+ days)",
  medium: "Medium (7-14 days)",
  high: "High (1-7 days)",
  critical: "Critical (Due/Overdue)",
};

/** Alert status display labels */
export const ALERT_STATUSES: Record<AlertStatus, string> = {
  scheduled: "Scheduled",
  sent: "Sent",
  delivered: "Delivered",
  failed: "Failed",
  acknowledged: "Acknowledged",
};

/** Snooze duration options in milliseconds */
export const SNOOZE_OPTIONS = [
  { label: "1 hour", value: 60 * 60 * 1000 },
  { label: "4 hours", value: 4 * 60 * 60 * 1000 },
  { label: "1 day", value: 24 * 60 * 60 * 1000 },
  { label: "1 week", value: 7 * 24 * 60 * 60 * 1000 },
] as const;

/** Input for creating an alert */
export interface CreateAlertInput {
  deadlineId: Id<"deadlines">;
  orgId: Id<"organizations">;
  userId?: string;
  scheduledFor: number;
  channel: AlertChannel;
  urgency: AlertUrgency;
}

/** Input for scheduling alerts for a deadline */
export interface ScheduleAlertsInput {
  deadlineId: Id<"deadlines">;
  dueDate: number;
  orgId: Id<"organizations">;
  assignedTo?: string;
}
