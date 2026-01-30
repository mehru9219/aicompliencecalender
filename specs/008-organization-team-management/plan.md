# Implementation Plan: Organization & Team Management

**Branch**: `008-organization-team-management` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-organization-team-management/spec.md`

## Summary

Build a complete team management system with role-based access control (RBAC), invitation workflows, audit logging, and organization settings using Clerk for authentication and Convex for data persistence.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x
**Primary Dependencies**: Clerk (organizations, invitations, roles), Convex
**Storage**: Convex (activity logs, org settings), Clerk (membership data)
**Testing**: Vitest (unit), permission matrix tests
**Target Platform**: Web
**Project Type**: Web application
**Performance Goals**: Team list < 500ms, invitation < 2s
**Constraints**: Clerk organization limits, role hierarchy enforcement
**Scale/Scope**: Up to 50 members per org (Business plan)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with The Three Laws:
- [x] **Data Integrity**: Audit log immutable, no delete mutations
- [x] **Alert Reliability**: N/A for this feature
- [x] **Clarity**: Role permissions clearly documented, visible in UI

Additional checks:
- [x] **Security**: Permission checks on all mutations, org isolation
- [x] **Code Quality**: TypeScript strict, permission types enforced
- [x] **Testing**: 100% coverage for permission checking logic
- [x] **Performance**: Indexed queries for audit log, paginated results
- [x] **External Services**: Clerk SDK with error handling

## Project Structure

### Source Code (repository root)

```text
src/
├── app/
│   └── (dashboard)/
│       └── settings/
│           ├── team/
│           │   └── page.tsx          # Team management
│           ├── roles/
│           │   └── page.tsx          # Role configuration
│           └── audit/
│               └── page.tsx          # Audit log viewer
├── components/
│   └── features/
│       └── team/
│           ├── InviteModal.tsx
│           ├── RoleSelector.tsx
│           ├── MemberCard.tsx
│           ├── PendingInvitations.tsx
│           ├── RemoveMemberDialog.tsx
│           └── WorkloadChart.tsx
├── convex/
│   ├── team.ts                       # Team queries/mutations
│   ├── audit.ts                      # Audit log functions
│   └── schema.ts
└── lib/
    └── permissions.ts                # RBAC logic
```

## Role Definitions

```typescript
// lib/permissions.ts
const roles = {
  owner: {
    permissions: ['*'],
  },
  admin: {
    permissions: [
      'deadlines:*',
      'documents:*',
      'alerts:*',
      'users:read',
      'users:invite',
      'users:remove',
      'settings:read',
      'settings:write',
      'audit:read',
    ],
  },
  manager: {
    permissions: [
      'deadlines:create',
      'deadlines:read',
      'deadlines:update',
      'deadlines:complete',
      'deadlines:assign',
      'documents:create',
      'documents:read',
      'documents:update',
      'alerts:read',
      'users:read',
    ],
  },
  member: {
    permissions: [
      'deadlines:read',
      'deadlines:complete:own',
      'documents:create',
      'documents:read',
      'alerts:read:own',
    ],
  },
  viewer: {
    permissions: [
      'deadlines:read',
      'documents:read',
    ],
  },
};
```

## Permission Checking

```typescript
// lib/permissions.ts
type Permission =
  | 'deadlines:create' | 'deadlines:read' | 'deadlines:update'
  | 'deadlines:delete' | 'deadlines:complete' | 'deadlines:complete:own'
  | 'documents:create' | 'documents:read' | 'documents:update' | 'documents:delete'
  | 'users:read' | 'users:invite' | 'users:remove'
  | 'settings:read' | 'settings:write'
  | 'audit:read'
  | 'billing:read' | 'billing:write';

export function hasPermission(
  userRole: string,
  permission: Permission,
  context?: { resourceOwnerId?: string; userId?: string }
): boolean {
  const rolePermissions = roles[userRole]?.permissions || [];

  // Check for wildcard
  if (rolePermissions.includes('*')) return true;

  // Check for category wildcard
  const [category] = permission.split(':');
  if (rolePermissions.includes(`${category}:*`)) return true;

  // Check for exact permission
  if (rolePermissions.includes(permission)) return true;

  // Check for :own variant
  if (permission.endsWith(':own') && context?.resourceOwnerId === context?.userId) {
    const basePermission = permission.replace(':own', '');
    if (rolePermissions.includes(basePermission)) return true;
  }

  return false;
}

// Convex middleware
export function withPermission(permission: Permission) {
  return async (ctx: QueryCtx | MutationCtx, args: any) => {
    const user = await getCurrentUser(ctx);
    const orgMembership = await getOrgMembership(ctx, user.id, args.orgId);

    if (!hasPermission(orgMembership.role, permission, {
      userId: user.id,
      resourceOwnerId: args.resourceOwnerId,
    })) {
      throw new ConvexError('Permission denied');
    }
  };
}
```

## Invitation Flow

```typescript
// convex/invitations.ts
export const invite = mutation({
  args: {
    orgId: v.id("organizations"),
    email: v.string(),
    role: v.string(),
  },
  handler: async (ctx, { orgId, email, role }) => {
    await withPermission('users:invite')(ctx, { orgId });

    const invitation = await clerkClient.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: email,
      role,
      redirectUrl: `${process.env.NEXT_PUBLIC_URL}/accept-invite`,
    });

    await logActivity(ctx, {
      orgId,
      action: 'user_invited',
      data: { email, role },
    });

    return invitation;
  },
});
```

## Audit Logging

```typescript
// convex/schema.ts (additions)
activity_log: defineTable({
  orgId: v.id("organizations"),
  userId: v.string(),
  action: v.string(),
  resourceType: v.string(),
  resourceId: v.optional(v.string()),
  data: v.optional(v.any()),
  timestamp: v.number(),
  ipAddress: v.optional(v.string()),
})
  .index("by_org_time", ["orgId", "timestamp"])
  .index("by_user", ["userId", "timestamp"]),

// convex/audit.ts
export async function logActivity(
  ctx: MutationCtx,
  params: {
    orgId: Id<"organizations">;
    action: string;
    resourceType?: string;
    resourceId?: string;
    data?: any;
  }
) {
  const user = await getCurrentUser(ctx);

  await ctx.db.insert("activity_log", {
    orgId: params.orgId,
    userId: user.id,
    action: params.action,
    resourceType: params.resourceType || 'system',
    resourceId: params.resourceId,
    data: params.data,
    timestamp: Date.now(),
    ipAddress: null,
  });
}

// Immutable - no update or delete mutations for activity_log

export const getAuditLog = query({
  args: {
    orgId: v.id("organizations"),
    filters: v.optional(v.object({
      userId: v.optional(v.string()),
      action: v.optional(v.string()),
      resourceType: v.optional(v.string()),
      dateRange: v.optional(v.object({
        from: v.number(),
        to: v.number(),
      })),
    })),
    pagination: v.object({
      limit: v.number(),
      cursor: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await withPermission('audit:read')(ctx, { orgId: args.orgId });

    let query = ctx.db
      .query("activity_log")
      .withIndex("by_org_time", (q) => q.eq("orgId", args.orgId))
      .order("desc");

    return await query.paginate(args.pagination);
  },
});
```

## Team Management UI

```typescript
// app/(dashboard)/settings/team/page.tsx
export default function TeamSettingsPage() {
  const { organization, membership } = useOrganization();
  const members = useQuery(api.team.listMembers, { orgId: organization.id });

  const canInvite = hasPermission(membership.role, 'users:invite');
  const canRemove = hasPermission(membership.role, 'users:remove');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1>Team Members</h1>
        {canInvite && <InviteButton />}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Active Deadlines</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map(member => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar src={member.imageUrl} />
                  <div>
                    <p className="font-medium">{member.fullName}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <RoleSelector
                  value={member.role}
                  onChange={(role) => updateRole(member.id, role)}
                  disabled={!canRemove || member.role === 'owner'}
                />
              </TableCell>
              <TableCell>{member.deadlineCount}</TableCell>
              <TableCell>{format(member.joinedAt, 'MMM d, yyyy')}</TableCell>
              <TableCell>
                {canRemove && member.role !== 'owner' && (
                  <RemoveMemberButton memberId={member.id} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <PendingInvitations orgId={organization.id} />
    </div>
  );
}
```

## SSO Configuration

```typescript
// Clerk handles SSO configuration in their dashboard
// We just need to detect and respect SSO-only orgs

export const getAuthConfig = query({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    const org = await ctx.db.get(orgId);

    return {
      ssoEnabled: org.settings.ssoEnabled,
      ssoProvider: org.settings.ssoProvider,
      ssoOnly: org.settings.ssoOnly,
    };
  },
});
```

## Complexity Tracking

No constitution violations - implements immutable audit logging and proper permission enforcement.
