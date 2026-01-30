# Feature Specification: Organization & Team Management

**Feature Branch**: `008-organization-team-management`
**Created**: 2026-01-27
**Status**: Draft
**Input**: User description: "Build a multi-tenant organization system that allows businesses to manage compliance across multiple team members with appropriate access controls and role-based permissions."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Organization (Priority: P1)

A new user signs up and creates their organization, establishing the foundation for their compliance management system.

**Why this priority**: Organization creation is the foundational action - everything else depends on having an organization.

**Independent Test**: Can be tested by signing up, creating an organization, and verifying data isolation.

**Acceptance Scenarios**:

1. **Given** a new user completing signup, **When** they enter organization name and industry, **Then** the organization is created with the user as Owner.
2. **Given** an organization created, **When** data is stored, **Then** it is completely isolated from all other organizations (multi-tenant).
3. **Given** a user with an organization, **When** they attempt to access another organization's data, **Then** access is denied.

---

### User Story 2 - Invite Team Members (Priority: P1)

An organization owner invites their compliance coordinator to join the team with Manager role permissions.

**Why this priority**: Team collaboration is essential for most organizations - single-user mode is limiting.

**Independent Test**: Can be tested by sending an invitation and verifying the invitee can join with correct role.

**Acceptance Scenarios**:

1. **Given** an Owner or Admin, **When** they invite user@example.com with "Manager" role, **Then** an invitation email is sent with a 7-day expiration link.
2. **Given** an invitation link, **When** the invitee clicks it, **Then** they can create an account (or link existing) and join the organization.
3. **Given** an expired invitation link, **When** clicked, **Then** the system shows an error and suggests requesting a new invitation.

---

### User Story 3 - Role-Based Access Control (Priority: P1)

A team member with "Member" role can see and complete their assigned deadlines but cannot modify organization settings or invite others.

**Why this priority**: Access control prevents accidents and enforces accountability - core to team management.

**Independent Test**: Can be tested by performing actions as different roles and verifying correct access.

**Acceptance Scenarios**:

1. **Given** a user with "Member" role, **When** they try to access settings, **Then** they see a "permission denied" message.
2. **Given** a user with "Admin" role, **When** they access user management, **Then** they can add, edit, and remove users except Owner.
3. **Given** a user with "Viewer" role, **When** they view deadlines, **Then** they cannot edit or complete any items.

---

### User Story 4 - Manage Team Members (Priority: P2)

An organization admin reviews the team list, changes a member's role from Member to Manager, and removes a departed employee.

**Why this priority**: Team management is ongoing but requires the team structure to exist first.

**Independent Test**: Can be tested by changing roles and removing users, verifying permissions update correctly.

**Acceptance Scenarios**:

1. **Given** an Admin viewing team list, **When** they change a Member to Manager, **Then** that user immediately gains Manager permissions.
2. **Given** an Admin removing a user, **When** confirmed, **Then** the user loses access and their assigned deadlines become unassigned.
3. **Given** an Owner, **When** they try to remove themselves, **Then** the system requires transferring ownership first.

---

### User Story 5 - View Audit Log (Priority: P2)

An organization admin reviews the audit log to see who marked a critical deadline as complete and when, for regulatory inquiry purposes.

**Why this priority**: Audit logs are essential for compliance proof but depend on user actions to log.

**Independent Test**: Can be tested by performing actions and verifying they appear in the audit log with correct details.

**Acceptance Scenarios**:

1. **Given** a deadline marked complete, **When** Admin views audit log, **Then** they see: timestamp, user, action "completed deadline", and deadline details.
2. **Given** audit log with many entries, **When** filtered by user or date range, **Then** only matching entries are displayed.
3. **Given** audit log entries, **When** attempting to modify or delete, **Then** the system prevents any changes (immutable).

---

### User Story 6 - Configure Single Sign-On (Priority: P3)

An enterprise organization configures SAML SSO so their employees can log in using company credentials without separate passwords.

**Why this priority**: SSO is an enterprise requirement but most organizations start with email/password auth.

**Independent Test**: Can be tested by configuring SSO and verifying users can authenticate via identity provider.

**Acceptance Scenarios**:

1. **Given** an Owner with Enterprise plan, **When** they configure SAML with their IdP, **Then** the SSO connection is established.
2. **Given** SSO enabled, **When** a user visits the login page, **Then** they see option to "Login with SSO" alongside email/password.
3. **Given** SSO-only mode enabled, **When** a user tries email/password login, **Then** they are redirected to SSO.

---

### Edge Cases

- What happens when the only Owner tries to leave the organization?
- How does the system handle users invited to multiple organizations?
- What happens when a user's assigned deadlines are transferred during removal?
- How does the system handle SSO failures or IdP outages?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST implement multi-tenant architecture with complete data isolation between organizations.
- **FR-002**: Each organization MUST have a name, industry classification, billing owner, and configurable settings.
- **FR-003**: Users MUST belong to exactly one organization (no cross-org access in initial version).
- **FR-004**: System MUST support five user roles: Owner, Admin, Manager, Member, Viewer.
- **FR-005**: Role permissions MUST be:
  - Owner: Full access, billing, delete organization, transfer ownership
  - Admin: User management, settings, all deadlines/documents, audit logs
  - Manager: Create/edit/complete deadlines, upload documents, assign to others
  - Member: View assigned deadlines, complete own tasks, upload documents
  - Viewer: Read-only access to dashboard and deadlines
- **FR-006**: System MUST allow Owners and Admins to invite users via email with role assignment.
- **FR-007**: Invitation links MUST expire after 7 days.
- **FR-008**: System MUST allow role changes for any user except: cannot demote the last Owner.
- **FR-009**: When users are removed, their assigned deadlines MUST become unassigned with notification to Admin.
- **FR-010**: System MUST log all actions in immutable audit log: who, what, when.
- **FR-011**: Audit logs MUST be filterable by user, action type, and date range.
- **FR-012**: Audit logs MUST be exportable for compliance purposes.
- **FR-013**: Audit logs MUST NOT be editable or deletable by any user role.
- **FR-014**: System MUST support SSO configuration (SAML and OAuth protocols) for Enterprise plans.
- **FR-015**: System MUST allow SSO-only mode that disables email/password authentication.

### Key Entities

- **Organization**: Multi-tenant container with name, industry, settings, and billing reference.
- **User**: Account belonging to one organization with assigned role.
- **Role**: Permission set defining what actions a user can perform.
- **Invitation**: Pending user invite with email, role, expiration, and status.
- **Audit Log Entry**: Immutable record of user action with timestamp and details.
- **SSO Configuration**: Identity provider settings for enterprise authentication.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% data isolation between organizations verified by security testing.
- **SC-002**: Users can invite a team member and have them onboarded in under 5 minutes.
- **SC-003**: Role permission changes take effect immediately (within 1 second).
- **SC-004**: Audit log queries return results within 5 seconds for logs up to 1 million entries.
- **SC-005**: SSO login completes within 3 seconds (excluding IdP response time).
- **SC-006**: Zero unauthorized access incidents (cross-tenant or role violation).
- **SC-007**: Audit logs provide cryptographically verifiable immutability.

## Assumptions

- Initial version supports one organization per user; multi-org access is future scope.
- "Viewer" role is intended for auditors, consultants, or read-only stakeholders.
- Ownership transfer requires explicit acceptance by the new Owner.
- Audit log retention is unlimited (or per data retention policy - 7 years for compliance).
- SSO configuration requires technical knowledge; documentation and support will be provided.

## Clarifications

### Session 2026-01-28

- Q: Spec says "one org per user" initially - should schema design for multi-org future? → A: Yes, junction table from start (user_organizations) - schema changes are painful post-launch
- Q: When the only Owner tries to leave the organization? → A: Force selection of new owner before completing departure - organization must always have an owner
- Q: How should audit log immutability be technically enforced? → A: Application-level only (no mutation functions exposed) - Convex doesn't support DB-level restrictions
- Q: If SSO IdP is unavailable while SSO-only mode is enabled? → A: Owner can temporarily enable email/password via support - security with escape hatch

### Integrated Decisions

**Multi-Org Schema** (future-proofed):
```typescript
// convex/schema.ts
const user_organizations = defineTable({
  userId: v.string(),
  orgId: v.id("organizations"),
  role: v.string(),
  joinedAt: v.number(),
}).index("by_user", ["userId"])
  .index("by_org", ["orgId"]);
```

**Owner Departure Flow**:
```typescript
// Before owner can leave:
if (isOnlyOwner(userId, orgId)) {
  const newOwner = await promptSelectNewOwner(orgMembers);
  await transferOwnership(orgId, userId, newOwner);
}
await removeMember(orgId, userId);
```

**Audit Log Immutability**: Only insert mutation exists - no update or delete:
```typescript
// convex/audit.ts - ONLY export:
export const log = internalMutation({...});
// NO exports for: updateAuditLog, deleteAuditLog
```

**SSO Lockout Recovery**: Support portal action:
```typescript
async function enableTemporaryPasswordAuth(orgId: string, reason: string) {
  await logSupportAction('sso_bypass_enabled', { orgId, reason });
  await updateOrgSettings(orgId, {
    temporaryPasswordAuthEnabled: true,
    temporaryPasswordAuthExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
}
```
