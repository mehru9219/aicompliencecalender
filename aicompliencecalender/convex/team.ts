/**
 * Team management mutations and queries.
 * Handles invitations, member listing, role changes, and member removal.
 */

import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  requirePermission,
  requireOrgMembership,
  getCurrentUser,
  getOrgMembership,
  canManageRole,
  PERMISSIONS,
  type Role,
} from "./lib/permissions";
import { logActivity } from "./audit";

// Invitation expiration: 7 days
const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

// Plan user limits
const PLAN_USER_LIMITS = {
  starter: 1,
  professional: 5,
  business: 15,
} as const;

type PlanId = keyof typeof PLAN_USER_LIMITS;

/** Helper to check user limit within mutation */
async function checkUserLimit(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
): Promise<{ allowed: boolean; limit: number; current: number }> {
  // Get subscription
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .first();

  const planId: PlanId = (subscription?.plan as PlanId) || "professional";
  const limit = PLAN_USER_LIMITS[planId];

  // Count current members
  const memberships = await ctx.db
    .query("user_organizations")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .collect();

  // Also count owner if not in memberships
  const org = await ctx.db.get(orgId);
  const ownerInMemberships = memberships.some((m) => m.userId === org?.ownerId);
  const current = memberships.length + (ownerInMemberships ? 0 : 1);

  return { allowed: current < limit, limit, current };
}

/**
 * List all members of an organization.
 */
export const listMembers = query({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      email: v.union(v.string(), v.null()),
      name: v.union(v.string(), v.null()),
      role: v.string(),
      joinedAt: v.number(),
      deadlineCount: v.number(),
      isCurrentUser: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.orgId, PERMISSIONS.USERS_READ);

    const currentUser = await getCurrentUser(ctx);

    // Get all members from user_organizations
    const memberships = await ctx.db
      .query("user_organizations")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // Also include org owner if not in memberships
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    const ownerInMemberships = memberships.some(
      (m) => m.userId === org.ownerId,
    );

    // Build member list
    const members: {
      userId: string;
      email: string | null;
      name: string | null;
      role: string;
      joinedAt: number;
      deadlineCount: number;
      isCurrentUser: boolean;
    }[] = [];

    // Add owner first if not in memberships
    if (!ownerInMemberships) {
      // Count deadlines assigned to owner
      const ownerDeadlines = await ctx.db
        .query("deadlines")
        .withIndex("by_org_assigned", (q) =>
          q.eq("orgId", args.orgId).eq("assignedTo", org.ownerId),
        )
        .filter((q) => q.eq(q.field("deletedAt"), undefined))
        .collect();

      members.push({
        userId: org.ownerId,
        email: null, // Would be fetched from Clerk in real app
        name: null,
        role: "owner",
        joinedAt: org.createdAt,
        deadlineCount: ownerDeadlines.length,
        isCurrentUser: org.ownerId === currentUser.id,
      });
    }

    // Add all members from user_organizations
    for (const membership of memberships) {
      const deadlines = await ctx.db
        .query("deadlines")
        .withIndex("by_org_assigned", (q) =>
          q.eq("orgId", args.orgId).eq("assignedTo", membership.userId),
        )
        .filter((q) => q.eq(q.field("deletedAt"), undefined))
        .collect();

      members.push({
        userId: membership.userId,
        email: null,
        name: null,
        role: membership.role,
        joinedAt: membership.joinedAt,
        deadlineCount: deadlines.length,
        isCurrentUser: membership.userId === currentUser.id,
      });
    }

    // Sort by role hierarchy, then by join date
    const roleOrder = ["owner", "admin", "manager", "member", "viewer"];
    members.sort((a, b) => {
      const roleCompare = roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
      if (roleCompare !== 0) return roleCompare;
      return a.joinedAt - b.joinedAt;
    });

    return members;
  },
});

/**
 * Get member count for an organization.
 */
export const getMemberCount = query({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("user_organizations")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    // +1 for owner if not in memberships
    const org = await ctx.db.get(args.orgId);
    if (!org) return 0;

    const ownerInMemberships = memberships.some(
      (m) => m.userId === org.ownerId,
    );
    return memberships.length + (ownerInMemberships ? 0 : 1);
  },
});

/**
 * Invite a new member to the organization.
 */
export const invite = mutation({
  args: {
    orgId: v.id("organizations"),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("member"),
      v.literal("viewer"),
    ),
  },
  returns: v.id("invitations"),
  handler: async (ctx, args) => {
    const { user, membership } = await requireOrgMembership(ctx, args.orgId);

    // Check user limit before inviting
    const userLimitCheck = await checkUserLimit(ctx, args.orgId);
    if (!userLimitCheck.allowed) {
      throw new ConvexError({
        code: "LIMIT_EXCEEDED",
        message: `You have reached your plan limit of ${userLimitCheck.limit} team members. Upgrade your plan to invite more members.`,
      });
    }

    // Check permission
    await requirePermission(ctx, args.orgId, PERMISSIONS.USERS_INVITE);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Invalid email format",
      });
    }

    // Check if role can be assigned by current user
    if (!canManageRole(membership.role, args.role)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: `Cannot invite user with role ${args.role}`,
      });
    }

    // Check for existing pending invitation
    const existingInvitation = await ctx.db
      .query("invitations")
      .withIndex("by_org_status", (q) =>
        q.eq("orgId", args.orgId).eq("status", "pending"),
      )
      .filter((q) => q.eq(q.field("email"), args.email.toLowerCase()))
      .first();

    if (existingInvitation) {
      throw new ConvexError({
        code: "DUPLICATE",
        message: "An invitation is already pending for this email",
      });
    }

    // Note: In production, you'd check Clerk for email-to-userId mapping
    // to verify user isn't already a member

    // Create invitation
    const invitationId = await ctx.db.insert("invitations", {
      orgId: args.orgId,
      email: args.email.toLowerCase(),
      role: args.role,
      invitedBy: user.id,
      expiresAt: Date.now() + INVITATION_EXPIRY_MS,
      status: "pending",
      createdAt: Date.now(),
    });

    // Log activity
    await logActivity(ctx, {
      orgId: args.orgId,
      action: "user_invited",
      targetType: "invitation",
      targetId: invitationId,
      targetTitle: args.email,
      metadata: { email: args.email, role: args.role },
    });

    return invitationId;
  },
});

/**
 * List pending invitations for an organization.
 */
export const listPendingInvitations = query({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.array(
    v.object({
      _id: v.id("invitations"),
      email: v.string(),
      role: v.string(),
      invitedBy: v.string(),
      createdAt: v.number(),
      expiresAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.orgId, PERMISSIONS.USERS_READ);

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_org_status", (q) =>
        q.eq("orgId", args.orgId).eq("status", "pending"),
      )
      .collect();

    // Filter out expired (mark them as expired)
    const now = Date.now();
    const pending = invitations.filter((inv) => inv.expiresAt > now);

    return pending.map((inv) => ({
      _id: inv._id,
      email: inv.email,
      role: inv.role,
      invitedBy: inv.invitedBy,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
    }));
  },
});

/**
 * Revoke a pending invitation.
 */
export const revokeInvitation = mutation({
  args: {
    orgId: v.id("organizations"),
    invitationId: v.id("invitations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.orgId, PERMISSIONS.USERS_INVITE);

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation || invitation.orgId !== args.orgId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Invitation not found",
      });
    }

    if (invitation.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Invitation is not pending",
      });
    }

    await ctx.db.patch(args.invitationId, {
      status: "revoked",
    });

    await logActivity(ctx, {
      orgId: args.orgId,
      action: "invitation_revoked",
      targetType: "invitation",
      targetId: args.invitationId,
      targetTitle: invitation.email,
      metadata: { email: invitation.email },
    });

    return null;
  },
});

/**
 * Accept an invitation and join the organization.
 */
export const acceptInvitation = mutation({
  args: {
    invitationId: v.id("invitations"),
  },
  returns: v.id("user_organizations"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const invitation = await ctx.db.get(args.invitationId);

    if (!invitation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Invitation not found",
      });
    }

    if (invitation.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Invitation is no longer valid",
      });
    }

    if (invitation.expiresAt < Date.now()) {
      await ctx.db.patch(args.invitationId, { status: "expired" });
      throw new ConvexError({
        code: "EXPIRED",
        message: "Invitation has expired",
      });
    }

    // Check user limit before accepting
    const userLimitCheck = await checkUserLimit(ctx, invitation.orgId);
    if (!userLimitCheck.allowed) {
      throw new ConvexError({
        code: "LIMIT_EXCEEDED",
        message: `The organization has reached its plan limit of ${userLimitCheck.limit} team members. Contact the organization admin to upgrade their plan.`,
      });
    }

    // Note: In production, verify user.email matches invitation.email via Clerk

    // Check if already a member
    const existingMembership = await getOrgMembership(
      ctx,
      user.id,
      invitation.orgId,
    );
    if (existingMembership) {
      throw new ConvexError({
        code: "DUPLICATE",
        message: "Already a member of this organization",
      });
    }

    // Create membership
    const membershipId = await ctx.db.insert("user_organizations", {
      userId: user.id,
      orgId: invitation.orgId,
      role: invitation.role,
      joinedAt: Date.now(),
      invitedBy: invitation.invitedBy,
    });

    // Update invitation status
    await ctx.db.patch(args.invitationId, {
      status: "accepted",
      acceptedAt: Date.now(),
      acceptedBy: user.id,
    });

    // Log activity
    await logActivity(ctx, {
      orgId: invitation.orgId,
      action: "user_joined",
      targetType: "user",
      targetId: user.id,
      targetTitle: user.email || user.id,
      metadata: { role: invitation.role, invitedBy: invitation.invitedBy },
    });

    return membershipId;
  },
});

/**
 * Update a member's role.
 */
export const updateRole = mutation({
  args: {
    orgId: v.id("organizations"),
    memberId: v.string(),
    newRole: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("member"),
      v.literal("viewer"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user, membership: currentMembership } = await requireOrgMembership(
      ctx,
      args.orgId,
    );

    // Check permission
    await requirePermission(ctx, args.orgId, PERMISSIONS.USERS_REMOVE);

    // Get target membership
    const targetMembership = await ctx.db
      .query("user_organizations")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", args.memberId).eq("orgId", args.orgId),
      )
      .first();

    // Check if target is org owner (special case)
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    if (args.memberId === org.ownerId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cannot change owner's role. Transfer ownership instead.",
      });
    }

    if (!targetMembership) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Member not found" });
    }

    // Cannot change own role unless owner
    if (args.memberId === user.id && currentMembership.role !== "owner") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cannot change your own role",
      });
    }

    // Check if current user can manage target's current and new role
    if (
      !canManageRole(currentMembership.role, targetMembership.role as Role) ||
      !canManageRole(currentMembership.role, args.newRole)
    ) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Insufficient permissions to change this role",
      });
    }

    const oldRole = targetMembership.role;

    // Update role
    await ctx.db.patch(targetMembership._id, {
      role: args.newRole,
    });

    // Log activity
    await logActivity(ctx, {
      orgId: args.orgId,
      action: "role_changed",
      targetType: "user",
      targetId: args.memberId,
      metadata: { oldRole, newRole: args.newRole },
    });

    return null;
  },
});

/**
 * Remove a member from the organization.
 */
export const removeMember = mutation({
  args: {
    orgId: v.id("organizations"),
    memberId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user, membership: currentMembership } = await requireOrgMembership(
      ctx,
      args.orgId,
    );

    // Check permission
    await requirePermission(ctx, args.orgId, PERMISSIONS.USERS_REMOVE);

    // Get org to check owner
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    // Cannot remove owner
    if (args.memberId === org.ownerId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cannot remove organization owner. Transfer ownership first.",
      });
    }

    // Cannot remove self
    if (args.memberId === user.id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cannot remove yourself. Use 'Leave Organization' instead.",
      });
    }

    // Get target membership
    const targetMembership = await ctx.db
      .query("user_organizations")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", args.memberId).eq("orgId", args.orgId),
      )
      .first();

    if (!targetMembership) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Member not found" });
    }

    // Check if current user can manage target's role
    if (!canManageRole(currentMembership.role, targetMembership.role as Role)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Insufficient permissions to remove this member",
      });
    }

    // Unassign member's deadlines
    const assignedDeadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org_assigned", (q) =>
        q.eq("orgId", args.orgId).eq("assignedTo", args.memberId),
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    for (const deadline of assignedDeadlines) {
      await ctx.db.patch(deadline._id, {
        assignedTo: undefined,
      });
    }

    // Delete membership
    await ctx.db.delete(targetMembership._id);

    // Log activity
    await logActivity(ctx, {
      orgId: args.orgId,
      action: "user_removed",
      targetType: "user",
      targetId: args.memberId,
      metadata: {
        role: targetMembership.role,
        unassignedDeadlines: assignedDeadlines.length,
      },
    });

    return null;
  },
});

/**
 * Leave an organization (for non-owners).
 */
export const leaveOrganization = mutation({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Get org to check owner
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    // Owner cannot leave
    if (user.id === org.ownerId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Owner cannot leave. Transfer ownership first.",
      });
    }

    // Get membership
    const membership = await ctx.db
      .query("user_organizations")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", user.id).eq("orgId", args.orgId),
      )
      .first();

    if (!membership) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Not a member of this organization",
      });
    }

    // Unassign user's deadlines
    const assignedDeadlines = await ctx.db
      .query("deadlines")
      .withIndex("by_org_assigned", (q) =>
        q.eq("orgId", args.orgId).eq("assignedTo", user.id),
      )
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();

    for (const deadline of assignedDeadlines) {
      await ctx.db.patch(deadline._id, {
        assignedTo: undefined,
      });
    }

    // Delete membership
    await ctx.db.delete(membership._id);

    // Log activity
    await logActivity(ctx, {
      orgId: args.orgId,
      action: "user_removed",
      targetType: "user",
      targetId: user.id,
      metadata: {
        reason: "left",
        unassignedDeadlines: assignedDeadlines.length,
      },
    });

    return null;
  },
});

/**
 * Transfer organization ownership.
 */
export const transferOwnership = mutation({
  args: {
    orgId: v.id("organizations"),
    newOwnerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Get org
    const org = await ctx.db.get(args.orgId);
    if (!org) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    // Only current owner can transfer
    if (user.id !== org.ownerId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only the owner can transfer ownership",
      });
    }

    // Cannot transfer to self
    if (args.newOwnerId === user.id) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Cannot transfer ownership to yourself",
      });
    }

    // Verify new owner is a member
    const newOwnerMembership = await ctx.db
      .query("user_organizations")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", args.newOwnerId).eq("orgId", args.orgId),
      )
      .first();

    if (!newOwnerMembership) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "New owner must be a member of the organization",
      });
    }

    // Update organization owner
    await ctx.db.patch(args.orgId, {
      ownerId: args.newOwnerId,
    });

    // Update new owner's role to owner
    await ctx.db.patch(newOwnerMembership._id, {
      role: "owner",
    });

    // Add previous owner as admin if not already in user_organizations
    const previousOwnerMembership = await ctx.db
      .query("user_organizations")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", user.id).eq("orgId", args.orgId),
      )
      .first();

    if (previousOwnerMembership) {
      await ctx.db.patch(previousOwnerMembership._id, {
        role: "admin",
      });
    } else {
      await ctx.db.insert("user_organizations", {
        userId: user.id,
        orgId: args.orgId,
        role: "admin",
        joinedAt: Date.now(),
      });
    }

    // Log activity
    await logActivity(ctx, {
      orgId: args.orgId,
      action: "ownership_transferred",
      targetType: "organization",
      targetId: args.orgId,
      metadata: {
        previousOwner: user.id,
        newOwner: args.newOwnerId,
      },
    });

    return null;
  },
});

/**
 * Get current user's role in an organization.
 */
export const getCurrentUserRole = query({
  args: {
    orgId: v.id("organizations"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const membership = await getOrgMembership(
      ctx,
      identity.subject,
      args.orgId,
    );
    return membership?.role ?? null;
  },
});
