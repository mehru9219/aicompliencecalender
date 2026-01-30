# Feature Specification: Core Deadline Management

**Feature Branch**: `001-deadline-management`
**Created**: 2026-01-27
**Status**: Draft
**Input**: User description: "Build an application that helps regulated businesses track and manage compliance deadlines to avoid costly fines and license revocations."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Compliance Deadline (Priority: P1)

A compliance manager needs to create a new deadline for an upcoming license renewal. They enter the title, description, due date, and select a category. The deadline is saved and appears in their dashboard immediately.

**Why this priority**: Creating deadlines is the core action - without this, the product has no value. This is the foundation for all other features.

**Independent Test**: Can be fully tested by creating a deadline with all required fields and verifying it appears in the system with correct data.

**Acceptance Scenarios**:

1. **Given** a logged-in user with organization access, **When** they fill out the deadline form with title "Medical License Renewal", due date "2026-06-15", and category "License Renewal", **Then** the deadline is saved and visible in their deadline list.
2. **Given** a user creating a deadline, **When** they leave required fields empty, **Then** the system shows validation errors and prevents submission.
3. **Given** a user creating a deadline, **When** they select a team member to assign, **Then** that team member can see the deadline in their assigned items.

---

### User Story 2 - Configure Recurring Deadlines (Priority: P1)

A compliance manager sets up an annual HIPAA training deadline that automatically regenerates each year. When they complete this year's training deadline, the system automatically creates next year's deadline.

**Why this priority**: Most compliance requirements repeat. Manual re-creation is error-prone and defeats the purpose of the tool.

**Independent Test**: Can be tested by creating a recurring deadline, marking it complete, and verifying the next instance is automatically generated.

**Acceptance Scenarios**:

1. **Given** a user creating a deadline, **When** they select "Recurring: Annually" with a due date of March 15, **Then** the system schedules the deadline to recur every March 15.
2. **Given** a recurring deadline marked complete, **When** the completion is saved, **Then** the next occurrence is automatically created with the appropriate future date.
3. **Given** a recurring deadline, **When** the user views it, **Then** they can see the recurrence pattern and next scheduled occurrence.

---

### User Story 3 - Track Deadline Status (Priority: P2)

A compliance officer reviews their dashboard and instantly sees which deadlines are overdue, due soon, or upcoming based on automatic status calculation.

**Why this priority**: Status visibility is essential for prioritization but depends on deadlines existing first.

**Independent Test**: Can be tested by creating deadlines with various due dates and verifying correct status assignment.

**Acceptance Scenarios**:

1. **Given** a deadline with a due date in the past, **When** viewed, **Then** its status is "Overdue" with red indicator.
2. **Given** a deadline due within 14 days, **When** viewed, **Then** its status is "Due Soon" with amber indicator.
3. **Given** a deadline due more than 14 days away, **When** viewed, **Then** its status is "Upcoming" with blue indicator.
4. **Given** a deadline marked complete, **When** viewed, **Then** its status is "Completed" with green indicator.

---

### User Story 4 - Complete Deadline with Audit Trail (Priority: P2)

A team member marks a deadline as complete, and the system records who completed it and when for future audit reference.

**Why this priority**: Completion tracking is core to demonstrating compliance but requires deadlines to exist.

**Independent Test**: Can be tested by completing a deadline and verifying the completion record shows timestamp and user.

**Acceptance Scenarios**:

1. **Given** an assigned deadline, **When** the user clicks "Mark Complete", **Then** the system records completion date and completing user.
2. **Given** a completed deadline, **When** viewed in history, **Then** it shows completion date, user, and original deadline details.
3. **Given** a completed deadline, **When** a user attempts to edit it, **Then** the system prevents changes (read-only state).

---

### User Story 5 - Soft Delete and Restore (Priority: P3)

A user accidentally deletes a deadline and needs to recover it from trash within 30 days.

**Why this priority**: Data recovery is important but less frequently used than core CRUD operations.

**Independent Test**: Can be tested by deleting a deadline, viewing trash, and restoring it.

**Acceptance Scenarios**:

1. **Given** a deadline, **When** the user deletes it, **Then** it moves to trash and is no longer visible in active views.
2. **Given** a deleted deadline in trash, **When** the user restores it within 30 days, **Then** it returns to active status with all data intact.
3. **Given** a deadline in trash for 30+ days, **When** the retention period passes, **Then** it is permanently removed from the system.

---

### Edge Cases

- What happens when a recurring deadline's completion date is after the next scheduled occurrence?
- How does the system handle deadlines assigned to users who are removed from the organization?
- What happens when a user tries to set a due date in the past?
- How does the system handle timezone differences for deadline due dates?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create deadlines with title (required), description (optional), due date (required), and category (required).
- **FR-002**: System MUST support deadline categories: license renewal, certification, training, audit, filing, and custom categories.
- **FR-003**: System MUST allow deadlines to be assigned to exactly one team member within the organization.
- **FR-004**: System MUST support one-time and recurring deadlines with patterns: weekly, monthly, quarterly, semi-annually, annually, and custom intervals.
- **FR-005**: System MUST automatically calculate deadline status (upcoming, due soon, overdue, completed) based on current date and due date.
- **FR-006**: System MUST use 14 days as the threshold for "due soon" status.
- **FR-007**: System MUST allow users to mark deadlines as complete, recording completion timestamp and completing user.
- **FR-008**: System MUST make completed deadlines read-only while keeping them visible in history view.
- **FR-009**: System MUST automatically generate the next occurrence when a recurring deadline is completed.
- **FR-010**: System MUST implement soft-delete with 30-day retention before permanent removal.
- **FR-011**: System MUST allow restoration of deleted deadlines within the 30-day window.
- **FR-012**: System MUST isolate all deadline data by organization (multi-tenant).
- **FR-013**: System MUST allow editing of deadlines before completion but prevent changes after completion.
- **FR-014**: System MUST validate that due dates are not in the past for new deadlines (warnings allowed, not blocking).

### Key Entities

- **Deadline**: A compliance requirement with title, description, due date, category, status, assigned user, recurrence pattern, and organization reference.
- **Category**: Classification type for deadlines (predefined and custom), belonging to an organization.
- **Completion Record**: Audit entry capturing who completed a deadline and when.
- **Recurrence Pattern**: Definition of how a deadline repeats (frequency, interval, end conditions).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new deadline in under 60 seconds.
- **SC-002**: System correctly calculates status for 100% of deadlines based on due date.
- **SC-003**: Recurring deadlines generate next occurrence within 5 seconds of completion.
- **SC-004**: 99.9% of deadline data operations complete successfully without data loss.
- **SC-005**: Users can find any deadline (active or historical) within 30 seconds using search or filters.
- **SC-006**: Deleted deadlines remain recoverable for exactly 30 days before permanent removal.
- **SC-007**: Completion records provide audit-ready proof of who completed what and when.

## Assumptions

- Organizations will have a reasonable number of categories (typically 5-20 custom categories).
- Users understand their local timezone; the system will handle timezone conversions transparently.
- "Due soon" threshold of 14 days is appropriate for most compliance contexts (can be made configurable in future).
- Recurring deadlines use the completion date, not the original due date, to calculate the next occurrence.

## Clarifications

### Session 2026-01-28

- Q: What timezone strategy should be used for deadline due dates? → A: Store in UTC, convert to user's local timezone on display (industry standard for distributed systems)
- Q: When calculating next occurrence of recurring deadline, what date is the base? → A: Configurable per deadline - user chooses between fixed schedule (original due date) or rolling schedule (completion date)
- Q: When a user tries to create a deadline with a past due date? → A: Allow with warning - users need to enter historical data during onboarding
- Q: When a user assigned to deadlines is removed from the organization? → A: Leave unassigned with notification to admins - admins make informed reassignment decisions

### Integrated Decisions

**Timezone Handling**: All due dates stored as UTC timestamps. Display conversion uses `date-fns-tz` with user's configured timezone.

**Recurrence Pattern Schema**:
```typescript
recurrence: {
  type: 'weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | 'custom',
  interval?: number, // for custom
  baseDate: 'original' | 'completion', // User configurable
}
```

**Past Due Date Validation**: UI shows yellow warning banner when due date is in the past. Submission is NOT blocked.

**User Removal Flow**: On removal, affected deadlines set `assignedTo: null` and notification sent to org admins listing unassigned deadlines.
