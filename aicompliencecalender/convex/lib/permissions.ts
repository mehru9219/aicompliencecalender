/**
 * Convex permission middleware for RBAC enforcement.
 * Provides utilities for permission checking within Convex functions.
 */

import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// Permission and role types (mirrored from lib/permissions.ts for Convex runtime)
export const PERMISSIONS = {
  DEADLINES_CREATE: "deadlines:create",
  DEADLINES_READ: "deadlines:read",
  DEADLINES_UPDATE: "deadlines:update",
  DEADLINES_DELETE: "deadlines:delete",
  DEADLINES_COMPLETE: "deadlines:complete",
  DEADLINES_COMPLETE_OWN: "deadlines:complete:own",
  DEADLINES_ASSIGN: "deadlines:assign",
  DOCUMENTS_CREATE: "documents:create",
  DOCUMENTS_READ: "documents:read",
  DOCUMENTS_UPDATE: "documents:update",
  DOCUMENTS_DELETE: "documents:delete",
  USERS_READ: "users:read",
  USERS_INVITE: "users:invite",
  USERS_REMOVE: "users:remove",
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",
  AUDIT_READ: "audit:read",
  BILLING_READ: "billing:read",
  BILLING_WRITE: "billing:write",
  ALERTS_READ: "alerts:read",
  ALERTS_READ_OWN: "alerts:read:own",
  ALERTS_MANAGE: "alerts:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLES = ["owner", "admin", "manager", "member", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  owner: ["*"],
  admin: [
    "deadlines:*",
    "documents:*",
    "alerts:*",
    "users:read",
    "users:invite",
    "users:remove",
    "settings:read",
    "settings:write",
    "audit:read",
  ],
  manager: [
    "deadlines:create",
    "deadlines:read",
    "deadlines:update",
    "deadlines:complete",
    "deadlines:assign",
    "documents:create",
    "documents:read",
    "documents:update",
    "alerts:read",
    "alerts:manage",
    "users:read",
  ],
  member: [
    "deadlines:read",
    "deadlines:complete:own",
    "documents:create",
    "documents:read",
    "alerts:read:own",
  ],
  viewer: ["deadlines:read", "documents:read"],
};

export interface PermissionContext {
  userId?: string;
  resourceOwnerId?: string;
}

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(
  userRole: Role | string,
  permission: Permission | string,
  context?: PermissionContext,
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole as Role];

  if (!rolePermissions) {
    return false;
  }

  if (rolePermissions.includes("*")) {
    return true;
  }

  const [category] = permission.split(":");
  if (rolePermissions.includes(`${category}:*`)) {
    return true;
  }

  if (rolePermissions.includes(permission)) {
    return true;
  }

  if (permission.endsWith(":own")) {
    if (context?.resourceOwnerId && context?.userId) {
      if (context.resourceOwnerId === context.userId) {
        const basePermission = permission.replace(":own", "");
        if (rolePermissions.includes(basePermission)) {
          return true;
        }
      }
    }
    return rolePermissions.includes(permission);
  }

  return false;
}

/**
 * User info returned from authentication.
 */
export interface CurrentUser {
  id: string;
  email?: string;
  name?: string;
}

/**
 * Organization membership info.
 */
export interface OrgMembership {
  orgId: Id<"organizations">;
  userId: string;
  role: Role;
  joinedAt?: number;
}

/**
 * Get the current authenticated user from context.
 * Throws if not authenticated.
 */
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<CurrentUser> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("Not authenticated");
  }

  return {
    id: identity.subject,
    email: identity.email,
    name: identity.name,
  };
}

/**
 * Try to get current user without throwing.
 */
export async function tryGetCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<CurrentUser | null> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return null;
  }

  return {
    id: identity.subject,
    email: identity.email,
    name: identity.name,
  };
}

/**
 * Get user's membership in an organization.
 * First checks user_organizations junction table, then falls back to org owner.
 */
export async function getOrgMembership(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  orgId: Id<"organizations">,
): Promise<OrgMembership | null> {
  // Check user_organizations junction table if it exists
  const membership = await ctx.db
    .query("user_organizations")
    .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("orgId", orgId))
    .first();

  if (membership) {
    return {
      orgId,
      userId,
      role: membership.role as Role,
      joinedAt: membership.joinedAt,
    };
  }

  // Fall back to checking if user is org owner
  const org = await ctx.db.get(orgId);
  if (org && org.ownerId === userId) {
    return {
      orgId,
      userId,
      role: "owner",
      joinedAt: org.createdAt,
    };
  }

  return null;
}

/**
 * Require user to have a specific permission in an organization.
 * Throws ConvexError if permission denied.
 */
export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<"organizations">,
  permission: Permission | string,
  context?: PermissionContext,
): Promise<OrgMembership> {
  const user = await getCurrentUser(ctx);
  const membership = await getOrgMembership(ctx, user.id, orgId);

  if (!membership) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Not a member of this organization",
    });
  }

  const permContext: PermissionContext = {
    userId: user.id,
    resourceOwnerId: context?.resourceOwnerId,
  };

  if (!hasPermission(membership.role, permission, permContext)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: `Permission denied: ${permission}`,
    });
  }

  return membership;
}

/**
 * Check if user has permission without throwing.
 */
export async function checkPermission(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<"organizations">,
  permission: Permission | string,
  context?: PermissionContext,
): Promise<boolean> {
  try {
    await requirePermission(ctx, orgId, permission, context);
    return true;
  } catch {
    return false;
  }
}

/**
 * Require user to be authenticated and member of the organization.
 * Returns user and membership info.
 */
export async function requireOrgMembership(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<"organizations">,
): Promise<{ user: CurrentUser; membership: OrgMembership }> {
  const user = await getCurrentUser(ctx);
  const membership = await getOrgMembership(ctx, user.id, orgId);

  if (!membership) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Not a member of this organization",
    });
  }

  return { user, membership };
}

/**
 * Verify organization exists and return it.
 */
export async function requireOrg(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<"organizations">,
) {
  const org = await ctx.db.get(orgId);

  if (!org) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Organization not found",
    });
  }

  return org;
}

/**
 * Check if a role can manage another role.
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  const roleOrder = ROLES;
  const managerIndex = roleOrder.indexOf(managerRole);
  const targetIndex = roleOrder.indexOf(targetRole);

  if (managerRole === "owner") {
    return targetRole !== "owner";
  }

  return managerIndex < targetIndex;
}

/**
 * Validate a role string.
 */
export function isValidRole(role: string): role is Role {
  return ROLES.includes(role as Role);
}
