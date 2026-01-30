/**
 * Role-Based Access Control (RBAC) system for organization team management.
 * Implements permission checking with wildcards and ownership context.
 */

// All available permissions in the system
export const PERMISSIONS = {
  // Deadline permissions
  DEADLINES_CREATE: "deadlines:create",
  DEADLINES_READ: "deadlines:read",
  DEADLINES_UPDATE: "deadlines:update",
  DEADLINES_DELETE: "deadlines:delete",
  DEADLINES_COMPLETE: "deadlines:complete",
  DEADLINES_COMPLETE_OWN: "deadlines:complete:own",
  DEADLINES_ASSIGN: "deadlines:assign",

  // Document permissions
  DOCUMENTS_CREATE: "documents:create",
  DOCUMENTS_READ: "documents:read",
  DOCUMENTS_UPDATE: "documents:update",
  DOCUMENTS_DELETE: "documents:delete",

  // User/Team permissions
  USERS_READ: "users:read",
  USERS_INVITE: "users:invite",
  USERS_REMOVE: "users:remove",

  // Organization settings
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",

  // Audit log
  AUDIT_READ: "audit:read",

  // Billing
  BILLING_READ: "billing:read",
  BILLING_WRITE: "billing:write",

  // Alerts
  ALERTS_READ: "alerts:read",
  ALERTS_READ_OWN: "alerts:read:own",
  ALERTS_MANAGE: "alerts:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Available roles in hierarchy order (highest to lowest)
export const ROLES = ["owner", "admin", "manager", "member", "viewer"] as const;
export type Role = (typeof ROLES)[number];

// Role permission mappings
export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  owner: ["*"], // Full access to everything

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

// Role display names and descriptions
export const ROLE_INFO: Record<Role, { label: string; description: string }> = {
  owner: {
    label: "Owner",
    description:
      "Full access including billing, organization deletion, and ownership transfer",
  },
  admin: {
    label: "Administrator",
    description: "Manage team members, settings, and all deadlines/documents",
  },
  manager: {
    label: "Manager",
    description: "Create, edit, and assign deadlines; manage documents",
  },
  member: {
    label: "Member",
    description: "View and complete assigned deadlines; upload documents",
  },
  viewer: {
    label: "Viewer",
    description: "Read-only access to deadlines and documents",
  },
};

// Context for ownership-based permission checks
export interface PermissionContext {
  userId?: string;
  resourceOwnerId?: string;
}

/**
 * Check if a role has a specific permission.
 * Supports wildcards (*) and :own suffix for ownership checks.
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

  // Check for full wildcard (owner has all permissions)
  if (rolePermissions.includes("*")) {
    return true;
  }

  // Check for category wildcard (e.g., "deadlines:*")
  const [category] = permission.split(":");
  if (rolePermissions.includes(`${category}:*`)) {
    return true;
  }

  // Check for exact permission
  if (rolePermissions.includes(permission)) {
    return true;
  }

  // Check for :own variant - user can perform action on their own resources
  if (permission.endsWith(":own")) {
    if (context?.resourceOwnerId && context?.userId) {
      if (context.resourceOwnerId === context.userId) {
        // Check if they have the base permission
        const basePermission = permission.replace(":own", "");
        if (rolePermissions.includes(basePermission)) {
          return true;
        }
      }
    }
    // Also check if they have the :own permission directly
    return rolePermissions.includes(permission);
  }

  return false;
}

/**
 * Check if a role can manage another role (for role changes).
 * A role can only manage roles below it in hierarchy.
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  const managerIndex = ROLES.indexOf(managerRole);
  const targetIndex = ROLES.indexOf(targetRole);

  // Owner can manage anyone except other owners
  if (managerRole === "owner") {
    return targetRole !== "owner";
  }

  // Others can only manage roles below them
  return managerIndex < targetIndex;
}

/**
 * Get all permissions for a role (resolved, not wildcards).
 */
export function getResolvedPermissions(role: Role): string[] {
  const permissions = ROLE_PERMISSIONS[role];

  if (permissions.includes("*")) {
    return Object.values(PERMISSIONS);
  }

  const resolved: string[] = [];
  const allPermissions = Object.values(PERMISSIONS);

  for (const perm of permissions) {
    if (perm.endsWith(":*")) {
      // Category wildcard
      const category = perm.replace(":*", "");
      resolved.push(
        ...allPermissions.filter((p) => p.startsWith(`${category}:`)),
      );
    } else {
      resolved.push(perm);
    }
  }

  return [...new Set(resolved)];
}

/**
 * Get roles that can be assigned by a given role.
 */
export function getAssignableRoles(assignerRole: Role): Role[] {
  return ROLES.filter((role) => canManageRole(assignerRole, role));
}

/**
 * Check if a role is valid.
 */
export function isValidRole(role: string): role is Role {
  return ROLES.includes(role as Role);
}

/**
 * Get role hierarchy level (0 = highest).
 */
export function getRoleLevel(role: Role): number {
  return ROLES.indexOf(role);
}
