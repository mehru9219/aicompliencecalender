# Tasks: Core Deadline Management

**Feature**: 001-deadline-management | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Overview

Build the foundational deadline management system with CRUD operations, status calculation, recurrence support, and full audit trail. This is the core feature that all other features depend on.

---

## Phase 1: Database Foundation

### Task 1.1: Define Convex Schema for Organizations and Deadlines
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: None

**Description**: Create the Convex schema with proper indexes for multi-tenant isolation.

**Files to create/modify**:
- `convex/schema.ts`

**Acceptance Criteria**:
- [X] `organizations` table with name, industry, ownerId, settings, createdAt
- [X] `deadlines` table with all fields per plan (orgId, title, description, dueDate, category, recurrence, assignedTo, completedAt, completedBy, deletedAt, createdAt, createdBy)
- [X] Indexes: `by_org`, `by_org_status`, `by_org_category`, `by_assigned`
- [X] All fields use proper Convex validators (`v.id()`, `v.string()`, `v.optional()`, etc.)
- [X] Schema passes `npx convex dev` validation

**Constitution Checklist**:
- [X] Soft-delete implemented via `deletedAt` field (Data Integrity)
- [X] `orgId` on all queries enables multi-tenant isolation (Security)
- [X] No `any` types, all fields explicitly typed (Code Quality)

---

### Task 1.2: Create TypeScript Types for Deadlines
**Priority**: P0 (Critical) | **Estimate**: 1 hour | **Dependencies**: 1.1

**Description**: Define shared TypeScript types that match the Convex schema.

**Files to create/modify**:
- `src/types/deadline.ts`
- `src/types/organization.ts`

**Acceptance Criteria**:
- [X] `Deadline` type matches schema exactly
- [X] `DeadlineStatus` enum: `'upcoming' | 'due_soon' | 'overdue' | 'completed'`
- [X] `DeadlineCategory` enum: `'license' | 'certification' | 'training' | 'audit' | 'filing' | 'other'`
- [X] `RecurrencePattern` type with type, interval, endDate
- [X] Exported for use across the application

**Constitution Checklist**:
- [X] Strict types, no `any` (Code Quality)
- [X] Types documented with JSDoc comments (Documentation)

---

### Task 1.3: Create Zod Validation Schemas
**Priority**: P0 (Critical) | **Estimate**: 1-2 hours | **Dependencies**: 1.2

**Description**: Create Zod schemas for validating all deadline inputs.

**Files to create/modify**:
- `src/lib/validations/deadline.ts`

**Acceptance Criteria**:
- [X] `deadlineSchema` validates title (1-200 chars), description (max 2000), dueDate, category, recurrence, assignedTo
- [X] `recurrenceSchema` validates type enum, optional interval (positive number), optional endDate
- [X] Meaningful error messages for validation failures
- [X] Export validation schemas for use in forms and API

**Constitution Checklist**:
- [X] All API responses validated with Zod (Code Quality)
- [X] User-facing errors are clear and actionable (UX)

---

## Phase 2: Core Business Logic

### Task 2.1: Implement Status Calculation Utility
**Priority**: P0 (Critical) | **Estimate**: 2 hours | **Dependencies**: 1.2

**Description**: Create the status calculation function that determines deadline state based on due date and completion.

**Files to create/modify**:
- `src/lib/utils/status.ts`
- `tests/unit/status.test.ts`

**Acceptance Criteria**:
- [X] `calculateStatus(deadline)` returns correct status:
  - `completed` if `completedAt` exists
  - `overdue` if past due and not completed
  - `due_soon` if within 14 days
  - `upcoming` if more than 14 days out
- [X] Function accepts injectable `now` parameter for testing
- [X] 100% test coverage with edge cases (exactly 14 days, midnight boundaries)

**Constitution Checklist**:
- [X] 100% test coverage for date utilities (Testing Standards)
- [X] Tests do not depend on real time (Testing Principles)
- [X] No timezone bugs - all calculations in UTC (Alert Reliability)

---

### Task 2.2: Implement Recurrence Calculation Utility
**Priority**: P0 (Critical) | **Estimate**: 3 hours | **Dependencies**: 1.2

**Description**: Create utilities for calculating next due dates based on recurrence patterns.

**Files to create/modify**:
- `src/lib/utils/recurrence.ts`
- `tests/unit/recurrence.test.ts`

**Acceptance Criteria**:
- [X] `calculateNextDueDate(currentDue, recurrence)` handles all types:
  - weekly, monthly, quarterly, semi_annual, annual, custom (N days)
- [X] Correctly handles month-end edge cases (Jan 31 + 1 month = Feb 28)
- [X] Returns `null` if recurrence.endDate is exceeded
- [X] `generateNextDeadline(completed)` creates new deadline object without _id
- [X] 100% test coverage including leap years, DST transitions

**Constitution Checklist**:
- [X] 100% test coverage for recurrence calculation (Testing Standards)
- [X] Complex date logic has explanatory comments (Documentation)

---

### Task 2.3: Create Date Formatting Utilities
**Priority**: P1 (High) | **Estimate**: 1 hour | **Dependencies**: None

**Description**: Create centralized date formatting utilities for consistent display.

**Files to create/modify**:
- `src/lib/utils/date.ts`
- `tests/unit/date.test.ts`

**Acceptance Criteria**:
- [X] `formatDueDate(timestamp)` returns human-readable date
- [X] `getDaysUntil(timestamp)` returns days until due (negative if overdue)
- [X] `formatRelativeDate(timestamp)` returns "Due in X days", "Due today", "X days overdue"
- [X] All functions handle timezone correctly (display in user's timezone)

**Constitution Checklist**:
- [X] Timezone conversion only at display time (Alert Reliability)
- [X] 100% test coverage (Testing Standards)

---

## Phase 3: Convex Functions

### Task 3.1: Implement Deadline Queries
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 1.1, 2.1

**Description**: Create all Convex query functions for reading deadlines.

**Files to create/modify**:
- `convex/deadlines.ts`

**Acceptance Criteria**:
- [X] `list(orgId, filters?)` - paginated list with status calculation
- [X] `get(deadlineId)` - single deadline with full details
- [X] `upcoming(orgId, days)` - deadlines due within N days
- [X] `overdue(orgId)` - all overdue (not completed, past due)
- [X] `byCategory(orgId, category)` - filtered by category
- [X] `trash(orgId)` - soft-deleted items only
- [X] All queries filter by `orgId` for multi-tenant isolation
- [X] Status calculated on read, not stored

**Constitution Checklist**:
- [X] Multi-tenant isolation enforced (Security)
- [X] No N+1 queries (Performance)
- [X] JSDoc comments on all functions (Documentation)

---

### Task 3.2: Implement Deadline Mutations
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 3.1, 2.2

**Description**: Create all Convex mutation functions for writing deadlines.

**Files to create/modify**:
- `convex/deadlines.ts`
- `tests/integration/deadlines.test.ts`

**Acceptance Criteria**:
- [X] `create(data)` - creates deadline, returns ID
- [X] `update(id, data)` - updates deadline fields
- [X] `complete(id)` - marks complete with timestamp and user, creates next if recurring
- [X] `softDelete(id)` - sets deletedAt timestamp
- [X] `restore(id)` - clears deletedAt
- [X] `hardDelete(id)` - permanent delete (only if deletedAt > 30 days)
- [X] All mutations validate input with Zod
- [X] All mutations log to audit trail (prepare for Task 3.3)
- [ ] 80% test coverage (integration tests pending)

**Constitution Checklist**:
- [X] Atomic operations (Data Integrity)
- [X] Soft-delete with 30-day retention (Data Retention)
- [X] createdBy/completedBy tracking (Audit Trail)
- [ ] 80% coverage for mutations (Testing Standards - integration tests pending)

---

### Task 3.3: Implement Audit Logging for Deadlines
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: 3.2

**Description**: Add audit logging to track all deadline status changes.

**Files to create/modify**:
- `convex/schema.ts` (add audit_log table)
- `convex/audit.ts`
- `convex/deadlines.ts` (add logging calls)

**Acceptance Criteria**:
- [X] `deadline_audit_log` table: deadlineId, orgId, userId, action, previousValue, newValue, timestamp
- [X] Log entries created for: create, update, complete, delete, restore
- [X] Audit log is immutable (no update/delete mutations)
- [X] Index by deadlineId for retrieving history

**Constitution Checklist**:
- [X] Every status change logged (Audit Trail)
- [X] Logs are immutable (Compliance)
- [X] 7-year retention for completed deadlines (Data Retention)

---

## Phase 4: Frontend Components

### Task 4.1: Create DeadlineStatusBadge Component
**Priority**: P1 (High) | **Estimate**: 1-2 hours | **Dependencies**: 2.1

**Description**: Create the status badge component with color-coded indicators.

**Files to create/modify**:
- `src/components/features/deadlines/DeadlineStatusBadge.tsx`
- `tests/components/DeadlineStatusBadge.test.tsx`

**Acceptance Criteria**:
- [X] Displays status text with appropriate color:
  - Overdue: red background, white text
  - Due Soon: yellow/amber background
  - Upcoming: blue background
  - Completed: green background
- [X] Includes icon alongside color (not color-only)
- [X] Accessible: proper contrast ratio (4.5:1 minimum)
- [X] Supports size variants (sm, md, lg)

**Constitution Checklist**:
- [X] Color is never the only indicator (Accessibility)
- [X] Minimum contrast 4.5:1 (Accessibility)
- [X] Red/yellow/green instantly recognizable (UX)

---

### Task 4.2: Create DeadlineCard Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 4.1

**Description**: Create the card component for displaying deadlines in lists.

**Files to create/modify**:
- `src/components/features/deadlines/DeadlineCard.tsx`

**Acceptance Criteria**:
- [X] Displays: title, due date (formatted), category, status badge, assignee avatar
- [X] Click navigates to detail view
- [X] Quick actions: mark complete button (if not completed)
- [X] Responsive: works on mobile (touch target 44x44px minimum)
- [X] Loading skeleton variant

**Constitution Checklist**:
- [X] Touch targets minimum 44x44px (Mobile)
- [X] Critical actions accessible within 2 taps (Mobile)

---

### Task 4.3: Create DeadlineForm Component
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 1.3, 4.4

**Description**: Create the form for creating and editing deadlines.

**Files to create/modify**:
- `src/components/features/deadlines/DeadlineForm.tsx`

**Acceptance Criteria**:
- [X] Uses React Hook Form with Zod resolver
- [X] Fields: title, description (optional), dueDate (date picker), category (select), recurrence (optional), assignedTo (optional)
- [X] Validation errors displayed inline with clear messages
- [X] Submit shows loading state, success toast on save
- [X] Works for both create (empty) and edit (pre-filled) modes
- [X] Form labels visible (not placeholder-only)

**Constitution Checklist**:
- [X] Form inputs have visible labels (Accessibility)
- [X] Error messages are clear and actionable (UX)
- [X] Loading states present (UX)

---

### Task 4.4: Create RecurrenceSelector Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 1.3

**Description**: Create the recurrence pattern selector UI.

**Files to create/modify**:
- `src/components/features/deadlines/RecurrenceSelector.tsx`

**Acceptance Criteria**:
- [X] Toggle to enable/disable recurrence
- [X] Dropdown for type: Weekly, Monthly, Quarterly, Semi-Annual, Annual, Custom
- [X] Custom shows interval input (number of days)
- [X] Optional end date picker
- [X] Preview text: "Repeats monthly" or "Repeats every 45 days until Dec 31"

**Constitution Checklist**:
- [X] Clear UI for complex logic (Clarity)
- [X] Keyboard accessible (Accessibility)

---

### Task 4.5: Create DeadlineFilters Component
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: None

**Description**: Create the filter UI for the deadlines list.

**Files to create/modify**:
- `src/components/features/deadlines/DeadlineFilters.tsx`

**Acceptance Criteria**:
- [X] Filter by status (multi-select checkboxes)
- [X] Filter by category (multi-select)
- [ ] Filter by date range (from/to date pickers) (deferred)
- [ ] Filter by assignee (if team feature enabled) (deferred)
- [X] Clear all filters button
- [ ] Filters persist in URL query params (deferred)

**Constitution Checklist**:
- [X] Keyboard accessible (Accessibility)

---

## Phase 5: Pages

### Task 5.1: Create Deadlines List Page
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 3.1, 4.2, 4.5

**Description**: Create the main deadlines list page with filtering and pagination.

**Files to create/modify**:
- `src/app/(dashboard)/deadlines/page.tsx`

**Acceptance Criteria**:
- [X] Displays list of deadlines using DeadlineCard
- [X] Filters component integrated
- [ ] Pagination or infinite scroll (deferred)
- [X] "New Deadline" button links to create page
- [X] Empty state when no deadlines match filters
- [X] Loading skeleton while fetching
- [ ] Error state with retry button (deferred)

**Constitution Checklist**:
- [X] Loading state present (UX)
- [ ] Error state present with action (UX) (deferred)
- [X] Dashboard load < 1s target (Performance)

---

### Task 5.2: Create Deadline Detail/Edit Page
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 3.1, 3.2, 4.3

**Description**: Create the deadline detail page with edit capability.

**Files to create/modify**:
- `src/app/(dashboard)/deadlines/[id]/page.tsx`

**Acceptance Criteria**:
- [X] Displays full deadline details
- [X] Edit mode toggles to DeadlineForm
- [X] Mark Complete button (with confirmation if recurring)
- [X] Delete button (with confirmation dialog)
- [ ] Shows linked documents (placeholder for doc vault integration) (deferred)
- [X] Shows audit history (who created, modified, completed)
- [X] Breadcrumb navigation back to list

**Constitution Checklist**:
- [X] Critical actions require confirmation (UX)
- [X] Audit trail visible (Compliance)

---

### Task 5.3: Create New Deadline Page
**Priority**: P0 (Critical) | **Estimate**: 1-2 hours | **Dependencies**: 4.3

**Description**: Create the page for creating new deadlines.

**Files to create/modify**:
- `src/app/(dashboard)/deadlines/new/page.tsx`

**Acceptance Criteria**:
- [X] Renders DeadlineForm in create mode
- [X] On success, redirects to deadline detail or list
- [X] Cancel button returns to list
- [X] Page title: "New Deadline"

**Constitution Checklist**:
- [X] Clear navigation flow (UX)

---

## Phase 6: Testing & Polish

### Task 6.1: Write Integration Tests for Deadline CRUD
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 3.2

**Description**: Write comprehensive integration tests for the deadline workflow.

**Files to create/modify**:
- `convex/deadlines.test.ts`

**Acceptance Criteria**:
- [X] Test create -> read -> update -> delete flow
- [X] Test completion creates next deadline for recurring
- [X] Test soft-delete and restore
- [X] Test hard-delete only works after 30 days
- [X] Test multi-tenant isolation (org data isolated by orgId)
- [X] Test all validation errors

**Constitution Checklist**:
- [X] Tests are independent (Testing Principles)
- [ ] 80% coverage for Convex mutations (Testing Standards) - needs coverage check

---

### Task 6.2: Write E2E Tests for Critical Flows
**Priority**: P1 (High) | **Estimate**: 4-5 hours | **Dependencies**: 5.1, 5.2, 5.3

**Description**: Write Playwright E2E tests for the deadline management flow.

**Files to create/modify**:
- `tests/e2e/deadlines.spec.ts`

**Acceptance Criteria**:
- [ ] Test: Navigate to list, create new deadline, verify appears in list (requires Playwright setup)
- [ ] Test: Edit deadline, verify changes saved (requires Playwright setup)
- [ ] Test: Mark deadline complete, verify status changes (requires Playwright setup)
- [ ] Test: Delete deadline, verify moved to trash (requires Playwright setup)
- [ ] Test: Filter deadlines by status and category (requires Playwright setup)

**Constitution Checklist**:
- [ ] E2E tests for critical paths (Testing Standards) (requires Playwright setup)

---

### Task 6.3: Performance Optimization
**Priority**: P2 (Medium) | **Estimate**: 2-3 hours | **Dependencies**: 5.1

**Description**: Optimize queries and rendering for performance targets.

**Files to modify**:
- `convex/deadlines.ts`
- `src/app/(dashboard)/deadlines/page.tsx`

**Acceptance Criteria**:
- [X] List page loads in < 1s with 100 deadlines
- [ ] Pagination limits initial load to 20 items (deferred)
- [X] No N+1 queries in list view
- [X] Loading skeletons match content layout

**Constitution Checklist**:
- [X] Dashboard load < 1s (Performance)
- [X] No N+1 queries (Performance)

---

## Summary

| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| 1. Database Foundation | 3 | P0 | 4-6 |
| 2. Core Business Logic | 3 | P0 | 6-7 |
| 3. Convex Functions | 3 | P0-P1 | 9-11 |
| 4. Frontend Components | 5 | P0-P1 | 11-15 |
| 5. Pages | 3 | P0 | 7-10 |
| 6. Testing & Polish | 3 | P0-P2 | 10-13 |
| **Total** | **20** | | **47-62** |

## Dependencies Graph

```
1.1 Schema
 ├── 1.2 Types
 │    ├── 1.3 Zod Schemas
 │    ├── 2.1 Status Calculation
 │    └── 2.2 Recurrence Calculation
 │
 ├── 3.1 Queries ──────┬── 3.2 Mutations ── 3.3 Audit Logging
 │                     │
 │                     └── 5.1 List Page
 │                          5.2 Detail Page
 │
 └── 4.1 StatusBadge ── 4.2 DeadlineCard
     4.3 DeadlineForm ◄── 4.4 RecurrenceSelector
     4.5 Filters
```
