import type { Id } from "../convex/_generated/dataModel";

/** Deadline status calculated from due date and completion state */
export type DeadlineStatus = "upcoming" | "due_soon" | "overdue" | "completed";

/** Deadline category for compliance classification */
export type DeadlineCategory =
  | "license"
  | "certification"
  | "training"
  | "audit"
  | "filing"
  | "insurance"
  | "other";

/** Recurrence pattern type */
export type RecurrenceType =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "semi_annual"
  | "annual"
  | "custom";

/** Base date for calculating next occurrence */
export type RecurrenceBaseDate = "due_date" | "completion_date";

/** Recurrence pattern configuration */
export interface RecurrencePattern {
  type: RecurrenceType;
  /** Custom interval in days (only for type="custom") */
  interval?: number;
  /** End date for recurrence (timestamp) */
  endDate?: number;
  /** Whether next date is based on due_date or completion_date */
  baseDate?: RecurrenceBaseDate;
}

/** Deadline entity from database */
export interface Deadline {
  _id: Id<"deadlines">;
  _creationTime: number;
  orgId: Id<"organizations">;
  title: string;
  description?: string;
  dueDate: number;
  category: string;
  recurrence?: RecurrencePattern;
  assignedTo?: string;
  completedAt?: number;
  completedBy?: string;
  deletedAt?: number;
  createdAt: number;
  createdBy: string;
}

/** Deadline with computed status */
export interface DeadlineWithStatus extends Deadline {
  status: DeadlineStatus;
}

/** Input for creating a deadline */
export interface CreateDeadlineInput {
  title: string;
  description?: string;
  dueDate: number;
  category: DeadlineCategory;
  recurrence?: RecurrencePattern;
  assignedTo?: string;
}

/** Input for updating a deadline */
export interface UpdateDeadlineInput {
  title?: string;
  description?: string;
  dueDate?: number;
  category?: DeadlineCategory;
  recurrence?: RecurrencePattern | null;
  assignedTo?: string | null;
}

/** Audit log action types */
export type AuditAction =
  | "created"
  | "updated"
  | "completed"
  | "deleted"
  | "restored";

/** Audit log entry */
export interface DeadlineAuditLog {
  _id: Id<"deadline_audit_log">;
  deadlineId: Id<"deadlines">;
  orgId: Id<"organizations">;
  userId: string;
  action: AuditAction;
  changes?: Record<string, unknown>;
  timestamp: number;
}

/** Filter options for listing deadlines */
export interface DeadlineFilters {
  status?: DeadlineStatus[];
  category?: DeadlineCategory[];
  assignedTo?: string;
  fromDate?: number;
  toDate?: number;
  includeDeleted?: boolean;
}

/** Days threshold for "due soon" status (default 14) */
export const DUE_SOON_DAYS = 14;

/** Categories with display labels */
export const DEADLINE_CATEGORIES: Record<DeadlineCategory, string> = {
  license: "License",
  certification: "Certification",
  training: "Training",
  audit: "Audit",
  filing: "Filing",
  insurance: "Insurance",
  other: "Other",
};

/** Recurrence types with display labels */
export const RECURRENCE_TYPES: Record<RecurrenceType, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual",
  annual: "Annual",
  custom: "Custom",
};
