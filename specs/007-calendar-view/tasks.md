# Tasks: Calendar View

**Feature**: 007-calendar-view | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Overview

Build a full-featured calendar interface with multiple views, drag-and-drop rescheduling, iCal export, and print support. The calendar provides an alternative visualization to help users plan compliance activities.

---

## Phase 1: Calendar Foundation

### Task 1.1: Set Up FullCalendar Dependencies
**Priority**: P0 (Critical) | **Estimate**: 1-2 hours | **Dependencies**: None

**Description**: Install and configure FullCalendar React.

**Files to create/modify**:
- `package.json`
- `src/lib/calendar/config.ts`

**Acceptance Criteria**:
- [X] Install: @fullcalendar/react, @fullcalendar/daygrid, @fullcalendar/timegrid, @fullcalendar/list, @fullcalendar/interaction
- [X] Configure TypeScript types
- [X] Create base configuration object
- [X] CSS imports for styling

---

### Task 1.2: Create Calendar Data Query
**Priority**: P0 (Critical) | **Estimate**: 2 hours | **Dependencies**: 001-deadline-management

**Description**: Create optimized query for calendar events.

**Files to create/modify**:
- `convex/calendar.ts`

**Acceptance Criteria**:
- [X] `listForCalendar(orgId, dateRange?)` query
- [X] Returns deadlines with minimal fields (id, title, dueDate, category, completedAt, assignedTo)
- [X] Filters by date range for performance
- [X] Filters by orgId
- [X] Excludes soft-deleted

**Constitution Checklist**:
- [X] Org isolation (Security)
- [X] Optimized for calendar render (Performance)

---

### Task 1.3: Create Calendar Event Transformer
**Priority**: P0 (Critical) | **Estimate**: 2 hours | **Dependencies**: 1.2

**Description**: Create utility to transform deadlines into FullCalendar events.

**Files to create/modify**:
- `src/lib/calendar/transformer.ts`
- `tests/unit/calendar-transformer.test.ts`

**Acceptance Criteria**:
- [X] `transformToEvents(deadlines, filters)` function
- [X] Returns FullCalendar EventInput format
- [X] Color-coded by status:
  - Completed: green (#22c55e)
  - Overdue: red (#ef4444)
  - Due within 7 days: orange (#f97316)
  - Upcoming: blue (#3b82f6)
- [X] Applies filters (category, assignedTo, showCompleted)
- [X] Unit tests

**Constitution Checklist**:
- [X] Color coding matches dashboard (Consistency)

---

## Phase 2: Calendar Components

### Task 2.1: Create CalendarFilters Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: None

**Description**: Create filter controls for calendar view.

**Files to create/modify**:
- `src/components/features/calendar/CalendarFilters.tsx`

**Acceptance Criteria**:
- [X] Category multi-select filter
- [X] Assigned to filter (team members)
- [X] Show completed toggle
- [X] Clear all button
- [X] Compact horizontal layout
- [X] Filters persist in URL params

**Constitution Checklist**:
- [X] Keyboard accessible (Accessibility)

---

### Task 2.2: Create StatusDot Component
**Priority**: P1 (High) | **Estimate**: 30 min | **Dependencies**: None

**Description**: Create small status indicator for calendar events.

**Files to create/modify**:
- `src/components/features/calendar/StatusDot.tsx`

**Acceptance Criteria**:
- [X] Small colored circle (6-8px)
- [X] Color by status
- [X] Accessible (aria-label)

---

### Task 2.3: Create DeadlineQuickView Component
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 001-deadline-management

**Description**: Create side panel for viewing deadline details from calendar.

**Files to create/modify**:
- `src/components/features/calendar/DeadlineQuickView.tsx`

**Acceptance Criteria**:
- [X] Sheet/drawer component (slides from right)
- [X] Shows: title, status badge, due date, category, assignedTo, description
- [X] Shows linked documents (list)
- [X] Actions: Mark Complete, Edit Details (link)
- [X] Close button
- [X] Keyboard dismissible (Escape)

**Constitution Checklist**:
- [X] Critical actions accessible (Mobile)
- [X] Keyboard accessible (Accessibility)

---

### Task 2.4: Create Custom Event Content Renderer
**Priority**: P1 (High) | **Estimate**: 1-2 hours | **Dependencies**: 2.2

**Description**: Create custom renderer for calendar events.

**Files to create/modify**:
- `src/components/features/calendar/EventContent.tsx`

**Acceptance Criteria**:
- [X] Shows StatusDot + truncated title
- [X] Fits in calendar cell
- [X] Tooltip with full title on hover
- [X] Responsive to cell size

---

## Phase 3: Main Calendar View

### Task 3.1: Create Calendar Page
**Priority**: P0 (Critical) | **Estimate**: 5-6 hours | **Dependencies**: 1.1, 1.2, 1.3, 2.1-2.4

**Description**: Create the main calendar page with FullCalendar.

**Files to create/modify**:
- `src/app/(dashboard)/calendar/page.tsx`

**Acceptance Criteria**:
- [X] FullCalendar with plugins: dayGrid, timeGrid, list, interaction
- [X] Header toolbar: prev/next, today, title, view switchers
- [X] Views: Month, Week, List
- [X] Events from Convex query
- [X] Filters integrated
- [X] Click event opens DeadlineQuickView
- [X] Click date opens create modal (or navigates to new deadline)
- [X] Loading state while fetching
- [X] Full height (calc 100vh - header)

**Constitution Checklist**:
- [X] Calendar render < 500ms (Performance)
- [X] Loading state (UX)

---

### Task 3.2: Implement Drag-and-Drop Rescheduling
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 3.1

**Description**: Enable drag-and-drop to reschedule deadlines.

**Files to create/modify**:
- `src/app/(dashboard)/calendar/page.tsx`
- `convex/deadlines.ts` (if not already)

**Acceptance Criteria**:
- [X] Enable editable on FullCalendar
- [X] On eventDrop:
  - Show confirmation dialog with new date
  - On confirm: update deadline dueDate
  - On cancel: revert event position
- [X] Optimistic update with rollback on error
- [X] Toast notification on success
- [X] Alerts rescheduled automatically

**Constitution Checklist**:
- [X] Confirmation before save (Data Integrity)
- [X] Alerts update with deadline (Alert Reliability)
- [X] Optimistic updates with rollback (UX)

---

### Task 3.3: Create MiniCalendar Component
**Priority**: P2 (Medium) | **Estimate**: 2 hours | **Dependencies**: 1.3

**Description**: Create small calendar widget for sidebar/dashboard.

**Files to create/modify**:
- `src/components/features/calendar/MiniCalendar.tsx`

**Acceptance Criteria**:
- [X] Compact month view
- [X] Dots on days with deadlines
- [X] Click date navigates to calendar page
- [X] Current day highlighted
- [X] Responsive width

---

## Phase 4: iCal Export

### Task 4.1: Create iCal Generation Utility
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 001-deadline-management

**Description**: Create utility to generate iCal format from deadlines.

**Files to create/modify**:
- `src/lib/calendar/ical.ts`
- `tests/unit/ical.test.ts`

**Acceptance Criteria**:
- [X] Install: ical.js
- [X] `generateICalFeed(deadlines)` function
- [X] Creates VCALENDAR with VEVENT for each deadline
- [X] Includes: UID, SUMMARY, DTSTART, DESCRIPTION
- [X] Adds VALARM components for reminders (7 days, 1 day)
- [X] Returns iCal string
- [X] Unit tests for format validity

**Constitution Checklist**:
- [X] Standard iCal format (Interoperability)

---

### Task 4.2: Create iCal Feed Endpoint
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 4.1

**Description**: Create API endpoint for subscribable iCal feed.

**Files to create/modify**:
- `src/app/api/calendar/[orgId]/feed.ics/route.ts`
- `convex/calendar.ts`

**Acceptance Criteria**:
- [X] GET endpoint returns iCal content
- [X] Content-Type: text/calendar
- [X] Content-Disposition: attachment
- [X] Fetches deadlines from Convex action
- [ ] Auth: API key or signed URL for subscription
- [X] Caching headers for reasonable refresh interval

**Constitution Checklist**:
- [ ] Secure feed access (Security)

---

### Task 4.3: Create CalendarExportMenu Component
**Priority**: P1 (High) | **Estimate**: 2 hours | **Dependencies**: 4.2

**Description**: Create dropdown menu for calendar export options.

**Files to create/modify**:
- `src/components/features/calendar/CalendarExportMenu.tsx`

**Acceptance Criteria**:
- [X] Dropdown with options:
  - Download .ics file (current month)
  - Copy subscription URL
  - Add to Google Calendar (deep link)
  - Add to Apple Calendar (webcal:// link)
- [X] Copy URL shows success toast
- [X] Instructions for each option

**Constitution Checklist**:
- [X] Clear instructions (Clarity)

---

## Phase 5: Print View

### Task 5.1: Create CalendarPrintView Component
**Priority**: P2 (Medium) | **Estimate**: 3-4 hours | **Dependencies**: 1.2

**Description**: Create print-optimized calendar view.

**Files to create/modify**:
- `src/components/features/calendar/CalendarPrintView.tsx`

**Acceptance Criteria**:
- [X] Uses React.forwardRef for print library
- [X] Clean table-based month layout
- [X] Header with month/year and org name
- [X] Days with deadline bullets
- [X] Footer with generation timestamp
- [X] Black and white friendly
- [X] Page break handling

---

### Task 5.2: Implement Print Functionality
**Priority**: P2 (Medium) | **Estimate**: 1-2 hours | **Dependencies**: 5.1

**Description**: Add print button and functionality.

**Files to create/modify**:
- `src/app/(dashboard)/calendar/page.tsx`

**Acceptance Criteria**:
- [X] Install: @react-to-print
- [X] Print button in toolbar
- [X] Opens print dialog with CalendarPrintView
- [X] Proper print CSS

---

## Phase 6: Testing

### Task 6.1: Write Unit Tests for Calendar Utilities
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 1.3, 4.1

**Description**: Unit tests for calendar utilities.

**Files to create/modify**:
- `tests/unit/calendar-transformer.test.ts`
- `tests/unit/ical.test.ts`

**Acceptance Criteria**:
- [X] Test event transformation
- [X] Test color assignment
- [X] Test filter application
- [X] Test iCal generation format
- [X] Test alarm inclusion
- [X] 80% coverage

**Constitution Checklist**:
- [X] 80% coverage (Testing Standards)

---

### Task 6.2: Write E2E Tests for Calendar
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 3.1, 3.2

**Description**: E2E tests for calendar interactions.

**Files to create/modify**:
- `tests/e2e/calendar.spec.ts`

**Acceptance Criteria**:
- [ ] Test: View calendar, see deadlines displayed
- [ ] Test: Click event, quick view opens
- [ ] Test: Drag event to new date (mocked)
- [ ] Test: Filter by category
- [ ] Test: Switch views (month, week, list)

**Constitution Checklist**:
- [ ] E2E for critical paths (Testing Standards)

---

## Summary

| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| 1. Foundation | 3 | P0 | 5-6 |
| 2. Components | 4 | P0-P1 | 7-10 |
| 3. Main View | 3 | P0-P2 | 10-12 |
| 4. iCal Export | 3 | P1 | 7-9 |
| 5. Print | 2 | P2 | 4-6 |
| 6. Testing | 2 | P1 | 5-7 |
| **Total** | **17** | | **38-50** |

## Dependencies Graph

```
1.1 FullCalendar Setup ─┐
                        │
1.2 Query ─► 1.3 Transformer ─┐
                              │
2.1-2.4 Components ───────────┴─► 3.1 Calendar Page ─► 3.2 Drag-Drop
                                         │
                                         └─► 5.1 Print View ─► 5.2 Print Button

4.1 iCal Utility ─► 4.2 Feed Endpoint ─► 4.3 Export Menu
```

**Note**: Drag-and-drop rescheduling requires confirmation dialog per Constitution (Data Integrity).
