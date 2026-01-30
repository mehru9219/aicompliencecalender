/**
 * Audit logging system for compliance tracking.
 * IMMUTABLE: Only insert operations allowed - no update or delete.
 */

import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";
import {
  requirePermission,
  getCurrentUser,
  PERMISSIONS,
} from "./lib/permissions";

// Action types for audit logging
export type AuditAction =
  | "deadline_created"
  | "deadline_completed"
  | "deadline_updated"
  | "deadline_deleted"
  | "document_uploaded"
  | "document_deleted"
  | "alert_sent"
  | "alert_acknowledged"
  | "template_imported"
  | "settings_updated"
  | "user_invited"
  | "user_joined"
  | "user_removed"
  | "role_changed"
  | "invitation_revoked"
  | "ownership_transferred";

export type TargetType =
  | "deadline"
  | "document"
  | "alert"
  | "template"
  | "organization"
  | "user"
  | "invitation";

interface LogActivityParams {
  orgId: Id<"organizations">;
  action: AuditAction;
  targetType: TargetType;
  targetId?: string;
  targetTitle?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Internal mutation to log activity. Should only be called from other mutations.
 * This is the ONLY way to insert into activity_log - ensuring immutability.
 */
export const logActivityInternal = internalMutation({
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
      v.literal("user_invited"),
      v.literal("user_joined"),
      v.literal("user_removed"),
      v.literal("role_changed"),
      v.literal("invitation_revoked"),
      v.literal("ownership_transferred"),
    ),
    targetType: v.union(
      v.literal("deadline"),
      v.literal("document"),
      v.literal("alert"),
      v.literal("template"),
      v.literal("organization"),
      v.literal("user"),
      v.literal("invitation"),
    ),
    targetId: v.optional(v.string()),
    targetTitle: v.optional(v.string()),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
  },
  returns: v.id("activity_log"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("activity_log", {
      orgId: args.orgId,
      userId: args.userId,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      targetTitle: args.targetTitle,
      metadata: args.metadata,
      timestamp: Date.now(),
      ipAddress: args.ipAddress,
    });
  },
});

/**
 * Helper function to log activity from within a mutation context.
 * Automatically captures current user ID.
 */
export async function logActivity(
  ctx: MutationCtx,
  params: LogActivityParams,
): Promise<Id<"activity_log">> {
  const user = await getCurrentUser(ctx);

  return await ctx.db.insert("activity_log", {
    orgId: params.orgId,
    userId: user.id,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    targetTitle: params.targetTitle,
    metadata: params.metadata,
    timestamp: Date.now(),
    ipAddress: params.ipAddress,
  });
}

/**
 * Helper to log activity with a custom user ID (for system actions).
 */
export async function logActivityAs(
  ctx: MutationCtx,
  userId: string,
  params: Omit<LogActivityParams, "userId">,
): Promise<Id<"activity_log">> {
  return await ctx.db.insert("activity_log", {
    orgId: params.orgId,
    userId,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    targetTitle: params.targetTitle,
    metadata: params.metadata,
    timestamp: Date.now(),
    ipAddress: params.ipAddress,
  });
}

/**
 * Query audit logs for an organization.
 * Requires audit:read permission.
 */
export const getAuditLog = query({
  args: {
    orgId: v.id("organizations"),
    filters: v.optional(
      v.object({
        userId: v.optional(v.string()),
        action: v.optional(v.string()),
        targetType: v.optional(v.string()),
        dateRange: v.optional(
          v.object({
            from: v.number(),
            to: v.number(),
          }),
        ),
      }),
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    logs: v.array(
      v.object({
        _id: v.id("activity_log"),
        orgId: v.id("organizations"),
        userId: v.string(),
        action: v.string(),
        targetType: v.string(),
        targetId: v.union(v.string(), v.null()),
        targetTitle: v.union(v.string(), v.null()),
        metadata: v.any(),
        timestamp: v.number(),
        ipAddress: v.union(v.string(), v.null()),
      }),
    ),
    nextCursor: v.union(v.string(), v.null()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.orgId, PERMISSIONS.AUDIT_READ);

    const { filters, limit = 50 } = args;
    const pageLimit = Math.min(limit, 100); // Cap at 100

    // Build query with index
    const logsQuery = ctx.db
      .query("activity_log")
      .withIndex("by_org_timestamp", (q) => q.eq("orgId", args.orgId))
      .order("desc");

    // Collect all logs and filter
    let logs = await logsQuery.collect();

    // Apply filters
    if (filters?.userId) {
      logs = logs.filter((l) => l.userId === filters.userId);
    }
    if (filters?.action) {
      logs = logs.filter((l) => l.action === filters.action);
    }
    if (filters?.targetType) {
      logs = logs.filter((l) => l.targetType === filters.targetType);
    }
    if (filters?.dateRange) {
      logs = logs.filter(
        (l) =>
          l.timestamp >= filters.dateRange!.from &&
          l.timestamp <= filters.dateRange!.to,
      );
    }

    // Handle pagination via cursor (timestamp-based)
    let startIndex = 0;
    if (args.cursor) {
      const cursorTimestamp = parseInt(args.cursor, 10);
      startIndex = logs.findIndex((l) => l.timestamp < cursorTimestamp);
      if (startIndex === -1) startIndex = logs.length;
    }

    const paginatedLogs = logs.slice(startIndex, startIndex + pageLimit);
    const hasMore = startIndex + pageLimit < logs.length;
    const nextCursor = hasMore
      ? paginatedLogs[paginatedLogs.length - 1]?.timestamp.toString()
      : null;

    return {
      logs: paginatedLogs.map((l) => ({
        _id: l._id,
        orgId: l.orgId,
        userId: l.userId,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId ?? null,
        targetTitle: l.targetTitle ?? null,
        metadata: l.metadata ?? null,
        timestamp: l.timestamp,
        ipAddress: l.ipAddress ?? null,
      })),
      nextCursor,
      hasMore,
    };
  },
});

/**
 * Get audit log entries for a specific resource.
 */
export const getResourceAuditLog = query({
  args: {
    orgId: v.id("organizations"),
    targetType: v.string(),
    targetId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("activity_log"),
      userId: v.string(),
      action: v.string(),
      timestamp: v.number(),
      metadata: v.any(),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.orgId, PERMISSIONS.AUDIT_READ);

    const { limit = 20 } = args;

    const logs = await ctx.db
      .query("activity_log")
      .withIndex("by_org_timestamp", (q) => q.eq("orgId", args.orgId))
      .order("desc")
      .filter((q) =>
        q.and(
          q.eq(q.field("targetType"), args.targetType),
          q.eq(q.field("targetId"), args.targetId),
        ),
      )
      .take(limit);

    return logs.map((l) => ({
      _id: l._id,
      userId: l.userId,
      action: l.action,
      timestamp: l.timestamp,
      metadata: l.metadata ?? null,
    }));
  },
});

/**
 * Get available action types for filtering.
 */
export const getAuditActionTypes = query({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.orgId, PERMISSIONS.AUDIT_READ);

    const logs = await ctx.db
      .query("activity_log")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const actions = new Set<string>();
    for (const log of logs) {
      actions.add(log.action);
    }

    return Array.from(actions).sort();
  },
});

/**
 * Get unique users who have activity in the audit log.
 */
export const getAuditUsers = query({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.orgId, PERMISSIONS.AUDIT_READ);

    const logs = await ctx.db
      .query("activity_log")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const users = new Set<string>();
    for (const log of logs) {
      users.add(log.userId);
    }

    return Array.from(users);
  },
});

// NOTE: No update or delete mutations are exposed for activity_log.
// This ensures audit log immutability per compliance requirements.
