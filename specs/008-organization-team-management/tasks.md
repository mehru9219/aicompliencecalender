# Tasks: Organization & Team Management

**Feature**: 008-organization-team-management | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Overview

Build team management with role-based access control (RBAC), invitation workflows, audit logging, and organization settings. Security and audit compliance are critical for this feature (Constitution: Security & Privacy, Audit Trail).

---

## Phase 1: RBAC Foundation

### Task 1.1: Define Role and Permission Types
**Priority**: P0 (Critical) | **Estimate**: 2 hours | **Dependencies**: None

**Description**: Define TypeScript types for roles and permissions.

**Files to create/modify**:
- `src/types/permissions.ts`
- `src/lib/permissions.ts`

**Acceptance Criteria**:
- [X] `Permission` type with all permission strings:
  - deadlines: create, read, update, delete, complete, complete:own, assign
  - documents: create, read, update, delete
  - users: read, invite, remove
  - settings: read, write
  - audit: read
  - billing: read, write
- [X] `Role` type: owner, admin, manager, member, viewer
- [X] `RolePermissions` mapping object

**Constitution Checklist**:
- [X] Strict types (Code Quality)

---

### Task 1.2: Implement Permission Checking Logic
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 1.1

**Description**: Create permission checking utility functions.

**Files to create/modify**:
- `src/lib/permissions.ts`
- `tests/unit/permissions.test.ts`

**Acceptance Criteria**:
- [X] `hasPermission(userRole, permission, context?)` function
- [X] Supports wildcards: `'*'` for owner, `'deadlines:*'` for category
- [X] Supports `:own` suffix with context (resourceOwnerId === userId)
- [X] Returns boolean
- [X] 100% test coverage (permission matrix)

**Constitution Checklist**:
- [X] 100% coverage for permission logic (Testing Standards)

---

### Task 1.3: Create Convex Permission Middleware
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 1.2

**Description**: Create reusable middleware for Convex functions.

**Files to create/modify**:
- `convex/lib/permissions.ts`
- `convex/lib/auth.ts`

**Acceptance Criteria**:
- [X] `withPermission(permission)` middleware function
- [X] Gets current user from Clerk
- [X] Gets org membership and role
- [X] Throws ConvexError if permission denied
- [X] Passes context to handler if allowed
- [X] `getCurrentUser(ctx)` utility
- [X] `getOrgMembership(ctx, userId, orgId)` utility

**Constitution Checklist**:
- [X] Permission check on all mutations (Security)

---

## Phase 2: Audit Logging

### Task 2.1: Define Audit Log Schema
**Priority**: P0 (Critical) | **Estimate**: 1-2 hours | **Dependencies**: None

**Description**: Create schema for immutable audit logs.

**Files to create/modify**:
- `convex/schema.ts`

**Acceptance Criteria**:
- [X] `activity_log` table: orgId, userId, action, resourceType, resourceId, data, timestamp, ipAddress
- [X] Indexes: `by_org_time`, `by_user`, `by_resource`
- [X] NO update or delete mutations allowed

**Constitution Checklist**:
- [X] Logs are immutable (Compliance)
- [X] Audit trail requirements met (Audit Trail)

---

### Task 2.2: Implement Audit Logging Function
**Priority**: P0 (Critical) | **Estimate**: 2 hours | **Dependencies**: 2.1

**Description**: Create utility for logging actions.

**Files to create/modify**:
- `convex/audit.ts`

**Acceptance Criteria**:
- [X] `logActivity(ctx, { orgId, action, resourceType?, resourceId?, data? })` function
- [X] Auto-captures userId from current user
- [X] Auto-captures timestamp
- [X] Insert-only (no updates)
- [X] Action types enum: deadline_created, deadline_completed, document_uploaded, user_invited, etc.

**Constitution Checklist**:
- [X] Every status change logged (Audit Trail)

---

### Task 2.3: Implement Audit Log Query
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 2.2

**Description**: Create query for retrieving audit logs.

**Files to create/modify**:
- `convex/audit.ts`

**Acceptance Criteria**:
- [X] `getAuditLog(orgId, filters?, pagination)` query
- [X] Requires `audit:read` permission
- [X] Filters: userId, action, resourceType, dateRange
- [X] Pagination with cursor
- [X] Sorted by timestamp descending

**Constitution Checklist**:
- [X] Audit log access controlled (Security)

---

## Phase 3: Team Management Backend

### Task 3.1: Implement Invite User Mutation
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 1.3, 2.2

**Description**: Create mutation for inviting team members.

**Files to create/modify**:
- `convex/team.ts`

**Acceptance Criteria**:
- [X] `invite(orgId, email, role)` mutation
- [X] Requires `users:invite` permission
- [X] Validates email format
- [X] Validates role is valid
- [X] Creates Clerk organization invitation
- [X] Logs action to audit log
- [X] Returns invitation object

**Constitution Checklist**:
- [X] Permission checked (Security)
- [X] Action logged (Audit Trail)

---

### Task 3.2: Implement List Members Query
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 1.3

**Description**: Create query for listing org members.

**Files to create/modify**:
- `convex/team.ts`

**Acceptance Criteria**:
- [X] `listMembers(orgId)` query
- [X] Requires `users:read` permission
- [X] Returns: id, fullName, email, imageUrl, role, joinedAt
- [X] Includes deadline count per member
- [X] Sorted by role hierarchy, then name

**Constitution Checklist**:
- [X] Permission checked (Security)

---

### Task 3.3: Implement Update Role Mutation
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: 3.1

**Description**: Create mutation for changing member roles.

**Files to create/modify**:
- `convex/team.ts`

**Acceptance Criteria**:
- [X] `updateRole(orgId, memberId, newRole)` mutation
- [X] Requires `users:remove` permission (or owner)
- [X] Cannot change owner role
- [X] Cannot change own role (unless owner)
- [X] Updates Clerk membership
- [X] Logs action

**Constitution Checklist**:
- [X] Owner protection (Security)
- [X] Action logged (Audit Trail)

---

### Task 3.4: Implement Remove Member Mutation
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: 3.3

**Description**: Create mutation for removing team members.

**Files to create/modify**:
- `convex/team.ts`

**Acceptance Criteria**:
- [X] `removeMember(orgId, memberId)` mutation
- [X] Requires `users:remove` permission
- [X] Cannot remove owner
- [X] Cannot remove self
- [X] Unassigns member's deadlines (or reassigns to admin)
- [X] Removes from Clerk organization
- [X] Logs action

**Constitution Checklist**:
- [X] Owner cannot be removed (Security)
- [X] Deadlines handled on removal (Data Integrity)

---

### Task 3.5: List Pending Invitations Query
**Priority**: P1 (High) | **Estimate**: 1-2 hours | **Dependencies**: 3.1

**Description**: Query for pending invitations.

**Files to create/modify**:
- `convex/team.ts`

**Acceptance Criteria**:
- [X] `listPendingInvitations(orgId)` query
- [X] Fetches from Clerk
- [X] Returns: email, role, invitedAt, invitedBy
- [X] Option to revoke invitation

---

## Phase 4: Team Management UI

### Task 4.1: Create InviteModal Component
**Priority**: P0 (Critical) | **Estimate**: 3 hours | **Dependencies**: 3.1

**Description**: Create modal for inviting team members.

**Files to create/modify**:
- `src/components/features/team/InviteModal.tsx`

**Acceptance Criteria**:
- [X] Email input with validation
- [X] Role selector dropdown
- [X] Send Invite button with loading state
- [X] Success: show confirmation, close modal
- [X] Error: show error message

**Constitution Checklist**:
- [X] Clear validation errors (UX)
- [X] Loading states (UX)

---

### Task 4.2: Create RoleSelector Component
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: 1.1

**Description**: Create role selection dropdown.

**Files to create/modify**:
- `src/components/features/team/RoleSelector.tsx`

**Acceptance Criteria**:
- [X] Dropdown with all roles except owner
- [X] Description/permissions preview per role
- [X] Disabled state for non-editable
- [X] Controlled component

**Constitution Checklist**:
- [X] Role descriptions clear (Clarity)

---

### Task 4.3: Create MemberCard Component
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: 3.2

**Description**: Create card for displaying team member.

**Files to create/modify**:
- `src/components/features/team/MemberCard.tsx`

**Acceptance Criteria**:
- [X] Avatar, name, email
- [X] Role badge
- [X] Active deadlines count
- [X] Joined date
- [X] Actions: change role, remove (if permitted)

**Constitution Checklist**:
- [X] Conditional actions based on permissions (Security)

---

### Task 4.4: Create PendingInvitations Component
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: 3.5

**Description**: Create component showing pending invitations.

**Files to create/modify**:
- `src/components/features/team/PendingInvitations.tsx`

**Acceptance Criteria**:
- [X] Lists pending invitations
- [X] Shows: email, role, invited date
- [X] Revoke button per invitation
- [X] Empty state if none pending

---

### Task 4.5: Create RemoveMemberDialog Component
**Priority**: P1 (High) | **Estimate**: 1-2 hours | **Dependencies**: 3.4

**Description**: Create confirmation dialog for removing member.

**Files to create/modify**:
- `src/components/features/team/RemoveMemberDialog.tsx`

**Acceptance Criteria**:
- [X] Confirmation text with member name
- [X] Warning about unassigned deadlines
- [X] Cancel and Confirm buttons
- [X] Confirm shows loading state

**Constitution Checklist**:
- [X] Critical actions require confirmation (UX)

---

## Phase 5: Team Settings Page

### Task 5.1: Create Team Settings Page
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 4.1-4.5

**Description**: Create the main team management page.

**Files to create/modify**:
- `src/app/(dashboard)/settings/team/page.tsx`

**Acceptance Criteria**:
- [X] Header with "Team Members" and Invite button
- [X] Table of members using MemberCard
- [X] Columns: Member, Role, Active Deadlines, Joined, Actions
- [X] RoleSelector inline for editable roles
- [X] PendingInvitations section
- [X] Permission-based UI (hide invite if not permitted)

**Constitution Checklist**:
- [X] Permission-based visibility (Security)

---

### Task 5.2: Create Audit Log Page
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 2.3

**Description**: Create page for viewing audit logs.

**Files to create/modify**:
- `src/app/(dashboard)/settings/audit/page.tsx`

**Acceptance Criteria**:
- [X] Table of audit log entries
- [X] Columns: Timestamp, User, Action, Resource, Details
- [X] Filters: user, action type, date range
- [X] Pagination
- [X] Export to CSV option
- [X] Requires `audit:read` permission

**Constitution Checklist**:
- [X] Audit accessible to admins (Compliance)

---

### Task 5.3: Create WorkloadChart Component
**Priority**: P2 (Medium) | **Estimate**: 2 hours | **Dependencies**: 3.2

**Description**: Create chart showing deadline distribution across team.

**Files to create/modify**:
- `src/components/features/team/WorkloadChart.tsx`

**Acceptance Criteria**:
- [X] Bar chart using Recharts
- [X] Shows deadlines per member
- [X] Color-coded by status (overdue, due soon, upcoming)
- [X] Helps identify workload imbalances

---

## Phase 6: Testing

### Task 6.1: Write Unit Tests for Permission Logic
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 1.2

**Description**: Comprehensive tests for permission system.

**Files to create/modify**:
- `tests/unit/permissions.test.ts`

**Acceptance Criteria**:
- [X] Test each role's permissions
- [X] Test wildcard permissions
- [X] Test `:own` suffix logic
- [X] Test permission denial
- [X] Full permission matrix coverage
- [X] 100% coverage

**Constitution Checklist**:
- [X] 100% coverage for permissions (Testing Standards)

---

### Task 6.2: Write Integration Tests for Team Management
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 3.1-3.4

**Description**: Integration tests for team mutations.

**Files to create/modify**:
- `tests/integration/team.test.ts`

**Acceptance Criteria**:
- [ ] Test invite flow
- [ ] Test role update
- [ ] Test member removal
- [ ] Test permission denials
- [ ] Test audit logging
- [ ] 80% coverage

**Constitution Checklist**:
- [ ] 80% coverage for mutations (Testing Standards)

---

### Task 6.3: Write Tests for Audit Log Immutability
**Priority**: P0 (Critical) | **Estimate**: 1-2 hours | **Dependencies**: 2.2

**Description**: Ensure audit logs cannot be modified.

**Files to create/modify**:
- `tests/integration/audit.test.ts`

**Acceptance Criteria**:
- [ ] Test that update mutation doesn't exist
- [ ] Test that delete mutation doesn't exist
- [ ] Test that entries are created correctly
- [ ] Test org isolation

**Constitution Checklist**:
- [ ] Immutability verified (Compliance)

---

## Summary

| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| 1. RBAC Foundation | 3 | P0 | 7-9 |
| 2. Audit Logging | 3 | P0-P1 | 5-8 |
| 3. Team Backend | 5 | P0-P1 | 10-13 |
| 4. Team UI | 5 | P0-P1 | 10-12 |
| 5. Pages | 3 | P0-P2 | 8-10 |
| 6. Testing | 3 | P0 | 8-11 |
| **Total** | **22** | | **48-63** |

## Dependencies Graph

```
1.1 Types ─► 1.2 Permission Logic ─► 1.3 Middleware ─┐
                                                     │
2.1 Schema ─► 2.2 Logging ─► 2.3 Query ─────────────┴─► 3.1-3.5 Backend
                                                              │
                                                              ▼
                                                        4.1-4.5 UI
                                                              │
                                                              ▼
                                                        5.1-5.3 Pages
```

**Note**: Audit logs are **immutable** per Constitution. No update/delete mutations allowed on activity_log table.
