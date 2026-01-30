# Feature Specification: Calendar View

**Feature Branch**: `007-calendar-view`
**Created**: 2026-01-27
**Status**: Draft
**Input**: User description: "Build a calendar interface that displays all compliance deadlines in familiar monthly, weekly, and agenda formats, allowing users to visualize their compliance workload over time."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Monthly Calendar (Priority: P1)

A compliance manager views a monthly calendar grid showing all deadlines as colored dots on their due dates, with colors indicating status (overdue, due soon, upcoming, completed).

**Why this priority**: Monthly view is the most commonly used calendar format and provides the broadest overview.

**Independent Test**: Can be tested by creating deadlines across multiple dates and verifying they appear correctly on the calendar.

**Acceptance Scenarios**:

1. **Given** deadlines spread across a month, **When** viewing monthly calendar, **Then** each deadline appears as a colored dot on its due date.
2. **Given** an overdue deadline, **When** displayed, **Then** it shows as a red dot/chip.
3. **Given** a date with multiple deadlines, **When** clicked, **Then** it shows a list of all deadlines due that day.

---

### User Story 2 - Navigate Calendar (Priority: P1)

A compliance manager navigates between months to plan for upcoming quarters and returns to today with a single click.

**Why this priority**: Navigation is essential for calendar usability - users must be able to move through time easily.

**Independent Test**: Can be tested by navigating between months and verifying correct dates are displayed.

**Acceptance Scenarios**:

1. **Given** the calendar, **When** user clicks next month arrow, **Then** the next month is displayed.
2. **Given** the calendar away from current month, **When** user clicks "Today", **Then** the view returns to current month with today highlighted.
3. **Given** the month/year label, **When** clicked, **Then** a date picker allows jumping to a specific month/year.

---

### User Story 3 - View Weekly Calendar (Priority: P2)

A compliance manager views a weekly calendar with more detail, seeing deadline titles and assigned persons for each day.

**Why this priority**: Weekly view provides more detail for near-term planning but monthly view covers broader use cases.

**Independent Test**: Can be tested by switching to weekly view and verifying detailed deadline information is displayed.

**Acceptance Scenarios**:

1. **Given** weekly view selected, **When** displayed, **Then** each day shows as a column with deadline titles visible.
2. **Given** deadlines with assigned users, **When** displayed in weekly view, **Then** the assigned person's name appears with each deadline.
3. **Given** a deadline with a specific time, **When** displayed, **Then** it's positioned at the appropriate time slot.

---

### User Story 4 - Drag and Drop Reschedule (Priority: P2)

A compliance manager learns a deadline has been extended and drags it from the original date to the new date, updating it instantly.

**Why this priority**: Drag-and-drop rescheduling streamlines a common workflow but requires the calendar to exist first.

**Independent Test**: Can be tested by dragging a deadline to a new date and verifying the due date updates.

**Acceptance Scenarios**:

1. **Given** a deadline on the calendar, **When** user drags it to a different date, **Then** a confirmation dialog appears.
2. **Given** the confirmation dialog, **When** user confirms, **Then** the deadline's due date updates to the new date.
3. **Given** a dragged deadline, **When** user cancels the confirmation, **Then** the deadline returns to its original date.

---

### User Story 5 - Filter Calendar (Priority: P2)

A compliance manager filters the calendar to show only "Training" deadlines, reducing visual clutter when planning training schedules.

**Why this priority**: Filtering enables focused views but requires the full calendar to work first.

**Independent Test**: Can be tested by applying filters and verifying only matching deadlines are displayed.

**Acceptance Scenarios**:

1. **Given** multiple deadline categories, **When** user filters by "Training", **Then** only training deadlines appear on calendar.
2. **Given** multiple filters (category + assigned person), **When** combined, **Then** results match all criteria.
3. **Given** active filters, **When** user clicks "Clear Filters", **Then** all deadlines reappear.

---

### User Story 6 - Export Calendar (Priority: P3)

A compliance manager exports their compliance deadlines to their Google Calendar to see them alongside other appointments.

**Why this priority**: External sync extends value but is not essential for core calendar functionality.

**Independent Test**: Can be tested by exporting/subscribing and verifying deadlines appear in external calendar.

**Acceptance Scenarios**:

1. **Given** the calendar, **When** user clicks "Export to iCal", **Then** an .ics file downloads with all visible deadlines.
2. **Given** a subscribe URL, **When** user adds it to Google/Outlook Calendar, **Then** they see compliance deadlines that update automatically.
3. **Given** external calendar sync, **When** a deadline is updated in the system, **Then** the change reflects in the external calendar.

---

### User Story 7 - View Agenda List (Priority: P3)

A compliance manager who prefers lists over visual calendars views all deadlines in a chronological agenda format.

**Why this priority**: Agenda view serves users who dislike visual calendars but represents a smaller user segment.

**Independent Test**: Can be tested by switching to agenda view and verifying chronological list is displayed.

**Acceptance Scenarios**:

1. **Given** agenda view selected, **When** displayed, **Then** deadlines appear in a chronological list grouped by date.
2. **Given** agenda view, **When** user scrolls down, **Then** more future deadlines load (infinite scroll).
3. **Given** a deadline in agenda view, **When** clicked, **Then** its detail panel opens.

---

### Edge Cases

- What happens when there are 50+ deadlines on a single day?
- How does the calendar handle deadlines without specific times?
- What happens when a user tries to drag a completed deadline?
- How does the calendar display recurring deadlines?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide monthly calendar view showing deadlines as colored indicators on due dates.
- **FR-002**: Deadline colors MUST indicate status: red (overdue), orange (due within 7 days), blue (upcoming), green (completed).
- **FR-003**: Clicking a date MUST show all deadlines due that day.
- **FR-004**: Clicking a deadline MUST open its detail panel.
- **FR-005**: System MUST provide weekly calendar view showing deadline titles and assigned persons.
- **FR-006**: System MUST provide agenda view as chronological list with infinite scroll.
- **FR-007**: System MUST allow navigation: previous/next month arrows, "Today" button, month/year picker.
- **FR-008**: System MUST allow drag-and-drop rescheduling of deadlines with confirmation.
- **FR-009**: Drag-and-drop MUST be disabled for completed deadlines.
- **FR-010**: System MUST support filtering by: category, assigned person, status, recurrence type.
- **FR-011**: Multiple filters MUST combine with AND logic.
- **FR-012**: System MUST export deadlines to iCal (.ics) format.
- **FR-013**: System MUST provide subscribe URL for live calendar feed integration.
- **FR-014**: System MUST support import from iCal to bulk-create deadlines.
- **FR-015**: System MUST provide print-friendly monthly view for physical posting.
- **FR-016**: System MUST support keyboard navigation for power users.

### Key Entities

- **Calendar View**: Display mode (monthly, weekly, agenda) with associated rendering logic.
- **Calendar Filter**: Active filter criteria (category, person, status) applied to calendar display.
- **Calendar Event**: Representation of a deadline in calendar format with position and styling.
- **iCal Export**: Generated calendar file or subscription feed URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Monthly calendar loads within 1 second for up to 500 deadlines.
- **SC-002**: Calendar virtualization handles 10,000+ deadlines without performance degradation.
- **SC-003**: Users can reschedule a deadline via drag-and-drop in under 5 seconds.
- **SC-004**: Calendar sync with external calendars updates within 15 minutes of changes.
- **SC-005**: 90% of users can navigate to a specific month within 10 seconds.
- **SC-006**: Filter combinations return correct results 100% of the time.

## Assumptions

- Deadlines without specific times appear at the top of the day's list.
- Color-blind accessible alternatives (patterns/icons) will supplement color coding.
- iCal subscribe URL updates periodically (not real-time push).
- Drag-and-drop updates the due date only, not recurrence patterns.
- Print view optimizes for standard letter/A4 paper sizes.

## Clarifications

### Session 2026-01-28

- Q: How should the calendar display when 50+ deadlines fall on the same day? → A: Badge with count only, click opens day detail modal - clean visual that scales
- Q: When a user tries to drag a completed deadline? → A: Show tooltip "Completed deadlines cannot be rescheduled" - clear feedback explains why
- Q: How should recurring deadlines display on the calendar? → A: Show next 3 occurrences with faded styling for subsequent - shows pattern without clutter
- Q: How should the public iCal feed URL be authenticated? → A: API key embedded in URL (org-specific) - standard for iCal, doesn't expire like signed URLs

### Integrated Decisions

**50+ Deadlines Display**:
```tsx
// Calendar day cell
{deadlinesOnDay.length > 5 ? (
  <Badge onClick={() => openDayModal(date)}>
    {deadlinesOnDay.length} deadlines
  </Badge>
) : (
  deadlinesOnDay.map(d => <DeadlineChip key={d._id} deadline={d} />)
)}
```

**Completed Deadline Drag Prevention**:
```typescript
// FullCalendar config
eventAllow: (dropInfo, draggedEvent) => {
  if (draggedEvent.extendedProps.deadline.completedAt) {
    showTooltip('Completed deadlines cannot be rescheduled');
    return false;
  }
  return true;
}
```

**Recurring Deadline Display**:
```typescript
function getRecurringDisplayItems(deadline: Deadline): CalendarEvent[] {
  if (!deadline.recurrence) return [toEvent(deadline)];

  const events = [toEvent(deadline)]; // Current (solid)
  let nextDate = deadline.dueDate;

  for (let i = 0; i < 2; i++) { // 2 more = 3 total
    nextDate = calculateNextDate(nextDate, deadline.recurrence);
    events.push(toEvent(deadline, nextDate, { opacity: 0.5 }));
  }

  return events;
}
```

**iCal Feed URL**: `/api/calendar/feed.ics?key=org_abc123xyz`
- Key is org-specific, can be regenerated if compromised
- Stored in org settings as `icalFeedKey`
