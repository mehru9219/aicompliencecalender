# Feature Specification: Dashboard & Overview

**Feature Branch**: `006-dashboard-overview`
**Created**: 2026-01-27
**Status**: Draft
**Input**: User description: "Build a central dashboard that gives users an instant, at-a-glance understanding of their compliance status with clear visual hierarchy prioritizing items that need immediate attention."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Compliance Score (Priority: P1)

A practice manager logs in and immediately sees a compliance score (0-100%) that tells them at a glance whether they're in good standing or need to take action.

**Why this priority**: The compliance score is the "north star" metric that summarizes everything - users need this first.

**Independent Test**: Can be tested by creating deadlines with various statuses and verifying score calculates correctly.

**Acceptance Scenarios**:

1. **Given** a user with no overdue items and all deadlines on track, **When** they view the dashboard, **Then** compliance score shows 100%.
2. **Given** a user with 2 overdue items out of 20 total, **When** they view the dashboard, **Then** compliance score reflects the penalty (significantly less than 100%).
3. **Given** changing deadline statuses, **When** items become overdue or completed, **Then** the score updates in real-time.

---

### User Story 2 - See Critical Alerts Section (Priority: P1)

A compliance officer opens the dashboard and immediately sees a prominent red section showing 2 overdue items and 1 item due today that cannot be scrolled past or minimized.

**Why this priority**: Critical alerts prevent costly misses - they must be impossible to ignore.

**Independent Test**: Can be tested by creating overdue/due-today items and verifying they appear prominently.

**Acceptance Scenarios**:

1. **Given** overdue deadlines exist, **When** dashboard loads, **Then** critical alerts section shows at top with red background and count of overdue items.
2. **Given** a deadline due today, **When** dashboard loads, **Then** it appears in critical alerts alongside overdue items.
3. **Given** failed alert deliveries, **When** dashboard loads, **Then** they appear in critical alerts requiring attention.

---

### User Story 3 - View Upcoming Deadlines by Urgency (Priority: P2)

A compliance manager reviews the dashboard to plan their week, seeing deadlines grouped by urgency: due this week (amber), upcoming 30 days (green).

**Why this priority**: Urgency grouping enables planning, but critical alerts must work first.

**Independent Test**: Can be tested by creating deadlines with various due dates and verifying correct grouping.

**Acceptance Scenarios**:

1. **Given** deadlines due within 7 days, **When** dashboard loads, **Then** they appear in "Due This Week" section with amber styling.
2. **Given** deadlines due in 14-30 days, **When** dashboard loads, **Then** they appear in "Upcoming" section with green styling.
3. **Given** each deadline in the list, **When** displayed, **Then** it shows: title, due date, assigned person, and quick-complete button.

---

### User Story 4 - Quick Actions (Priority: P2)

A compliance manager wants to add a new deadline, upload a document, or view the calendar without navigating through menus.

**Why this priority**: Quick actions reduce friction for common tasks, improving daily workflow.

**Independent Test**: Can be tested by using quick action buttons and verifying they navigate to correct features.

**Acceptance Scenarios**:

1. **Given** the dashboard, **When** user clicks "Add Deadline" quick action, **Then** the new deadline form opens immediately.
2. **Given** the dashboard, **When** user clicks "Upload Document", **Then** the document upload interface opens.
3. **Given** the dashboard, **When** user clicks "View Calendar", **Then** they navigate to calendar view.

---

### User Story 5 - View Recent Activity Feed (Priority: P3)

An organization admin checks the activity feed to see what compliance actions their team has taken recently.

**Why this priority**: Activity feed provides accountability and awareness but is supplementary to status views.

**Independent Test**: Can be tested by performing actions and verifying they appear in the feed.

**Acceptance Scenarios**:

1. **Given** a team member completes a deadline, **When** dashboard loads, **Then** the activity feed shows "John completed Medical License Renewal" with timestamp.
2. **Given** multiple recent actions, **When** viewing activity feed, **Then** it shows the 10 most recent in chronological order.
3. **Given** the activity feed, **When** user clicks an item, **Then** they navigate to the related deadline or document.

---

### User Story 6 - Switch Dashboard Views (Priority: P3)

A compliance manager switches between "My Items" (personal assigned deadlines) and "Team View" (all organization deadlines) to focus their attention.

**Why this priority**: View switching enables different use cases but requires the base dashboard first.

**Independent Test**: Can be tested by switching views and verifying the correct deadlines are displayed.

**Acceptance Scenarios**:

1. **Given** a user with 5 assigned deadlines in an org with 20 total, **When** they select "My Items", **Then** only their 5 assigned deadlines appear.
2. **Given** "Team View" selected, **When** dashboard loads, **Then** all organization deadlines appear regardless of assignment.
3. **Given** a saved view preference, **When** user returns to dashboard, **Then** their preferred view is remembered.

---

### Edge Cases

- What happens when the dashboard has no deadlines to display?
- How does the compliance score handle deadlines without due dates?
- What happens when a user has view-only access?
- How does the dashboard perform with 1000+ deadlines?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Dashboard MUST be the first screen users see after login.
- **FR-002**: Dashboard MUST display compliance score (0-100%) prominently at top of page.
- **FR-003**: Compliance score MUST be calculated from: overdue items (heavy penalty), due within 7 days (moderate penalty), due within 30 days (light penalty), completed on time (bonus).
- **FR-004**: Dashboard MUST display Critical Alerts section at top with red background showing: overdue count with days overdue, items due today, and failed alert deliveries.
- **FR-005**: Critical Alerts section MUST NOT be collapsible or dismissable.
- **FR-006**: Dashboard MUST display "Due This Week" section with amber styling for deadlines due within 7 days.
- **FR-007**: Dashboard MUST display "Upcoming" section with green styling for deadlines due in 14-30 day window.
- **FR-008**: Each deadline in lists MUST show: title, due date, assigned person, and quick-complete button.
- **FR-009**: Dashboard MUST display Quick Stats bar showing: total active deadlines, completed this month, completion rate, documents stored.
- **FR-010**: Dashboard MUST provide Quick Actions: Add Deadline, Upload Document, Generate Report, View Calendar.
- **FR-011**: Dashboard MUST display Recent Activity feed with last 10 organization actions.
- **FR-012**: Dashboard MUST support view switching: My Items, Team View, Category View.
- **FR-013**: Dashboard MUST remember user's view preference across sessions.
- **FR-014**: Dashboard MUST auto-refresh every 60 seconds to reflect changes.
- **FR-015**: Dashboard MUST allow users to customize which sections appear and their order.

### Key Entities

- **Compliance Score**: Calculated metric (0-100%) representing overall compliance health.
- **Dashboard Section**: Configurable display area (Critical Alerts, Due This Week, Upcoming, Activity).
- **User Dashboard Preferences**: Stored settings for view selection and section customization.
- **Activity Event**: Record of a compliance action (completion, upload, setting change) for the feed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dashboard loads completely within 2 seconds for organizations with up to 1000 deadlines.
- **SC-002**: Users can determine their compliance status within 5 seconds of viewing dashboard.
- **SC-003**: Critical items (overdue, due today) are noticed by 100% of users (measured by eye-tracking or click-through).
- **SC-004**: Compliance score updates reflect in real-time within 5 seconds of status changes.
- **SC-005**: 90% of users can complete a quick action (add deadline, upload) without navigating away.
- **SC-006**: Users report 80%+ satisfaction with "at-a-glance" compliance visibility.

## Assumptions

- Compliance score formula weights are predefined; future versions may allow customization.
- "Completed on time" bonus prevents score from being purely punitive.
- Critical Alerts being non-dismissable is intentional to force attention on urgent items.
- Activity feed shows organization-wide activity to all users with appropriate access.
- Dashboard sections beyond Critical Alerts can be reordered or hidden per user preference.

## Clarifications

### Session 2026-01-28

- Q: What are the specific penalty/bonus weights for score calculation? → A: Overdue: -5/deadline, Due 7d: -3, Due 30d: -1, On-time: +1 - per-deadline scoring is simpler to explain
- Q: How should the compliance score handle deadlines without due dates? → A: Prevent deadlines without due dates - spec requires dueDate, use separate Tasks feature for undated items (future)
- Q: What should view-only users see on the dashboard? → A: Read-only version with quick actions hidden - full context but no confusing action buttons
- Q: At 1000+ deadlines, which sections should be virtualized/paginated? → A: Show summary counts, click to drill down - dashboard is for overview, detailed views handle full data

### Integrated Decisions

**Compliance Score Formula**:
```typescript
function calculateScore(deadlines: Deadline[]): number {
  let score = 100;

  for (const d of deadlines.filter(d => !d.completedAt)) {
    const daysUntil = daysDiff(d.dueDate, Date.now());
    if (daysUntil < 0) score -= 5;       // Overdue
    else if (daysUntil <= 7) score -= 3;  // Due this week
    else if (daysUntil <= 30) score -= 1; // Due this month
  }

  // Bonus for recent on-time completions (last 30 days)
  const recentOnTime = deadlines.filter(d =>
    d.completedAt &&
    d.completedAt <= d.dueDate &&
    d.completedAt > Date.now() - 30 * DAY_MS
  );
  score += recentOnTime.length;

  return Math.max(0, Math.min(100, score));
}
```

**Deadline Schema**: dueDate is REQUIRED (not optional) - enforced by Zod validation.

**Viewer Role Dashboard**: Same layout, but quick action buttons conditionally hidden:
```tsx
{canEdit && <Button onClick={markComplete}>Mark Complete</Button>}
```

**Large Deadline Performance**: Dashboard shows counts with drill-down links:
```tsx
<Card>
  <h3>Due This Week</h3>
  <p className="text-3xl font-bold">{dueThisWeek.length}</p>
  <Link href="/deadlines?filter=due_this_week">View all →</Link>
</Card>
```
