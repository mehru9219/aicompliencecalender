## AI Compliance Calendar - Complete Test Suite

---

## Test Categories Overview

| Category | Description | Tools |
|----------|-------------|-------|
| **Unit Tests** | Individual functions, components, utilities | Vitest, React Testing Library |
| **Integration Tests** | Convex functions, API routes, service integrations | Vitest, Convex test utilities |
| **E2E Tests** | Full user flows in browser | Playwright |
| **Security Tests** | Auth, permissions, data isolation | Vitest, Playwright |
| **Performance Tests** | Load times, query efficiency | Lighthouse, custom benchmarks |
| **Accessibility Tests** | WCAG 2.1 AA compliance | axe-core, Playwright |

---

## Spec 1: Deadline Management

### Unit Tests

#### 1.1 Date/Time Utilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: calculateStatus()                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-1.1.1  │ Returns 'completed' when completedAt is set                     │
│ UT-1.1.2  │ Returns 'overdue' when dueDate < now and not completed          │
│ UT-1.1.3  │ Returns 'due_soon' when dueDate is within 14 days               │
│ UT-1.1.4  │ Returns 'upcoming' when dueDate is more than 14 days away       │
│ UT-1.1.5  │ Returns 'overdue' for deadline due exactly at midnight today    │
│ UT-1.1.6  │ Handles timezone edge case at DST transition                    │
│ UT-1.1.7  │ Returns correct status for deadline due in 1 second             │
│ UT-1.1.8  │ Returns correct status for deadline overdue by 1 second         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: calculateNextDueDate()                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-1.2.1  │ Weekly recurrence adds 7 days                                   │
│ UT-1.2.2  │ Monthly recurrence handles 31-day months                        │
│ UT-1.2.3  │ Monthly recurrence handles February (28 days)                   │
│ UT-1.2.4  │ Monthly recurrence handles leap year February (29 days)         │
│ UT-1.2.5  │ Quarterly recurrence adds 3 months                              │
│ UT-1.2.6  │ Semi-annual recurrence adds 6 months                            │
│ UT-1.2.7  │ Annual recurrence adds 1 year                                   │
│ UT-1.2.8  │ Annual recurrence handles Feb 29 to Feb 28 in non-leap year     │
│ UT-1.2.9  │ Custom interval calculates correctly (e.g., every 45 days)      │
│ UT-1.2.10 │ Returns null when endDate is reached                            │
│ UT-1.2.11 │ Rolling schedule uses completion date as base                   │
│ UT-1.2.12 │ Fixed schedule uses original due date as base                   │
│ UT-1.2.13 │ Handles year boundary (Dec 31 → Jan 1)                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: formatDeadlineDate()                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-1.3.1  │ Formats UTC timestamp to user's local timezone                  │
│ UT-1.3.2  │ Displays "Today" for deadlines due today                        │
│ UT-1.3.3  │ Displays "Tomorrow" for deadlines due tomorrow                  │
│ UT-1.3.4  │ Displays "X days ago" for overdue deadlines                     │
│ UT-1.3.5  │ Displays full date for deadlines more than 7 days away          │
│ UT-1.3.6  │ Handles different user timezones correctly                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 1.2 Validation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: deadlineSchema (Zod validation)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-1.4.1  │ Accepts valid deadline data                                     │
│ UT-1.4.2  │ Rejects empty title                                             │
│ UT-1.4.3  │ Rejects title longer than 200 characters                        │
│ UT-1.4.4  │ Rejects description longer than 2000 characters                 │
│ UT-1.4.5  │ Rejects invalid category enum value                             │
│ UT-1.4.6  │ Accepts valid recurrence pattern                                │
│ UT-1.4.7  │ Rejects invalid recurrence type                                 │
│ UT-1.4.8  │ Allows past due date with warning flag                          │
│ UT-1.4.9  │ Rejects negative custom interval                                │
│ UT-1.4.10 │ Accepts null assignedTo                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 1.3 React Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: DeadlineCard component                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-1.5.1  │ Renders deadline title                                          │
│ UT-1.5.2  │ Renders correct status badge color                              │
│ UT-1.5.3  │ Renders due date in user's timezone                             │
│ UT-1.5.4  │ Renders assigned user avatar when assigned                      │
│ UT-1.5.5  │ Renders "Unassigned" when no assignee                           │
│ UT-1.5.6  │ Renders recurrence indicator for recurring deadlines            │
│ UT-1.5.7  │ Renders category badge                                          │
│ UT-1.5.8  │ Quick complete button is visible for non-completed              │
│ UT-1.5.9  │ Quick complete button is hidden for completed deadlines         │
│ UT-1.5.10 │ Click on card navigates to detail page                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: DeadlineForm component                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-1.6.1  │ Renders all required fields                                     │
│ UT-1.6.2  │ Pre-fills fields when editing existing deadline                 │
│ UT-1.6.3  │ Shows validation errors on invalid input                        │
│ UT-1.6.4  │ Disables submit button while submitting                         │
│ UT-1.6.5  │ Shows warning for past due date                                 │
│ UT-1.6.6  │ Recurrence options appear when "Recurring" is checked           │
│ UT-1.6.7  │ Custom interval field appears when "Custom" recurrence selected │
│ UT-1.6.8  │ Date picker restricts to valid date range                       │
│ UT-1.6.9  │ Calls onSubmit with correct data shape                          │
│ UT-1.6.10 │ Calls onCancel when cancel button clicked                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: StatusBadge component                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-1.7.1  │ Renders red background for 'overdue' status                     │
│ UT-1.7.2  │ Renders amber background for 'due_soon' status                  │
│ UT-1.7.3  │ Renders blue background for 'upcoming' status                   │
│ UT-1.7.4  │ Renders green background for 'completed' status                 │
│ UT-1.7.5  │ Includes accessible label for screen readers                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: RecurrenceSelector component                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-1.8.1  │ Renders all recurrence type options                             │
│ UT-1.8.2  │ Shows interval input only for custom type                       │
│ UT-1.8.3  │ Shows end date picker when "Has end date" is checked            │
│ UT-1.8.4  │ Shows base date selector (original vs completion)               │
│ UT-1.8.5  │ Emits correct recurrence object on change                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: DeadlineFilters component                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-1.9.1  │ Renders category filter checkboxes                              │
│ UT-1.9.2  │ Renders status filter checkboxes                                │
│ UT-1.9.3  │ Renders date range picker                                       │
│ UT-1.9.4  │ Renders assigned user filter                                    │
│ UT-1.9.5  │ Clear all button resets all filters                             │
│ UT-1.9.6  │ Filter changes emit correct filter object                       │
│ UT-1.9.7  │ Active filter count badge shows correct number                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex deadlines.create mutation                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-1.1.1  │ Creates deadline with valid data                                │
│ IT-1.1.2  │ Returns created deadline ID                                     │
│ IT-1.1.3  │ Sets createdAt timestamp automatically                          │
│ IT-1.1.4  │ Sets createdBy to current user ID                               │
│ IT-1.1.5  │ Triggers alert scheduling for new deadline                      │
│ IT-1.1.6  │ Rejects creation for unauthorized user                          │
│ IT-1.1.7  │ Rejects creation for non-member of org                          │
│ IT-1.1.8  │ Creates deadline with null assignedTo                           │
│ IT-1.1.9  │ Creates deadline with valid assignedTo user ID                  │
│ IT-1.1.10 │ Rejects invalid assignedTo (non-org member)                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex deadlines.update mutation                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-1.2.1  │ Updates deadline with valid data                                │
│ IT-1.2.2  │ Reschedules alerts when due date changes                        │
│ IT-1.2.3  │ Preserves fields not included in update                         │
│ IT-1.2.4  │ Rejects update for completed deadline                           │
│ IT-1.2.5  │ Rejects update for unauthorized user                            │
│ IT-1.2.6  │ Rejects update for different org's deadline                     │
│ IT-1.2.7  │ Logs update action to audit log                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex deadlines.complete mutation                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-1.3.1  │ Marks deadline as completed with timestamp                      │
│ IT-1.3.2  │ Sets completedBy to current user ID                             │
│ IT-1.3.3  │ Cancels pending alerts for completed deadline                   │
│ IT-1.3.4  │ Creates next occurrence for recurring deadline                  │
│ IT-1.3.5  │ Does not create next when recurrence endDate reached            │
│ IT-1.3.6  │ Rejects completion by viewer role                               │
│ IT-1.3.7  │ Member can complete their own assigned deadline                 │
│ IT-1.3.8  │ Manager can complete any deadline                               │
│ IT-1.3.9  │ Logs completion action to audit log                             │
│ IT-1.3.10 │ Schedules alerts for newly created recurring instance           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex deadlines.softDelete mutation                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-1.4.1  │ Sets deletedAt timestamp                                        │
│ IT-1.4.2  │ Deadline no longer appears in list queries                      │
│ IT-1.4.3  │ Deadline appears in trash query                                 │
│ IT-1.4.4  │ Cancels pending alerts for deleted deadline                     │
│ IT-1.4.5  │ Rejects delete by member role                                   │
│ IT-1.4.6  │ Manager can delete deadline                                     │
│ IT-1.4.7  │ Logs delete action to audit log                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex deadlines.restore mutation                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-1.5.1  │ Clears deletedAt timestamp                                      │
│ IT-1.5.2  │ Deadline reappears in list queries                              │
│ IT-1.5.3  │ Reschedules alerts for restored deadline                        │
│ IT-1.5.4  │ Rejects restore of non-deleted deadline                         │
│ IT-1.5.5  │ Logs restore action to audit log                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex deadlines.list query                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-1.6.1  │ Returns only deadlines for specified org                        │
│ IT-1.6.2  │ Excludes soft-deleted deadlines                                 │
│ IT-1.6.3  │ Filters by status correctly                                     │
│ IT-1.6.4  │ Filters by category correctly                                   │
│ IT-1.6.5  │ Filters by date range correctly                                 │
│ IT-1.6.6  │ Filters by assigned user correctly                              │
│ IT-1.6.7  │ Paginates results correctly                                     │
│ IT-1.6.8  │ Sorts by due date ascending by default                          │
│ IT-1.6.9  │ Supports custom sort order                                      │
│ IT-1.6.10 │ Returns empty array for org with no deadlines                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex deadlines.upcoming query                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-1.7.1  │ Returns deadlines within specified days                         │
│ IT-1.7.2  │ Excludes completed deadlines                                    │
│ IT-1.7.3  │ Excludes overdue deadlines (optional parameter)                 │
│ IT-1.7.4  │ Sorts by due date ascending                                     │
│ IT-1.7.5  │ Limits results to specified count                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E2E Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Deadline Creation Flow                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-1.1.1 │ User can create a one-time deadline                             │
│ E2E-1.1.2 │ User can create a recurring deadline                            │
│ E2E-1.1.3 │ User can assign deadline to team member                         │
│ E2E-1.1.4 │ User sees success toast after creation                          │
│ E2E-1.1.5 │ New deadline appears in list immediately                        │
│ E2E-1.1.6 │ New deadline appears on calendar                                │
│ E2E-1.1.7 │ Validation errors display for invalid input                     │
│ E2E-1.1.8 │ User can cancel creation and return to list                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Deadline Editing Flow                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-1.2.1 │ User can edit deadline title                                    │
│ E2E-1.2.2 │ User can change due date                                        │
│ E2E-1.2.3 │ User can change category                                        │
│ E2E-1.2.4 │ User can reassign deadline                                      │
│ E2E-1.2.5 │ User can add/modify recurrence                                  │
│ E2E-1.2.6 │ User can remove recurrence                                      │
│ E2E-1.2.7 │ Changes persist after page refresh                              │
│ E2E-1.2.8 │ Completed deadline shows read-only view                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Deadline Completion Flow                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-1.3.1 │ User can complete deadline from list view                       │
│ E2E-1.3.2 │ User can complete deadline from detail view                     │
│ E2E-1.3.3 │ Completed deadline moves to completed section                   │
│ E2E-1.3.4 │ Recurring deadline creates next instance on completion          │
│ E2E-1.3.5 │ Compliance score updates after completion                       │
│ E2E-1.3.6 │ Completion appears in activity feed                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Deadline Deletion Flow                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-1.4.1 │ User can delete deadline with confirmation                      │
│ E2E-1.4.2 │ Deleted deadline appears in trash                               │
│ E2E-1.4.3 │ User can restore deadline from trash                            │
│ E2E-1.4.4 │ Restored deadline reappears in list                             │
│ E2E-1.4.5 │ User can permanently delete from trash (after 30 days)          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Deadline Filtering Flow                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-1.5.1 │ User can filter by status                                       │
│ E2E-1.5.2 │ User can filter by category                                     │
│ E2E-1.5.3 │ User can filter by date range                                   │
│ E2E-1.5.4 │ User can filter by assigned user                                │
│ E2E-1.5.5 │ Multiple filters combine correctly                              │
│ E2E-1.5.6 │ Clear filters resets view                                       │
│ E2E-1.5.7 │ Filter state persists on page navigation                        │
│ E2E-1.5.8 │ URL updates with filter parameters                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec 2: Alert & Notification System

### Unit Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Alert Scheduling Utilities                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-2.1.1  │ calculateAlertTimes returns correct timestamps for default days │
│ UT-2.1.2  │ calculateAlertTimes skips past alert times                      │
│ UT-2.1.3  │ calculateAlertTimes handles custom alert days                   │
│ UT-2.1.4  │ getUrgencyLevel returns 'early' for 14+ days                    │
│ UT-2.1.5  │ getUrgencyLevel returns 'medium' for 7-14 days                  │
│ UT-2.1.6  │ getUrgencyLevel returns 'high' for 1-7 days                     │
│ UT-2.1.7  │ getUrgencyLevel returns 'critical' for 0 days                   │
│ UT-2.1.8  │ getChannelsForUrgency returns correct channels per level        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Email Template Utilities                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-2.2.1  │ generateEmailSubject includes deadline title                    │
│ UT-2.2.2  │ generateEmailSubject includes days until due                    │
│ UT-2.2.3  │ generateEmailSubject uses urgent prefix for critical            │
│ UT-2.2.4  │ generateEmailBody includes action link                          │
│ UT-2.2.5  │ generateEmailBody includes snooze options                       │
│ UT-2.2.6  │ generateEmailBody escapes HTML in user input                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: SMS Message Utilities                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-2.3.1  │ generateSmsMessage is under 160 characters                      │
│ UT-2.3.2  │ generateSmsMessage includes deadline title (truncated if long)  │
│ UT-2.3.3  │ generateSmsMessage includes days until due                      │
│ UT-2.3.4  │ generateSmsMessage uses appropriate emoji for urgency           │
│ UT-2.3.5  │ generateSmsMessage for overdue includes "OVERDUE" prefix        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Phone Number Validation                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-2.4.1  │ isValidUSPhone accepts valid US phone formats                   │
│ UT-2.4.2  │ isValidUSPhone rejects non-US country codes                     │
│ UT-2.4.3  │ isValidUSPhone rejects invalid formats                          │
│ UT-2.4.4  │ normalizePhone converts to E.164 format                         │
│ UT-2.4.5  │ normalizePhone handles various input formats                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### React Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: AlertPreferencesForm component                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-2.5.1  │ Renders channel toggles for each urgency level                  │
│ UT-2.5.2  │ Renders alert days selector                                     │
│ UT-2.5.3  │ Renders phone input when SMS is enabled                         │
│ UT-2.5.4  │ Shows validation error for invalid phone                        │
│ UT-2.5.5  │ Renders escalation settings section                             │
│ UT-2.5.6  │ Disables save button while saving                               │
│ UT-2.5.7  │ Shows success message after save                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: AlertHistory component                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-2.6.1  │ Renders list of sent alerts                                     │
│ UT-2.6.2  │ Shows correct status badge (sent, delivered, failed)            │
│ UT-2.6.3  │ Shows channel icon (email, SMS, in-app)                         │
│ UT-2.6.4  │ Shows timestamp in user's timezone                              │
│ UT-2.6.5  │ Shows retry count for failed alerts                             │
│ UT-2.6.6  │ Supports pagination                                             │
│ UT-2.6.7  │ Supports filtering by channel and status                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: SnoozeDialog component                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-2.7.1  │ Renders snooze duration options (1 day, 3 days, 1 week)         │
│ UT-2.7.2  │ Disables options that would snooze past due date                │
│ UT-2.7.3  │ Shows warning when snoozing close to due date                   │
│ UT-2.7.4  │ Calls onSnooze with selected duration                           │
│ UT-2.7.5  │ Closes dialog on cancel                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex alerts.schedule mutation                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-2.1.1  │ Creates alert records for all configured channels               │
│ IT-2.1.2  │ Sets correct scheduledFor timestamp                             │
│ IT-2.1.3  │ Sets correct urgency level                                      │
│ IT-2.1.4  │ Does not schedule alerts in the past                            │
│ IT-2.1.5  │ Clears existing alerts before rescheduling                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex alerts.processScheduledAlerts action (cron)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-2.2.1  │ Finds alerts due within 15-minute window                        │
│ IT-2.2.2  │ Queues send action for each due alert                           │
│ IT-2.2.3  │ Handles empty result set gracefully                             │
│ IT-2.2.4  │ Does not process already-sent alerts                            │
│ IT-2.2.5  │ Does not process snoozed alerts                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex alerts.sendAlert action                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-2.3.1  │ Sends email via Resend API                                      │
│ IT-2.3.2  │ Sends SMS via Twilio API                                        │
│ IT-2.3.3  │ Creates in-app notification                                     │
│ IT-2.3.4  │ Updates alert status to 'sent'                                  │
│ IT-2.3.5  │ Sets sentAt timestamp                                           │
│ IT-2.3.6  │ Handles email API failure with retry                            │
│ IT-2.3.7  │ Handles SMS API failure with retry                              │
│ IT-2.3.8  │ Uses exponential backoff for retries                            │
│ IT-2.3.9  │ Escalates after max retries exceeded                            │
│ IT-2.3.10 │ Falls back to other channels on failure                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex alerts.acknowledge mutation                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-2.4.1  │ Sets acknowledgedAt timestamp                                   │
│ IT-2.4.2  │ Records acknowledgment source (email, SMS, in-app)              │
│ IT-2.4.3  │ Prevents escalation for acknowledged alerts                     │
│ IT-2.4.4  │ Works with valid acknowledgment token                           │
│ IT-2.4.5  │ Rejects invalid or expired token                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex alerts.snooze mutation                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-2.5.1  │ Sets snoozedUntil timestamp                                     │
│ IT-2.5.2  │ Reschedules alert for snooze end time                           │
│ IT-2.5.3  │ Rejects snooze past due date                                    │
│ IT-2.5.4  │ Logs snooze action to audit log                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex alerts.escalate action                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-2.6.1  │ Sends alert to backup contacts                                  │
│ IT-2.6.2  │ Sends alert to org admin                                        │
│ IT-2.6.3  │ Creates high-priority in-app notification                       │
│ IT-2.6.4  │ Logs escalation to audit log                                    │
│ IT-2.6.5  │ Marks original alert as escalated                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: External Service Integration - Resend                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-2.7.1  │ Sends email with correct from address                           │
│ IT-2.7.2  │ Sends email with correct to address                             │
│ IT-2.7.3  │ Sends email with correct subject                                │
│ IT-2.7.4  │ Sends email with correct HTML body                              │
│ IT-2.7.5  │ Includes correct tags for tracking                              │
│ IT-2.7.6  │ Handles rate limiting gracefully                                │
│ IT-2.7.7  │ Handles invalid email address error                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: External Service Integration - Twilio                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-2.8.1  │ Sends SMS with correct from number                              │
│ IT-2.8.2  │ Sends SMS with correct to number                                │
│ IT-2.8.3  │ Sends SMS with correct message body                             │
│ IT-2.8.4  │ Handles invalid phone number error                              │
│ IT-2.8.5  │ Handles carrier rejection gracefully                            │
│ IT-2.8.6  │ Handles rate limiting gracefully                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E2E Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Alert Preferences Configuration Flow                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-2.1.1 │ User can enable/disable email alerts                            │
│ E2E-2.1.2 │ User can enable/disable SMS alerts                              │
│ E2E-2.1.3 │ User can enter and verify phone number                          │
│ E2E-2.1.4 │ User can customize alert timing                                 │
│ E2E-2.1.5 │ User can configure escalation contacts                          │
│ E2E-2.1.6 │ User can send test alert                                        │
│ E2E-2.1.7 │ Settings persist after page refresh                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Alert Delivery Flow (mocked external services)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-2.2.1 │ Alert appears in notification center when triggered             │
│ E2E-2.2.2 │ Alert shows correct deadline information                        │
│ E2E-2.2.3 │ User can acknowledge alert from notification center             │
│ E2E-2.2.4 │ User can snooze alert from notification center                  │
│ E2E-2.2.5 │ Alert history shows delivery status                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Alert Acknowledgment Flow                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-2.3.1 │ Clicking link in email marks alert acknowledged                 │
│ E2E-2.3.2 │ Clicking "Got it" in-app marks alert acknowledged               │
│ E2E-2.3.3 │ Acknowledged alert shows in history with correct status         │
│ E2E-2.3.4 │ Acknowledgment prevents further alerts for same deadline        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Alert Snooze Flow                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-2.4.1 │ User can snooze alert for 1 day                                 │
│ E2E-2.4.2 │ User can snooze alert for 3 days                                │
│ E2E-2.4.3 │ User can snooze alert for 1 week                                │
│ E2E-2.4.4 │ Snooze option disabled when would pass due date                 │
│ E2E-2.4.5 │ Alert reappears after snooze period                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec 3: Document Vault

### Unit Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: File Type Utilities                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-3.1.1  │ getFileType correctly identifies PDF                            │
│ UT-3.1.2  │ getFileType correctly identifies DOCX                           │
│ UT-3.1.3  │ getFileType correctly identifies XLSX                           │
│ UT-3.1.4  │ getFileType correctly identifies images (JPG, PNG)              │
│ UT-3.1.5  │ getFileType handles unknown extensions                          │
│ UT-3.1.6  │ isAllowedFileType accepts allowed types                         │
│ UT-3.1.7  │ isAllowedFileType rejects disallowed types                      │
│ UT-3.1.8  │ formatFileSize formats bytes correctly                          │
│ UT-3.1.9  │ formatFileSize formats KB correctly                             │
│ UT-3.1.10 │ formatFileSize formats MB correctly                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Search Query Utilities                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-3.2.1  │ normalizeSearchQuery removes extra whitespace                   │
│ UT-3.2.2  │ normalizeSearchQuery lowercases input                           │
│ UT-3.2.3  │ normalizeSearchQuery removes special characters                 │
│ UT-3.2.4  │ tokenizeQuery splits on spaces                                  │
│ UT-3.2.5  │ tokenizeQuery handles quoted phrases                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Version Comparison Utilities                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-3.3.1  │ isNewerVersion returns true for newer version                   │
│ UT-3.3.2  │ isNewerVersion returns false for same version                   │
│ UT-3.3.3  │ isNewerVersion returns false for older version                  │
│ UT-3.3.4  │ getVersionLabel generates correct label (v1, v2, etc.)          │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### React Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: DocumentUploader component                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-3.4.1  │ Renders dropzone area                                           │
│ UT-3.4.2  │ Accepts drag and drop files                                     │
│ UT-3.4.3  │ Accepts file selection via button                               │
│ UT-3.4.4  │ Shows file preview after selection                              │
│ UT-3.4.5  │ Shows upload progress bar                                       │
│ UT-3.4.6  │ Rejects files exceeding size limit (50MB)                       │
│ UT-3.4.7  │ Rejects disallowed file types                                   │
│ UT-3.4.8  │ Allows category selection                                       │
│ UT-3.4.9  │ Allows deadline linking                                         │
│ UT-3.4.10 │ Shows success message after upload                              │
│ UT-3.4.11 │ Shows error message on upload failure                           │
│ UT-3.4.12 │ Supports multiple file upload                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: DocumentCard component                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-3.5.1  │ Renders file name                                               │
│ UT-3.5.2  │ Renders file type icon                                          │
│ UT-3.5.3  │ Renders file size                                               │
│ UT-3.5.4  │ Renders category badge                                          │
│ UT-3.5.5  │ Renders upload date                                             │
│ UT-3.5.6  │ Renders version indicator for versioned docs                    │
│ UT-3.5.7  │ Shows "Search limited" badge when OCR failed                    │
│ UT-3.5.8  │ Shows dropdown menu with actions                                │
│ UT-3.5.9  │ Download action triggers file download                          │
│ UT-3.5.10 │ Delete action shows confirmation dialog                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: DocumentPreview component                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-3.6.1  │ Renders PDF viewer for PDF files                                │
│ UT-3.6.2  │ Renders image viewer for image files                            │
│ UT-3.6.3  │ Shows "Preview not available" for unsupported types             │
│ UT-3.6.4  │ Shows loading state while fetching                              │
│ UT-3.6.5  │ Shows error state on fetch failure                              │
│ UT-3.6.6  │ Supports zoom in/out for images                                 │
│ UT-3.6.7  │ Supports page navigation for PDFs                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: DocumentSearch component                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-3.7.1  │ Renders search input                                            │
│ UT-3.7.2  │ Debounces search input                                          │
│ UT-3.7.3  │ Shows search results dropdown                                   │
│ UT-3.7.4  │ Shows "No results" message when empty                           │
│ UT-3.7.5  │ Highlights matching text in results                             │
│ UT-3.7.6  │ Supports keyboard navigation                                    │
│ UT-3.7.7  │ Clears search on escape key                                     │
│ UT-3.7.8  │ Renders advanced filter options                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: DocumentVersionHistory component                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-3.8.1  │ Renders list of versions                                        │
│ UT-3.8.2  │ Shows version number and upload date                            │
│ UT-3.8.3  │ Shows uploader name                                             │
│ UT-3.8.4  │ Allows viewing previous versions                                │
│ UT-3.8.5  │ Allows downloading previous versions                            │
│ UT-3.8.6  │ Allows restoring previous version                               │
│ UT-3.8.7  │ Highlights current version                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex documents.generateUploadUrl mutation                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-3.1.1  │ Returns valid upload URL                                        │
│ IT-3.1.2  │ Rejects for unauthorized user                                   │
│ IT-3.1.3  │ Checks storage limit before generating URL                      │
│ IT-3.1.4  │ Returns error when storage limit exceeded                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex documents.save mutation                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-3.2.1  │ Creates document record with correct data                       │
│ IT-3.2.2  │ Sets uploadedAt timestamp                                       │
│ IT-3.2.3  │ Sets uploadedBy to current user                                 │
│ IT-3.2.4  │ Links document to deadline(s) if provided                       │
│ IT-3.2.5  │ Creates new version for duplicate filename                      │
│ IT-3.2.6  │ Triggers OCR extraction action                                  │
│ IT-3.2.7  │ Updates storage usage counter                                   │
│ IT-3.2.8  │ Logs upload action to audit log                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex documents.extractText action                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-3.3.1  │ Extracts text from text-based PDF                               │
│ IT-3.3.2  │ Uses Claude Vision for scanned PDF                              │
│ IT-3.3.3  │ Uses Claude Vision for images                                   │
│ IT-3.3.4  │ Extracts text from DOCX                                         │
│ IT-3.3.5  │ Stores extracted text in document record                        │
│ IT-3.3.6  │ Handles OCR failure gracefully                                  │
│ IT-3.3.7  │ Truncates text to max length                                    │
│ IT-3.3.8  │ Indexes document for search after extraction                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex documents.search query                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-3.4.1  │ Returns documents matching search term                          │
│ IT-3.4.2  │ Searches in extracted text                                      │
│ IT-3.4.3  │ Searches in filename                                            │
│ IT-3.4.4  │ Filters by category when specified                              │
│ IT-3.4.5  │ Filters by deadline when specified                              │
│ IT-3.4.6  │ Filters by date range when specified                            │
│ IT-3.4.7  │ Excludes soft-deleted documents                                 │
│ IT-3.4.8  │ Returns only org's documents                                    │
│ IT-3.4.9  │ Handles empty search query                                      │
│ IT-3.4.10 │ Limits results appropriately                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex documents.getVersionHistory query                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-3.5.1  │ Returns all versions of document                                │
│ IT-3.5.2  │ Orders by version number descending                             │
│ IT-3.5.3  │ Includes uploader information                                   │
│ IT-3.5.4  │ Returns only accessible versions                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex documents.softDelete mutation                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-3.6.1  │ Sets deletedAt timestamp                                        │
│ IT-3.6.2  │ Document excluded from list queries                             │
│ IT-3.6.3  │ Document appears in trash                                       │
│ IT-3.6.4  │ Preserves links to deadlines (marked as deleted)                │
│ IT-3.6.5  │ Logs delete action                                              │
│ IT-3.6.6  │ Updates storage usage counter                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex documents.generateAuditExport action                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-3.7.1  │ Creates ZIP file with correct structure                         │
│ IT-3.7.2  │ Includes all matching documents                                 │
│ IT-3.7.3  │ Organizes by category                                           │
│ IT-3.7.4  │ Includes cover sheet                                            │
│ IT-3.7.5  │ Includes table of contents                                      │
│ IT-3.7.6  │ Stores ZIP in file storage                                      │
│ IT-3.7.7  │ Returns download URL                                            │
│ IT-3.7.8  │ Handles large document sets asynchronously                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Document Access Logging                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-3.8.1  │ Logs view action when document viewed                           │
│ IT-3.8.2  │ Logs download action when document downloaded                   │
│ IT-3.8.3  │ Logs include user ID and timestamp                              │
│ IT-3.8.4  │ Access log is queryable by document                             │
│ IT-3.8.5  │ Access log is queryable by user                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E2E Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Document Upload Flow                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-3.1.1 │ User can upload document via drag and drop                      │
│ E2E-3.1.2 │ User can upload document via file picker                        │
│ E2E-3.1.3 │ User can upload multiple documents at once                      │
│ E2E-3.1.4 │ User can select category during upload                          │
│ E2E-3.1.5 │ User can link document to deadline during upload                │
│ E2E-3.1.6 │ Upload progress is visible                                      │
│ E2E-3.1.7 │ Uploaded document appears in list                               │
│ E2E-3.1.8 │ Upload fails gracefully with oversized file                     │
│ E2E-3.1.9 │ Upload fails gracefully with disallowed file type               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Document Search Flow                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-3.2.1 │ User can search documents by filename                           │
│ E2E-3.2.2 │ User can search documents by content                            │
│ E2E-3.2.3 │ User can filter by category                                     │
│ E2E-3.2.4 │ User can filter by date range                                   │
│ E2E-3.2.5 │ User can filter by linked deadline                              │
│ E2E-3.2.6 │ Search results update as user types                             │
│ E2E-3.2.7 │ Clicking result opens document                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Document Preview Flow                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-3.3.1 │ User can preview PDF documents                                  │
│ E2E-3.3.2 │ User can preview image documents                                │
│ E2E-3.3.3 │ User can navigate PDF pages                                     │
│ E2E-3.3.4 │ User can zoom in/out on images                                  │
│ E2E-3.3.5 │ User can download from preview                                  │
│ E2E-3.3.6 │ Preview shows document metadata                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Document Version Flow                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-3.4.1 │ Uploading same filename creates new version                     │
│ E2E-3.4.2 │ User can view version history                                   │
│ E2E-3.4.3 │ User can preview previous versions                              │
│ E2E-3.4.4 │ User can download previous versions                             │
│ E2E-3.4.5 │ User can restore previous version                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Audit Export Flow                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-3.5.1 │ User can select compliance area for export                      │
│ E2E-3.5.2 │ User can select date range for export                           │
│ E2E-3.5.3 │ Export generates downloadable ZIP                               │
│ E2E-3.5.4 │ ZIP contains organized folder structure                         │
│ E2E-3.5.5 │ ZIP contains cover sheet and TOC                                │
│ E2E-3.5.6 │ Large exports show progress indicator                           │
│ E2E-3.5.7 │ User receives email when large export ready                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec 4: AI Form Pre-fill

### Unit Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Field Extraction Utilities                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-4.1.1  │ extractFormFields identifies text fields in PDF                 │
│ UT-4.1.2  │ extractFormFields identifies checkboxes in PDF                  │
│ UT-4.1.3  │ extractFormFields identifies dropdowns in PDF                   │
│ UT-4.1.4  │ extractFormFields identifies radio buttons in PDF               │
│ UT-4.1.5  │ extractFormFields identifies signature blocks                   │
│ UT-4.1.6  │ extractFormFields handles flattened PDFs                        │
│ UT-4.1.7  │ extractFormFields returns field positions                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Field Mapping Utilities                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-4.2.1  │ matchFieldToProfile maps "Business Name" to legalName           │
│ UT-4.2.2  │ matchFieldToProfile maps "Company" to legalName                 │
│ UT-4.2.3  │ matchFieldToProfile maps "EIN" to ein                           │
│ UT-4.2.4  │ matchFieldToProfile maps "Tax ID" to ein                        │
│ UT-4.2.5  │ matchFieldToProfile maps address fields correctly               │
│ UT-4.2.6  │ matchFieldToProfile handles nested profile paths                │
│ UT-4.2.7  │ matchFieldToProfile returns null for unknown fields             │
│ UT-4.2.8  │ getNestedValue retrieves nested profile values                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Confidence Scoring Utilities                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-4.3.1  │ getConfidenceCategory returns 'green' for ≥85%                  │
│ UT-4.3.2  │ getConfidenceCategory returns 'yellow' for 50-84%               │
│ UT-4.3.3  │ getConfidenceCategory returns 'red' for <50%                    │
│ UT-4.3.4  │ calculateOverallConfidence averages field confidences           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: PDF Manipulation Utilities                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-4.4.1  │ isPdfPasswordProtected detects protected PDFs                   │
│ UT-4.4.2  │ unlockPdf unlocks with correct password                         │
│ UT-4.4.3  │ unlockPdf throws error with incorrect password                  │
│ UT-4.4.4  │ fillPdfField sets text field value                              │
│ UT-4.4.5  │ fillPdfField checks checkbox                                    │
│ UT-4.4.6  │ fillPdfField selects dropdown option                            │
│ UT-4.4.7  │ fillPdfField selects radio option                               │
│ UT-4.4.8  │ fillPdfField handles missing field gracefully                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### React Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: FormAnalysisPreview component                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-4.5.1  │ Renders detected fields list                                    │
│ UT-4.5.2  │ Shows green highlight for high-confidence fields                │
│ UT-4.5.3  │ Shows yellow highlight for medium-confidence fields             │
│ UT-4.5.4  │ Shows red highlight for low-confidence fields                   │
│ UT-4.5.5  │ Shows proposed value for each field                             │
│ UT-4.5.6  │ Shows field count summary by confidence                         │
│ UT-4.5.7  │ Renders loading state during analysis                           │
│ UT-4.5.8  │ Renders error state on analysis failure                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: FieldMappingEditor component                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-4.6.1  │ Renders all detected fields                                     │
│ UT-4.6.2  │ Shows current mapping for each field                            │
│ UT-4.6.3  │ Allows changing field mapping                                   │
│ UT-4.6.4  │ Allows manual value override                                    │
│ UT-4.6.5  │ Allows marking field to skip                                    │
│ UT-4.6.6  │ Shows option to save value to profile                           │
│ UT-4.6.7  │ Validates manual input                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: OrgProfileForm component                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-4.7.1  │ Renders all profile sections                                    │
│ UT-4.7.2  │ Pre-fills existing profile data                                 │
│ UT-4.7.3  │ Allows adding multiple addresses                                │
│ UT-4.7.4  │ Allows adding multiple phone numbers                            │
│ UT-4.7.5  │ Allows adding multiple license numbers                          │
│ UT-4.7.6  │ Validates EIN format                                            │
│ UT-4.7.7  │ Validates phone number format                                   │
│ UT-4.7.8  │ Supports custom fields                                          │
│ UT-4.7.9  │ Shows save confirmation                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: FormFillReview component                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-4.8.1  │ Shows preview of filled form                                    │
│ UT-4.8.2  │ Highlights filled fields                                        │
│ UT-4.8.3  │ Shows list of values that will be filled                        │
│ UT-4.8.4  │ Shows warning for signature fields                              │
│ UT-4.8.5  │ Allows returning to edit                                        │
│ UT-4.8.6  │ Generates and downloads filled PDF on confirm                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex forms.analyzeForm action                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-4.1.1  │ Fetches form from storage                                       │
│ IT-4.1.2  │ Extracts form field structure                                   │
│ IT-4.1.3  │ Calls Claude API for field analysis                             │
│ IT-4.1.4  │ Returns field analysis with semantics                           │
│ IT-4.1.5  │ Matches fields to org profile                                   │
│ IT-4.1.6  │ Returns unmatched fields list                                   │
│ IT-4.1.7  │ Handles non-English forms with warning                          │
│ IT-4.1.8  │ Handles password-protected PDF with prompt                      │
│ IT-4.1.9  │ Respects rate limit per organization                            │
│ IT-4.1.10 │ Returns error for unsupported file type                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex forms.fillFromTemplate action                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-4.2.1  │ Retrieves template with mappings                                │
│ IT-4.2.2  │ Retrieves org profile data                                      │
│ IT-4.2.3  │ Applies overrides to mapped values                              │
│ IT-4.2.4  │ Generates filled PDF                                            │
│ IT-4.2.5  │ Stores filled PDF in storage                                    │
│ IT-4.2.6  │ Records fill in form_fills table                                │
│ IT-4.2.7  │ Increments template usage count                                 │
│ IT-4.2.8  │ Returns download URL                                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex profiles.update mutation                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-4.3.1  │ Updates profile with valid data                                 │
│ IT-4.3.2  │ Validates EIN format                                            │
│ IT-4.3.3  │ Validates phone number format                                   │
│ IT-4.3.4  │ Encrypts sensitive fields (EIN)                                 │
│ IT-4.3.5  │ Logs profile update to audit log                                │
│ IT-4.3.6  │ Rejects update for unauthorized user                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex templates.save mutation                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-4.4.1  │ Creates template with correct data                              │
│ IT-4.4.2  │ Stores original form in storage                                 │
│ IT-4.4.3  │ Saves field mappings                                            │
│ IT-4.4.4  │ Sets initial usage count to 0                                   │
│ IT-4.4.5  │ Links to industry if specified                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Claude API Integration                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-4.5.1  │ Sends form content to Claude API                                │
│ IT-4.5.2  │ Receives structured field analysis                              │
│ IT-4.5.3  │ Handles API rate limiting                                       │
│ IT-4.5.4  │ Handles API timeout gracefully                                  │
│ IT-4.5.5  │ Handles API error gracefully                                    │
│ IT-4.5.6  │ Parses JSON response correctly                                  │
│ IT-4.5.7  │ Validates response structure                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E2E Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Form Upload & Analysis Flow                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-4.1.1 │ User can upload blank form                                      │
│ E2E-4.1.2 │ System shows analysis in progress                               │
│ E2E-4.1.3 │ System displays detected fields                                 │
│ E2E-4.1.4 │ Fields show confidence indicators                               │
│ E2E-4.1.5 │ Fields show proposed values from profile                        │
│ E2E-4.1.6 │ Non-English form shows warning                                  │
│ E2E-4.1.7 │ Password-protected PDF prompts for password                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Field Mapping Editing Flow                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-4.2.1 │ User can accept proposed value                                  │
│ E2E-4.2.2 │ User can override proposed value                                │
│ E2E-4.2.3 │ User can change field mapping                                   │
│ E2E-4.2.4 │ User can mark field to skip                                     │
│ E2E-4.2.5 │ User can save new value to profile                              │
│ E2E-4.2.6 │ Changes persist between steps                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Form Fill & Download Flow                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-4.3.1 │ User can preview filled form                                    │
│ E2E-4.3.2 │ User can download filled PDF                                    │
│ E2E-4.3.3 │ Downloaded PDF contains filled values                           │
│ E2E-4.3.4 │ Signature fields are left blank                                 │
│ E2E-4.3.5 │ Fill is recorded in history                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Template Reuse Flow                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-4.4.1 │ User can save form as template                                  │
│ E2E-4.4.2 │ User can select saved template                                  │
│ E2E-4.4.3 │ Template applies saved mappings                                 │
│ E2E-4.4.4 │ User can edit mappings for template fill                        │
│ E2E-4.4.5 │ Template usage count increments                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Organization Profile Flow                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-4.5.1 │ User can view organization profile                              │
│ E2E-4.5.2 │ User can edit organization profile                              │
│ E2E-4.5.3 │ User can add multiple addresses                                 │
│ E2E-4.5.4 │ User can add multiple license numbers                           │
│ E2E-4.5.5 │ Profile changes reflect in next form fill                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec 5: Industry Templates

### Unit Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Template Data Utilities                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-5.1.1  │ calculateDefaultDueDate for fixed_date anchor                   │
│ UT-5.1.2  │ calculateDefaultDueDate for anniversary anchor                  │
│ UT-5.1.3  │ calculateDefaultDueDate for custom anchor                       │
│ UT-5.1.4  │ getTemplatesByIndustry filters correctly                        │
│ UT-5.1.5  │ compareVersions detects newer version                           │
│ UT-5.1.6  │ compareVersions detects same version                            │
│ UT-5.1.7  │ getChangesBetweenVersions returns diff                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Template Validation                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-5.2.1  │ validateTemplate accepts valid template                         │
│ UT-5.2.2  │ validateTemplate rejects missing required fields                │
│ UT-5.2.3  │ validateTemplate rejects invalid recurrence                     │
│ UT-5.2.4  │ validateTemplate rejects invalid anchor type                    │
│ UT-5.2.5  │ validateTemplateDeadline validates each deadline                │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### React Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: TemplateCard component                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-5.3.1  │ Renders template name                                           │
│ UT-5.3.2  │ Renders industry badge                                          │
│ UT-5.3.3  │ Renders deadline count                                          │
│ UT-5.3.4  │ Renders description                                             │
│ UT-5.3.5  │ Shows "Community" badge for community templates                 │
│ UT-5.3.6  │ Shows rating for community templates                            │
│ UT-5.3.7  │ Click navigates to detail view                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: TemplateImportWizard component                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-5.4.1  │ Step 1: Shows template overview                                 │
│ UT-5.4.2  │ Step 2: Shows deadline selection list                           │
│ UT-5.4.3  │ Step 2: All deadlines selected by default                       │
│ UT-5.4.4  │ Step 2: User can deselect deadlines                             │
│ UT-5.4.5  │ Step 3: Shows date customization for selected deadlines         │
│ UT-5.4.6  │ Step 3: Pre-fills default dates where applicable                │
│ UT-5.4.7  │ Step 4: Shows summary of import                                 │
│ UT-5.4.8  │ Detects conflicts with existing deadlines                       │
│ UT-5.4.9  │ Shows conflict resolution options                               │
│ UT-5.4.10 │ Completes import and shows success                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: DateCustomizer component                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-5.5.1  │ Renders date picker for each deadline                           │
│ UT-5.5.2  │ Shows deadline title and description                            │
│ UT-5.5.3  │ Shows default date hint when available                          │
│ UT-5.5.4  │ Validates date input                                            │
│ UT-5.5.5  │ Calculates related dates when anchor date set                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex templates.list query                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-5.1.1  │ Returns all active templates                                    │
│ IT-5.1.2  │ Filters by industry                                             │
│ IT-5.1.3  │ Includes system templates                                       │
│ IT-5.1.4  │ Includes org's custom templates                                 │
│ IT-5.1.5  │ Excludes inactive templates                                     │
│ IT-5.1.6  │ Sorts by usage count (popular first)                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex templates.import mutation                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-5.2.1  │ Creates deadline for each selected template item                │
│ IT-5.2.2  │ Uses custom dates provided                                      │
│ IT-5.2.3  │ Calculates default dates for unspecified items                  │
│ IT-5.2.4  │ Skips existing deadlines (conflict: skip)                       │
│ IT-5.2.5  │ Updates existing deadlines (conflict: merge)                    │
│ IT-5.2.6  │ Creates duplicate (conflict: duplicate)                         │
│ IT-5.2.7  │ Records import in template_imports table                        │
│ IT-5.2.8  │ Schedules alerts for imported deadlines                         │
│ IT-5.2.9  │ Marks onboarding step complete                                  │
│ IT-5.2.10 │ Returns list of created deadline IDs                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex templates.checkForUpdates query                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-5.3.1  │ Finds imports where template version changed                    │
│ IT-5.3.2  │ Returns change details                                          │
│ IT-5.3.3  │ Excludes already-notified updates                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Template Version Notification Cron                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-5.4.1  │ Sends notification for updated templates                        │
│ IT-5.4.2  │ Creates in-app notification                                     │
│ IT-5.4.3  │ Sends email notification                                        │
│ IT-5.4.4  │ Updates lastNotifiedVersion                                     │
│ IT-5.4.5  │ Does not notify for same version                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E2E Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Template Browse Flow                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-5.1.1 │ User can view template library                                  │
│ E2E-5.1.2 │ User can filter by industry                                     │
│ E2E-5.1.3 │ User can view template details                                  │
│ E2E-5.1.4 │ User can see deadline list in template                          │
│ E2E-5.1.5 │ User can see regulatory references                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Template Import Flow                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-5.2.1 │ User can start import wizard                                    │
│ E2E-5.2.2 │ User can select/deselect deadlines                              │
│ E2E-5.2.3 │ User can customize due dates                                    │
│ E2E-5.2.4 │ User sees conflict warnings                                     │
│ E2E-5.2.5 │ User can resolve conflicts                                      │
│ E2E-5.2.6 │ Import completes successfully                                   │
│ E2E-5.2.7 │ Imported deadlines appear in list                               │
│ E2E-5.2.8 │ Imported deadlines appear on calendar                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Template Update Flow                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-5.3.1 │ User sees notification for template update                      │
│ E2E-5.3.2 │ User can view changelog                                         │
│ E2E-5.3.3 │ User can dismiss notification                                   │
│ E2E-5.3.4 │ User can add new requirements from update                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec 6: Dashboard & Overview

### Unit Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Compliance Score Calculation                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-6.1.1  │ Returns 100 for org with no deadlines                           │
│ UT-6.1.2  │ Returns 100 for org with all completed deadlines                │
│ UT-6.1.3  │ Deducts 5 points per overdue deadline                           │
│ UT-6.1.4  │ Deducts 3 points per deadline due within 7 days                 │
│ UT-6.1.5  │ Deducts 1 point per deadline due within 30 days                 │
│ UT-6.1.6  │ Adds 1 point per on-time completion (last 30 days)              │
│ UT-6.1.7  │ Clamps score between 0 and 100                                  │
│ UT-6.1.8  │ Excludes deleted deadlines from calculation                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Dashboard Data Aggregation                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-6.2.1  │ categorizeDeadlines groups by status correctly                  │
│ UT-6.2.2  │ groupByCategory returns correct counts                          │
│ UT-6.2.3  │ getRecentActivity returns last N activities                     │
│ UT-6.2.4  │ getStats calculates correct totals                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### React Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: ComplianceScoreCard component                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-6.3.1  │ Renders score percentage                                        │
│ UT-6.3.2  │ Renders circular progress indicator                             │
│ UT-6.3.3  │ Shows green color for score ≥80                                 │
│ UT-6.3.4  │ Shows yellow color for score 60-79                              │
│ UT-6.3.5  │ Shows red color for score <60                                   │
│ UT-6.3.6  │ Shows "Healthy" label for green                                 │
│ UT-6.3.7  │ Shows "Needs Attention" label for yellow                        │
│ UT-6.3.8  │ Shows "At Risk" label for red                                   │
│ UT-6.3.9  │ Animates score change                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: CriticalAlertsSection component                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-6.4.1  │ Renders overdue deadlines                                       │
│ UT-6.4.2  │ Renders deadlines due today                                     │
│ UT-6.4.3  │ Shows days overdue for each item                                │
│ UT-6.4.4  │ Shows red background/border                                     │
│ UT-6.4.5  │ Shows quick-complete button                                     │
│ UT-6.4.6  │ Does not render when no critical items                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: DueThisWeekSection component                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-6.5.1  │ Renders deadlines due within 7 days                             │
│ UT-6.5.2  │ Excludes overdue deadlines                                      │
│ UT-6.5.3  │ Shows yellow/amber styling                                      │
│ UT-6.5.4  │ Sorts by due date ascending                                     │
│ UT-6.5.5  │ Shows "View all" link when >5 items                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: QuickStatsBar component                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-6.6.1  │ Renders total active deadlines                                  │
│ UT-6.6.2  │ Renders completed this month count                              │
│ UT-6.6.3  │ Renders documents stored count                                  │
│ UT-6.6.4  │ Renders on-time rate percentage                                 │
│ UT-6.6.5  │ Each stat card is clickable (navigates to detail)               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: RecentActivityFeed component                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-6.7.1  │ Renders list of recent activities                               │
│ UT-6.7.2  │ Shows user avatar for each activity                             │
│ UT-6.7.3  │ Shows activity type icon                                        │
│ UT-6.7.4  │ Shows relative timestamp                                        │
│ UT-6.7.5  │ Shows activity description                                      │
│ UT-6.7.6  │ Updates in real-time                                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: CategoryBreakdownChart component                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-6.8.1  │ Renders pie/donut chart                                         │
│ UT-6.8.2  │ Shows correct colors per category                               │
│ UT-6.8.3  │ Shows legend with category names                                │
│ UT-6.8.4  │ Shows counts in legend                                          │
│ UT-6.8.5  │ Handles empty data gracefully                                   │
│ UT-6.8.6  │ Clicking segment filters list                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex dashboard.getData query                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-6.1.1  │ Returns compliance score                                        │
│ IT-6.1.2  │ Returns overdue deadlines                                       │
│ IT-6.1.3  │ Returns deadlines due today                                     │
│ IT-6.1.4  │ Returns deadlines due this week                                 │
│ IT-6.1.5  │ Returns upcoming deadlines (30 days)                            │
│ IT-6.1.6  │ Returns quick stats                                             │
│ IT-6.1.7  │ Returns category breakdown                                      │
│ IT-6.1.8  │ Returns recent activity                                         │
│ IT-6.1.9  │ Excludes data from other orgs                                   │
│ IT-6.1.10 │ Respects user's role for filtering                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Dashboard Real-time Updates                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-6.2.1  │ Updates when deadline is created                                │
│ IT-6.2.2  │ Updates when deadline is completed                              │
│ IT-6.2.3  │ Updates when deadline is deleted                                │
│ IT-6.2.4  │ Updates when document is uploaded                               │
│ IT-6.2.5  │ Updates activity feed in real-time                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E2E Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Dashboard View Flow                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-6.1.1 │ Dashboard loads after login                                     │
│ E2E-6.1.2 │ Compliance score displays correctly                             │
│ E2E-6.1.3 │ Critical section shows overdue items                            │
│ E2E-6.1.4 │ Due this week section shows upcoming items                      │
│ E2E-6.1.5 │ Stats bar shows correct counts                                  │
│ E2E-6.1.6 │ Activity feed shows recent actions                              │
│ E2E-6.1.7 │ Category chart renders correctly                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Dashboard Interaction Flow                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-6.2.1 │ Clicking deadline card opens detail                             │
│ E2E-6.2.2 │ Quick complete works from dashboard                             │
│ E2E-6.2.3 │ Score updates after completing deadline                         │
│ E2E-6.2.4 │ Clicking stat navigates to relevant page                        │
│ E2E-6.2.5 │ Clicking activity navigates to relevant item                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Dashboard View Modes                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-6.3.1 │ User can switch to "My items" view                              │
│ E2E-6.3.2 │ "My items" shows only assigned deadlines                        │
│ E2E-6.3.3 │ User can switch to "Team" view                                  │
│ E2E-6.3.4 │ "Team" shows all org deadlines                                  │
│ E2E-6.3.5 │ View preference persists                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Dashboard Responsive Behavior                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-6.4.1 │ Dashboard renders correctly on mobile                           │
│ E2E-6.4.2 │ Stats collapse to 2 columns on tablet                           │
│ E2E-6.4.3 │ Stats collapse to 1 column on mobile                            │
│ E2E-6.4.4 │ Chart is hidden on mobile                                       │
│ E2E-6.4.5 │ Critical section is always visible                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec 7: Calendar View

### Unit Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Calendar Utilities                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-7.1.1  │ getWeeksInMonth returns correct weeks                           │
│ UT-7.1.2  │ getWeeksInMonth handles month boundaries                        │
│ UT-7.1.3  │ getDeadlinesForDate filters correctly                           │
│ UT-7.1.4  │ getStatusColor returns correct color for each status            │
│ UT-7.1.5  │ toCalendarEvent converts deadline to event format               │
│ UT-7.1.6  │ generateRecurringDisplayItems creates future instances          │
│ UT-7.1.7  │ generateRecurringDisplayItems limits to 3 instances             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: iCal Generation                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-7.2.1  │ generateICal creates valid iCal format                          │
│ UT-7.2.2  │ generateICal includes all non-completed deadlines               │
│ UT-7.2.3  │ generateICal sets correct DTSTART                               │
│ UT-7.2.4  │ generateICal includes alarms                                    │
│ UT-7.2.5  │ generateICal escapes special characters                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### React Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: CalendarFilters component                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-7.3.1  │ Renders category filter                                         │
│ UT-7.3.2  │ Renders assigned user filter                                    │
│ UT-7.3.3  │ Renders show/hide completed toggle                              │
│ UT-7.3.4  │ Filters emit correct filter object                              │
│ UT-7.3.5  │ Clear all resets filters                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: DeadlineQuickView component                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-7.4.1  │ Renders deadline title                                          │
│ UT-7.4.2  │ Renders status badge                                            │
│ UT-7.4.3  │ Renders due date                                                │
│ UT-7.4.4  │ Renders category                                                │
│ UT-7.4.5  │ Renders assigned user                                           │
│ UT-7.4.6  │ Renders linked documents                                        │
│ UT-7.4.7  │ Renders "Mark Complete" button                                  │
│ UT-7.4.8  │ Renders "Edit" button                                           │
│ UT-7.4.9  │ Closes on outside click                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: DayDetailModal component                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-7.5.1  │ Renders all deadlines for selected date                         │
│ UT-7.5.2  │ Shows date in header                                            │
│ UT-7.5.3  │ Supports scrolling for many deadlines                           │
│ UT-7.5.4  │ Clicking deadline opens quick view                              │
│ UT-7.5.5  │ Shows "Add deadline" button                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: CalendarExportMenu component                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-7.6.1  │ Renders export options                                          │
│ UT-7.6.2  │ Export iCal downloads .ics file                                 │
│ UT-7.6.3  │ Subscribe shows feed URL                                        │
│ UT-7.6.4  │ Copy URL copies to clipboard                                    │
│ UT-7.6.5  │ Print opens print-friendly view                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex deadlines.listForCalendar query                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-7.1.1  │ Returns deadlines within date range                             │
│ IT-7.1.2  │ Includes completed deadlines when filter enabled                │
│ IT-7.1.3  │ Excludes completed when filter disabled                         │
│ IT-7.1.4  │ Filters by category                                             │
│ IT-7.1.5  │ Filters by assigned user                                        │
│ IT-7.1.6  │ Returns only org's deadlines                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex calendar.generateFeed action                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-7.2.1  │ Generates valid iCal content                                    │
│ IT-7.2.2  │ Includes all active deadlines                                   │
│ IT-7.2.3  │ Includes VALARM components                                      │
│ IT-7.2.4  │ Uses correct timezone                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: iCal Feed API Route                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-7.3.1  │ Returns iCal content with correct Content-Type                  │
│ IT-7.3.2  │ Validates API key                                               │
│ IT-7.3.3  │ Returns 401 for invalid API key                                 │
│ IT-7.3.4  │ Returns 404 for non-existent org                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Deadline Drag & Drop                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-7.4.1  │ Updates deadline due date on drop                               │
│ IT-7.4.2  │ Reschedules alerts after move                                   │
│ IT-7.4.3  │ Logs reschedule action                                          │
│ IT-7.4.4  │ Rejects move for completed deadline                             │
│ IT-7.4.5  │ Rejects move for view-only user                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E2E Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Calendar View Flow                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-7.1.1 │ Calendar renders with deadlines                                 │
│ E2E-7.1.2 │ User can navigate between months                                │
│ E2E-7.1.3 │ User can switch to week view                                    │
│ E2E-7.1.4 │ User can switch to agenda view                                  │
│ E2E-7.1.5 │ Deadlines show correct status colors                            │
│ E2E-7.1.6 │ Clicking "Today" returns to current date                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Calendar Interaction Flow                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-7.2.1 │ Clicking deadline opens quick view                              │
│ E2E-7.2.2 │ Quick view shows deadline details                               │
│ E2E-7.2.3 │ User can complete from quick view                               │
│ E2E-7.2.4 │ User can navigate to edit from quick view                       │
│ E2E-7.2.5 │ Clicking date with many deadlines opens modal                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Calendar Drag & Drop Flow                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-7.3.1 │ User can drag deadline to new date                              │
│ E2E-7.3.2 │ Confirmation dialog appears                                     │
│ E2E-7.3.3 │ Confirming updates the deadline                                 │
│ E2E-7.3.4 │ Canceling reverts the move                                      │
│ E2E-7.3.5 │ Completed deadline cannot be dragged                            │
│ E2E-7.3.6 │ Tooltip explains why when dragging completed                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Calendar Filter Flow                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-7.4.1 │ User can filter by category                                     │
│ E2E-7.4.2 │ User can filter by assigned user                                │
│ E2E-7.4.3 │ User can show/hide completed                                    │
│ E2E-7.4.4 │ Filters update calendar view immediately                        │
│ E2E-7.4.5 │ Clear filters resets view                                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Calendar Export Flow                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-7.5.1 │ User can download iCal file                                     │
│ E2E-7.5.2 │ Downloaded file is valid iCal                                   │
│ E2E-7.5.3 │ User can copy subscribe URL                                     │
│ E2E-7.5.4 │ User can print calendar view                                    │
│ E2E-7.5.5 │ Print view is properly formatted                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec 8: Organization & Team Management

### Unit Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Permission Utilities                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-8.1.1  │ hasPermission returns true for owner on any action              │
│ UT-8.1.2  │ hasPermission returns true for admin on allowed actions         │
│ UT-8.1.3  │ hasPermission returns true for manager on allowed actions       │
│ UT-8.1.4  │ hasPermission returns true for member:own actions               │
│ UT-8.1.5  │ hasPermission returns false for viewer on write actions         │
│ UT-8.1.6  │ hasPermission handles category wildcards (deadlines:*)          │
│ UT-8.1.7  │ hasPermission handles :own suffix correctly                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Role Validation                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-8.2.1  │ isValidRole returns true for valid roles                        │
│ UT-8.2.2  │ isValidRole returns false for invalid roles                     │
│ UT-8.2.3  │ canAssignRole checks if user can assign target role             │
│ UT-8.2.4  │ Owner can assign any role                                       │
│ UT-8.2.5  │ Admin cannot assign owner role                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### React Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: InviteModal component                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-8.3.1  │ Renders email input                                             │
│ UT-8.3.2  │ Renders role selector                                           │
│ UT-8.3.3  │ Validates email format                                          │
│ UT-8.3.4  │ Disables roles user cannot assign                               │
│ UT-8.3.5  │ Shows sending state                                             │
│ UT-8.3.6  │ Shows success message                                           │
│ UT-8.3.7  │ Shows error message on failure                                  │
│ UT-8.3.8  │ Closes on cancel                                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: MemberCard component                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-8.4.1  │ Renders member avatar                                           │
│ UT-8.4.2  │ Renders member name                                             │
│ UT-8.4.3  │ Renders member email                                            │
│ UT-8.4.4  │ Renders role badge                                              │
│ UT-8.4.5  │ Renders joined date                                             │
│ UT-8.4.6  │ Renders deadline count                                          │
│ UT-8.4.7  │ Shows dropdown menu for editable members                        │
│ UT-8.4.8  │ Hides dropdown for owner (unless current user is owner)         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: RoleSelector component                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-8.5.1  │ Renders all available roles                                     │
│ UT-8.5.2  │ Shows current role as selected                                  │
│ UT-8.5.3  │ Disables roles user cannot assign                               │
│ UT-8.5.4  │ Emits role change event                                         │
│ UT-8.5.5  │ Shows role description on hover                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: AuditLogTable component                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-8.6.1  │ Renders audit log entries                                       │
│ UT-8.6.2  │ Shows user who performed action                                 │
│ UT-8.6.3  │ Shows action type                                               │
│ UT-8.6.4  │ Shows timestamp                                                 │
│ UT-8.6.5  │ Shows affected resource                                         │
│ UT-8.6.6  │ Supports filtering by user                                      │
│ UT-8.6.7  │ Supports filtering by action type                               │
│ UT-8.6.8  │ Supports filtering by date range                                │
│ UT-8.6.9  │ Supports pagination                                             │
│ UT-8.6.10 │ Supports export                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex team.invite mutation                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-8.1.1  │ Creates Clerk invitation                                        │
│ IT-8.1.2  │ Sets correct role                                               │
│ IT-8.1.3  │ Logs invite action                                              │
│ IT-8.1.4  │ Rejects if user lacks permission                                │
│ IT-8.1.5  │ Rejects if email already member                                 │
│ IT-8.1.6  │ Rejects if email already invited                                │
│ IT-8.1.7  │ Respects user limit per plan                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex team.updateRole mutation                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-8.2.1  │ Updates member role                                             │
│ IT-8.2.2  │ Logs role change                                                │
│ IT-8.2.3  │ Rejects if user lacks permission                                │
│ IT-8.2.4  │ Rejects changing owner role (without transfer)                  │
│ IT-8.2.5  │ Rejects self-demotion for owner                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex team.remove mutation                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-8.3.1  │ Removes member from organization                                │
│ IT-8.3.2  │ Unassigns member's deadlines                                    │
│ IT-8.3.3  │ Notifies admins of unassigned deadlines                         │
│ IT-8.3.4  │ Logs removal action                                             │
│ IT-8.3.5  │ Rejects if user lacks permission                                │
│ IT-8.3.6  │ Rejects removing owner                                          │
│ IT-8.3.7  │ Allows self-removal (except owner)                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex team.transferOwnership mutation                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-8.4.1  │ Changes new user to owner                                       │
│ IT-8.4.2  │ Changes old owner to admin                                      │
│ IT-8.4.3  │ Logs ownership transfer                                         │
│ IT-8.4.4  │ Rejects if current user not owner                               │
│ IT-8.4.5  │ Rejects if new owner not org member                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex audit.log mutation                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-8.5.1  │ Creates immutable audit entry                                   │
│ IT-8.5.2  │ Sets correct timestamp                                          │
│ IT-8.5.3  │ Sets correct user ID                                            │
│ IT-8.5.4  │ Stores action data                                              │
│ IT-8.5.5  │ No update mutation exists                                       │
│ IT-8.5.6  │ No delete mutation exists                                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex audit.list query                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-8.6.1  │ Returns audit entries for org                                   │
│ IT-8.6.2  │ Filters by user                                                 │
│ IT-8.6.3  │ Filters by action type                                          │
│ IT-8.6.4  │ Filters by date range                                           │
│ IT-8.6.5  │ Paginates correctly                                             │
│ IT-8.6.6  │ Rejects if user lacks audit:read permission                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Permission Middleware                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-8.7.1  │ withPermission allows authorized actions                        │
│ IT-8.7.2  │ withPermission rejects unauthorized actions                     │
│ IT-8.7.3  │ withPermission handles :own correctly                           │
│ IT-8.7.4  │ withPermission logs access attempts                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E2E Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Team Invite Flow                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-8.1.1 │ Admin can open invite modal                                     │
│ E2E-8.1.2 │ Admin can enter email and select role                           │
│ E2E-8.1.3 │ Invitation is sent successfully                                 │
│ E2E-8.1.4 │ Pending invitation appears in list                              │
│ E2E-8.1.5 │ Admin can cancel pending invitation                             │
│ E2E-8.1.6 │ Member role cannot invite                                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Accept Invitation Flow                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-8.2.1 │ New user can accept invitation                                  │
│ E2E-8.2.2 │ Existing user can accept invitation                             │
│ E2E-8.2.3 │ User gains access to organization                               │
│ E2E-8.2.4 │ User has correct role                                           │
│ E2E-8.2.5 │ Expired invitation shows error                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Role Management Flow                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-8.3.1 │ Admin can change member role                                    │
│ E2E-8.3.2 │ Role change takes effect immediately                            │
│ E2E-8.3.3 │ Member cannot change roles                                      │
│ E2E-8.3.4 │ Owner role cannot be changed directly                           │
│ E2E-8.3.5 │ Role change appears in audit log                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Remove Member Flow                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-8.4.1 │ Admin can remove member                                         │
│ E2E-8.4.2 │ Confirmation dialog appears                                     │
│ E2E-8.4.3 │ Removed member loses access                                     │
│ E2E-8.4.4 │ Member's deadlines are unassigned                               │
│ E2E-8.4.5 │ Notification sent about unassigned deadlines                    │
│ E2E-8.4.6 │ Removal appears in audit log                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Ownership Transfer Flow                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-8.5.1 │ Owner can initiate transfer                                     │
│ E2E-8.5.2 │ Owner selects new owner from members                            │
│ E2E-8.5.3 │ Confirmation required                                           │
│ E2E-8.5.4 │ New owner has owner permissions                                 │
│ E2E-8.5.5 │ Old owner becomes admin                                         │
│ E2E-8.5.6 │ Transfer appears in audit log                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Audit Log View Flow                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-8.6.1 │ Admin can view audit log                                        │
│ E2E-8.6.2 │ Audit log shows all actions                                     │
│ E2E-8.6.3 │ Admin can filter by user                                        │
│ E2E-8.6.4 │ Admin can filter by action type                                 │
│ E2E-8.6.5 │ Admin can filter by date range                                  │
│ E2E-8.6.6 │ Admin can export audit log                                      │
│ E2E-8.6.7 │ Member cannot view audit log                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec 9: Onboarding Experience

### Unit Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Onboarding Progress Utilities                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-9.1.1  │ getNextIncompleteStep returns correct step                      │
│ UT-9.1.2  │ countCompletedSteps returns correct count                       │
│ UT-9.1.3  │ isOnboardingComplete returns true when all required done        │
│ UT-9.1.4  │ isOnboardingComplete returns false when required incomplete     │
│ UT-9.1.5  │ getStepProgress returns percentage                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### React Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: OnboardingWizard component                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-9.2.1  │ Renders progress indicator                                      │
│ UT-9.2.2  │ Renders current step content                                    │
│ UT-9.2.3  │ Allows navigation to next step                                  │
│ UT-9.2.4  │ Allows navigation to previous step                              │
│ UT-9.2.5  │ Shows skip option for optional steps                            │
│ UT-9.2.6  │ Closes on completion                                            │
│ UT-9.2.7  │ Saves progress on close                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: OrgSetupStep component                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-9.3.1  │ Renders business name input                                     │
│ UT-9.3.2  │ Renders industry selector                                       │
│ UT-9.3.3  │ Renders address input (optional)                                │
│ UT-9.3.4  │ Validates required fields                                       │
│ UT-9.3.5  │ Saves org data on continue                                      │
│ UT-9.3.6  │ Marks step complete on success                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: TemplateImportStep component                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-9.4.1  │ Shows templates for selected industry                           │
│ UT-9.4.2  │ Allows selecting template                                       │
│ UT-9.4.3  │ Allows selecting/deselecting deadlines                          │
│ UT-9.4.4  │ Shows skip option                                               │
│ UT-9.4.5  │ Imports selected deadlines on continue                          │
│ UT-9.4.6  │ Shows inline deadline form if skipped                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: AlertSetupStep component                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-9.5.1  │ Shows channel selection                                         │
│ UT-9.5.2  │ Shows phone input when SMS selected                             │
│ UT-9.5.3  │ Allows sending test alert                                       │
│ UT-9.5.4  │ Requires test verification before continue                      │
│ UT-9.5.5  │ Shows verification link click confirmation                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: OnboardingChecklist component                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-9.6.1  │ Renders all checklist items                                     │
│ UT-9.6.2  │ Shows completed state for done items                            │
│ UT-9.6.3  │ Shows progress count                                            │
│ UT-9.6.4  │ Hides when all items complete                                   │
│ UT-9.6.5  │ Clicking item navigates to relevant action                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex onboarding.getProgress query                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-9.1.1  │ Returns progress for org                                        │
│ IT-9.1.2  │ Creates new progress if none exists                             │
│ IT-9.1.3  │ Returns all step statuses                                       │
│ IT-9.1.4  │ Returns completion timestamp if complete                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex onboarding.markStepComplete mutation                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-9.2.1  │ Updates step status to complete                                 │
│ IT-9.2.2  │ Updates lastActivityAt timestamp                                │
│ IT-9.2.3  │ Sets completedAt when all required steps done                   │
│ IT-9.2.4  │ Idempotent for already-complete steps                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex alerts.sendTest action                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-9.3.1  │ Sends test email with verification link                         │
│ IT-9.3.2  │ Sends test SMS with verification link                           │
│ IT-9.3.3  │ Creates verification token                                      │
│ IT-9.3.4  │ Token expires after 1 hour                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex alerts.verifyTest mutation                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-9.4.1  │ Validates token                                                 │
│ IT-9.4.2  │ Marks alert preferences as verified                             │
│ IT-9.4.3  │ Rejects expired token                                           │
│ IT-9.4.4  │ Rejects invalid token                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Re-engagement Email Cron                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-9.5.1  │ Sends 24h email for inactive users                              │
│ IT-9.5.2  │ Sends 7d email for inactive users                               │
│ IT-9.5.3  │ Does not send more than 2 emails total                          │
│ IT-9.5.4  │ Does not send to completed users                                │
│ IT-9.5.5  │ Does not send to users who logged in recently                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E2E Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Complete Onboarding Flow                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-9.1.1 │ New user sees onboarding wizard                                 │
│ E2E-9.1.2 │ User can complete org setup step                                │
│ E2E-9.1.3 │ User can import template                                        │
│ E2E-9.1.4 │ User can configure alerts                                       │
│ E2E-9.1.5 │ User can verify test alert                                      │
│ E2E-9.1.6 │ User can skip team invite                                       │
│ E2E-9.1.7 │ Onboarding completes and wizard closes                          │
│ E2E-9.1.8 │ Dashboard shows imported deadlines                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Partial Onboarding Flow                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-9.2.1 │ User can close wizard mid-flow                                  │
│ E2E-9.2.2 │ Progress is saved                                               │
│ E2E-9.2.3 │ Checklist appears in sidebar                                    │
│ E2E-9.2.4 │ User can resume from checklist                                  │
│ E2E-9.2.5 │ Completed steps show as complete                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Skip Template Flow                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-9.3.1 │ User can skip template import                                   │
│ E2E-9.3.2 │ Inline deadline form appears                                    │
│ E2E-9.3.3 │ User can create first deadline                                  │
│ E2E-9.3.4 │ Created deadline appears in list                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Onboarding Checklist Flow                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-9.4.1 │ Checklist shows remaining tasks                                 │
│ E2E-9.4.2 │ Completing task updates checklist                               │
│ E2E-9.4.3 │ Checklist disappears when all complete                          │
│ E2E-9.4.4 │ Celebration animation on completion                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec 10: Billing & Subscription

### Unit Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Plan Utilities                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-10.1.1 │ getPlanLimits returns correct limits for each plan              │
│ UT-10.1.2 │ isLimitExceeded checks correctly                                │
│ UT-10.1.3 │ calculateAnnualSavings returns correct amount                   │
│ UT-10.1.4 │ formatPrice formats cents to dollars                            │
│ UT-10.1.5 │ getPlanByPriceId maps price ID to plan                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Trial Utilities                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-10.2.1 │ getTrialDaysRemaining calculates correctly                      │
│ UT-10.2.2 │ isTrialExpired returns true after 14 days                       │
│ UT-10.2.3 │ isTrialExpired returns false during trial                       │
│ UT-10.2.4 │ getTrialEndDate calculates from org creation                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### React Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: PricingTable component                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-10.3.1 │ Renders all plan cards                                          │
│ UT-10.3.2 │ Shows monthly/annual toggle                                     │
│ UT-10.3.3 │ Updates prices on toggle                                        │
│ UT-10.3.4 │ Shows "Current plan" badge on active plan                       │
│ UT-10.3.5 │ Shows upgrade button for higher plans                           │
│ UT-10.3.6 │ Shows downgrade button for lower plans                          │
│ UT-10.3.7 │ Highlights recommended plan                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: PlanCard component                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-10.4.1 │ Renders plan name                                               │
│ UT-10.4.2 │ Renders price                                                   │
│ UT-10.4.3 │ Renders billing period                                          │
│ UT-10.4.4 │ Renders feature list                                            │
│ UT-10.4.5 │ Shows checkmarks for included features                          │
│ UT-10.4.6 │ Shows limits (users, storage, etc.)                             │
│ UT-10.4.7 │ Renders CTA button                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: UsageBar component                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-10.5.1 │ Renders progress bar                                            │
│ UT-10.5.2 │ Shows current usage / limit                                     │
│ UT-10.5.3 │ Shows percentage used                                           │
│ UT-10.5.4 │ Changes color at 80% usage (warning)                            │
│ UT-10.5.5 │ Changes color at 100% usage (error)                             │
│ UT-10.5.6 │ Shows "Unlimited" for unlimited features                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: TrialBanner component                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-10.6.1 │ Shows days remaining                                            │
│ UT-10.6.2 │ Shows upgrade CTA                                               │
│ UT-10.6.3 │ Changes style at 7 days (warning)                               │
│ UT-10.6.4 │ Changes style at 3 days (urgent)                                │
│ UT-10.6.5 │ Shows "Trial expired" when expired                              │
│ UT-10.6.6 │ Hidden when subscribed                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: BillingHistory component                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-10.7.1 │ Renders list of invoices                                        │
│ UT-10.7.2 │ Shows invoice date                                              │
│ UT-10.7.3 │ Shows invoice amount                                            │
│ UT-10.7.4 │ Shows payment status                                            │
│ UT-10.7.5 │ Allows downloading invoice PDF                                  │
│ UT-10.7.6 │ Shows empty state when no invoices                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Stripe Checkout API Route                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-10.1.1 │ Creates Stripe customer if not exists                           │
│ IT-10.1.2 │ Creates checkout session with correct price                     │
│ IT-10.1.3 │ Sets correct success/cancel URLs                                │
│ IT-10.1.4 │ Includes trial period                                           │
│ IT-10.1.5 │ Includes org metadata                                           │
│ IT-10.1.6 │ Returns checkout URL                                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Stripe Webhook Handler                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-10.2.1 │ Validates webhook signature                                     │
│ IT-10.2.2 │ Rejects invalid signature                                       │
│ IT-10.2.3 │ Handles checkout.session.completed                              │
│ IT-10.2.4 │ Handles customer.subscription.updated                           │
│ IT-10.2.5 │ Handles customer.subscription.deleted                           │
│ IT-10.2.6 │ Handles invoice.payment_failed                                  │
│ IT-10.2.7 │ Handles invoice.paid                                            │
│ IT-10.2.8 │ Ignores unknown event types                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex billing.updateSubscription mutation                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-10.3.1 │ Creates subscription record                                     │
│ IT-10.3.2 │ Updates existing subscription                                   │
│ IT-10.3.3 │ Sets correct plan                                               │
│ IT-10.3.4 │ Sets correct status                                             │
│ IT-10.3.5 │ Sets billing period dates                                       │
│ IT-10.3.6 │ Logs subscription change                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex billing.checkLimit query                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-10.4.1 │ Returns allowed: true when under limit                          │
│ IT-10.4.2 │ Returns allowed: false when at limit                            │
│ IT-10.4.3 │ Returns remaining count                                         │
│ IT-10.4.4 │ Returns unlimited for unlimited features                        │
│ IT-10.4.5 │ Uses trial limits during trial                                  │
│ IT-10.4.6 │ Uses plan limits when subscribed                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex billing.getTrialStatus query                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-10.5.1 │ Returns inTrial: true during trial                              │
│ IT-10.5.2 │ Returns correct daysRemaining                                   │
│ IT-10.5.3 │ Returns inTrial: false when subscribed                          │
│ IT-10.5.4 │ Returns expired: true after trial ends                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Stripe Portal API Route                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-10.6.1 │ Creates billing portal session                                  │
│ IT-10.6.2 │ Returns portal URL                                              │
│ IT-10.6.3 │ Sets correct return URL                                         │
│ IT-10.6.4 │ Rejects if no Stripe customer                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Trial Expiry Cron                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-10.7.1 │ Sends warning at 7 days before expiry                           │
│ IT-10.7.2 │ Sends warning at 3 days before expiry                           │
│ IT-10.7.3 │ Sends warning at 1 day before expiry                            │
│ IT-10.7.4 │ Sends expired notification                                      │
│ IT-10.7.5 │ Does not send duplicate notifications                           │
│ IT-10.7.6 │ Converts to read-only after expiry                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E2E Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Subscription Upgrade Flow                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-10.1.1│ User can view pricing page                                      │
│ E2E-10.1.2│ User can select plan                                            │
│ E2E-10.1.3│ User is redirected to Stripe checkout                           │
│ E2E-10.1.4│ After payment, user returns to app                              │
│ E2E-10.1.5│ Subscription is active                                          │
│ E2E-10.1.6│ Plan limits are updated                                         │
│ E2E-10.1.7│ Trial banner is removed                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Subscription Management Flow                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-10.2.1│ User can access billing settings                                │
│ E2E-10.2.2│ User can view current plan                                      │
│ E2E-10.2.3│ User can view usage                                             │
│ E2E-10.2.4│ User can access Stripe portal                                   │
│ E2E-10.2.5│ User can update payment method                                  │
│ E2E-10.2.6│ User can view billing history                                   │
│ E2E-10.2.7│ User can download invoices                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Plan Downgrade Flow                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-10.3.1│ User can select lower plan                                      │
│ E2E-10.3.2│ Warning shows if usage exceeds new limits                       │
│ E2E-10.3.3│ Downgrade scheduled for next billing cycle                      │
│ E2E-10.3.4│ User maintains current access until cycle end                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Cancellation Flow                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-10.4.1│ User can initiate cancellation                                  │
│ E2E-10.4.2│ Exit survey is shown                                            │
│ E2E-10.4.3│ Cancellation is confirmed                                       │
│ E2E-10.4.4│ Access continues until period end                               │
│ E2E-10.4.5│ Data is retained for 30 days                                    │
│ E2E-10.4.6│ User can reactivate within 30 days                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Trial Experience Flow                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-10.5.1│ New user starts in trial                                        │
│ E2E-10.5.2│ Trial banner shows days remaining                               │
│ E2E-10.5.3│ User has Professional features during trial                     │
│ E2E-10.5.4│ Warning emails are received                                     │
│ E2E-10.5.5│ After expiry, account is read-only                              │
│ E2E-10.5.6│ User can upgrade from expired state                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Limit Enforcement Flow                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-10.6.1│ User cannot add users beyond limit                              │
│ E2E-10.6.2│ User cannot upload beyond storage limit                         │
│ E2E-10.6.3│ User cannot use form pre-fill beyond limit                      │
│ E2E-10.6.4│ Upgrade prompt is shown at limit                                │
│ E2E-10.6.5│ Upgrading unlocks blocked features                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Spec 11: Reporting & Analytics

### Unit Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Report Calculation Utilities                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-11.1.1 │ calculateCompletionRate returns correct percentage              │
│ UT-11.1.2 │ calculateOnTimeRate returns correct percentage                  │
│ UT-11.1.3 │ groupByCategory groups deadlines correctly                      │
│ UT-11.1.4 │ calculateTrend aggregates by time period                        │
│ UT-11.1.5 │ resolveDateRange handles preset ranges                          │
│ UT-11.1.6 │ resolveDateRange handles custom ranges                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Cost Avoidance Calculation                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-11.2.1 │ calculateCostAvoidance uses default penalties                   │
│ UT-11.2.2 │ calculateCostAvoidance uses custom penalties                    │
│ UT-11.2.3 │ calculateCostAvoidance only counts on-time completions          │
│ UT-11.2.4 │ calculateCostAvoidance returns breakdown by category            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Chart Data Formatting                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-11.3.1 │ formatForPieChart returns correct structure                     │
│ UT-11.3.2 │ formatForLineChart returns correct structure                    │
│ UT-11.3.3 │ formatForBarChart returns correct structure                     │
│ UT-11.3.4 │ getChartColors returns consistent colors                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### React Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: ReportBuilder component                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-11.4.1 │ Renders date range selector                                     │
│ UT-11.4.2 │ Renders category filter                                         │
│ UT-11.4.3 │ Renders metrics selector                                        │
│ UT-11.4.4 │ Renders chart type selector                                     │
│ UT-11.4.5 │ Preview updates as selections change                            │
│ UT-11.4.6 │ Allows saving report configuration                              │
│ UT-11.4.7 │ Allows scheduling report                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: DateRangePicker component                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-11.5.1 │ Renders preset options (last 30 days, quarter, etc.)            │
│ UT-11.5.2 │ Renders custom date pickers                                     │
│ UT-11.5.3 │ Validates end date is after start date                          │
│ UT-11.5.4 │ Emits correct date range on change                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: ComplianceScoreChart component                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-11.6.1 │ Renders line chart                                              │
│ UT-11.6.2 │ Shows score over time                                           │
│ UT-11.6.3 │ Shows trend line                                                │
│ UT-11.6.4 │ Tooltips show date and score                                    │
│ UT-11.6.5 │ Handles empty data                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: CostAvoidanceCard component                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-11.7.1 │ Renders total avoided amount                                    │
│ UT-11.7.2 │ Renders deadline count                                          │
│ UT-11.7.3 │ Shows breakdown by category                                     │
│ UT-11.7.4 │ Shows disclaimer                                                │
│ UT-11.7.5 │ Allows viewing methodology                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: ExportButtons component                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ UT-11.8.1 │ Renders PDF export option                                       │
│ UT-11.8.2 │ Renders Excel export option                                     │
│ UT-11.8.3 │ Renders CSV export option                                       │
│ UT-11.8.4 │ Shows loading state during export                               │
│ UT-11.8.5 │ Triggers download on completion                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex reports.getComplianceSummary query                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-11.1.1 │ Returns summary stats for date range                            │
│ IT-11.1.2 │ Returns score history                                           │
│ IT-11.1.3 │ Returns category breakdown                                      │
│ IT-11.1.4 │ Returns upcoming deadlines                                      │
│ IT-11.1.5 │ Returns overdue items                                           │
│ IT-11.1.6 │ Filters by org correctly                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex reports.getTeamPerformance query                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-11.2.1 │ Returns stats per team member                                   │
│ IT-11.2.2 │ Calculates on-time rate per member                              │
│ IT-11.2.3 │ Calculates avg days before due                                  │
│ IT-11.2.4 │ Returns active assignments count                                │
│ IT-11.2.5 │ Requires audit:read permission                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex reports.getCostAvoidance query                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-11.3.1 │ Returns total avoided amount                                    │
│ IT-11.3.2 │ Uses default penalty estimates                                  │
│ IT-11.3.3 │ Uses org custom estimates when set                              │
│ IT-11.3.4 │ Returns breakdown by deadline                                   │
│ IT-11.3.5 │ Only counts on-time completions                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex reports.generateAuditReport action                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-11.4.1 │ Generates PDF with correct content                              │
│ IT-11.4.2 │ Includes cover page                                             │
│ IT-11.4.3 │ Includes table of contents                                      │
│ IT-11.4.4 │ Includes deadline history                                       │
│ IT-11.4.5 │ Includes document list                                          │
│ IT-11.4.6 │ Includes alert delivery log                                     │
│ IT-11.4.7 │ Stores PDF in storage                                           │
│ IT-11.4.8 │ Returns download URL                                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Convex reports.runCustomReport query                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-11.5.1 │ Applies date range filter                                       │
│ IT-11.5.2 │ Applies category filter                                         │
│ IT-11.5.3 │ Calculates selected metrics                                     │
│ IT-11.5.4 │ Groups by selected dimension                                    │
│ IT-11.5.5 │ Returns chart-ready data                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Scheduled Report Cron                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ IT-11.6.1 │ Generates scheduled reports on time                             │
│ IT-11.6.2 │ Sends email with report attachment                              │
│ IT-11.6.3 │ Handles weekly schedule                                         │
│ IT-11.6.4 │ Handles monthly schedule                                        │
│ IT-11.6.5 │ Handles quarterly schedule                                      │
│ IT-11.6.6 │ Pauses for cancelled subscriptions                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E2E Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Compliance Summary Report Flow                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-11.1.1│ User can view compliance summary                                │
│ E2E-11.1.2│ Summary shows correct stats                                     │
│ E2E-11.1.3│ User can change date range                                      │
│ E2E-11.1.4│ Charts update with date range                                   │
│ E2E-11.1.5│ User can export as PDF                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Team Performance Report Flow                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-11.2.1│ Admin can view team performance                                 │
│ E2E-11.2.2│ Report shows all team members                                   │
│ E2E-11.2.3│ Report shows completion stats                                   │
│ E2E-11.2.4│ Member cannot view team performance                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Audit Report Generation Flow                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-11.3.1│ User can select compliance area                                 │
│ E2E-11.3.2│ User can select date range                                      │
│ E2E-11.3.3│ User can generate audit package                                 │
│ E2E-11.3.4│ Large reports show progress indicator                           │
│ E2E-11.3.5│ User receives email for large reports                           │
│ E2E-11.3.6│ Downloaded package has correct structure                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Custom Report Builder Flow                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-11.4.1│ User can open report builder                                    │
│ E2E-11.4.2│ User can select date range                                      │
│ E2E-11.4.3│ User can select categories                                      │
│ E2E-11.4.4│ User can select metrics                                         │
│ E2E-11.4.5│ User can select chart types                                     │
│ E2E-11.4.6│ Preview updates in real-time                                    │
│ E2E-11.4.7│ User can save report configuration                              │
│ E2E-11.4.8│ User can load saved configuration                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Report Scheduling Flow                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ E2E-11.5.1│ User can schedule report                                        │
│ E2E-11.5.2│ User can set frequency                                          │
│ E2E-11.5.3│ User can set recipients                                         │
│ E2E-11.5.4│ Scheduled report appears in list                                │
│ E2E-11.5.5│ User can edit schedule                                          │
│ E2E-11.5.6│ User can delete schedule                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cross-Specification Tests

### Security Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Authentication Security                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ SEC-1.1   │ Unauthenticated requests are rejected                           │
│ SEC-1.2   │ Invalid JWT tokens are rejected                                 │
│ SEC-1.3   │ Expired tokens are rejected                                     │
│ SEC-1.4   │ Session timeout works correctly                                 │
│ SEC-1.5   │ Logout invalidates session                                      │
│ SEC-1.6   │ Password reset flow is secure                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Authorization Security                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ SEC-2.1   │ User cannot access other org's data                             │
│ SEC-2.2   │ User cannot access resources without permission                 │
│ SEC-2.3   │ Role escalation is not possible                                 │
│ SEC-2.4   │ API endpoints enforce permissions                               │
│ SEC-2.5   │ Direct database queries are scoped to org                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Data Protection                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ SEC-3.1   │ Sensitive data is encrypted at rest                             │
│ SEC-3.2   │ EIN is encrypted in database                                    │
│ SEC-3.3   │ API keys are not exposed in responses                           │
│ SEC-3.4   │ File URLs are signed and expire                                 │
│ SEC-3.5   │ Audit logs cannot be modified                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Input Validation                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ SEC-4.1   │ SQL injection is prevented                                      │
│ SEC-4.2   │ XSS is prevented in user input                                  │
│ SEC-4.3   │ File upload validates type and size                             │
│ SEC-4.4   │ Path traversal is prevented in file operations                  │
│ SEC-4.5   │ URL parameters are validated                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: API Security                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ SEC-5.1   │ Rate limiting is enforced                                       │
│ SEC-5.2   │ CORS is configured correctly                                    │
│ SEC-5.3   │ Webhook signatures are validated                                │
│ SEC-5.4   │ API keys can be rotated                                         │
│ SEC-5.5   │ Sensitive endpoints use POST                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Performance Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Page Load Performance                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ PERF-1.1  │ Dashboard loads in < 2 seconds                                  │
│ PERF-1.2  │ Calendar loads in < 2 seconds                                   │
│ PERF-1.3  │ Deadline list loads in < 1 second                               │
│ PERF-1.4  │ Document list loads in < 1 second                               │
│ PERF-1.5  │ Report page loads in < 2 seconds                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Query Performance                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ PERF-2.1  │ Dashboard query < 500ms                                         │
│ PERF-2.2  │ Deadline list query < 200ms                                     │
│ PERF-2.3  │ Document search < 500ms                                         │
│ PERF-2.4  │ Calendar events query < 300ms                                   │
│ PERF-2.5  │ Report generation < 5 seconds (standard)                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Scalability                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ PERF-3.1  │ System handles 1000 deadlines per org                           │
│ PERF-3.2  │ System handles 10000 documents per org                          │
│ PERF-3.3  │ System handles 100 concurrent users                             │
│ PERF-3.4  │ Alert cron handles 10000 pending alerts                         │
│ PERF-3.5  │ Search returns results for 100000 documents                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Resource Efficiency                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ PERF-4.1  │ Bundle size < 500KB (gzipped)                                   │
│ PERF-4.2  │ No memory leaks on navigation                                   │
│ PERF-4.3  │ Images are optimized                                            │
│ PERF-4.4  │ Lazy loading for off-screen content                             │
│ PERF-4.5  │ Database queries use appropriate indexes                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Accessibility Tests

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: WCAG 2.1 AA Compliance                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ A11Y-1.1  │ All images have alt text                                        │
│ A11Y-1.2  │ Color contrast ratio ≥ 4.5:1                                    │
│ A11Y-1.3  │ Color is not only indicator of status                           │
│ A11Y-1.4  │ Form inputs have visible labels                                 │
│ A11Y-1.5  │ Error messages are accessible                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Keyboard Navigation                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ A11Y-2.1  │ All interactive elements are keyboard accessible                │
│ A11Y-2.2  │ Focus order is logical                                          │
│ A11Y-2.3  │ Focus is visible                                                │
│ A11Y-2.4  │ Modal trap focus correctly                                      │
│ A11Y-2.5  │ Skip links are present                                          │
│ A11Y-2.6  │ Dropdown menus work with keyboard                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Screen Reader Compatibility                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ A11Y-3.1  │ Page has proper heading structure                               │
│ A11Y-3.2  │ ARIA landmarks are used correctly                               │
│ A11Y-3.3  │ Dynamic content updates are announced                           │
│ A11Y-3.4  │ Tables have proper headers                                      │
│ A11Y-3.5  │ Form validation is announced                                    │
│ A11Y-3.6  │ Loading states are announced                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEST: Responsive Accessibility                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ A11Y-4.1  │ Touch targets ≥ 44x44px on mobile                               │
│ A11Y-4.2  │ Content is readable without horizontal scroll                   │
│ A11Y-4.3  │ Zoom to 200% does not break layout                              │
│ A11Y-4.4  │ Orientation is not locked                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Test Summary

| Spec | Unit Tests | Integration Tests | E2E Tests | Total |
|------|------------|-------------------|-----------|-------|
| 1. Deadline Management | 56 | 35 | 24 | 115 |
| 2. Alert System | 36 | 38 | 17 | 91 |
| 3. Document Vault | 48 | 32 | 25 | 105 |
| 4. AI Form Pre-fill | 36 | 22 | 20 | 78 |
| 5. Industry Templates | 16 | 16 | 13 | 45 |
| 6. Dashboard | 38 | 12 | 17 | 67 |
| 7. Calendar View | 26 | 13 | 22 | 61 |
| 8. Team Management | 34 | 28 | 25 | 87 |
| 9. Onboarding | 24 | 16 | 14 | 54 |
| 10. Billing | 30 | 24 | 22 | 76 |
| 11. Reporting | 26 | 20 | 17 | 63 |
| Security | - | - | 25 | 25 |
| Performance | - | - | 20 | 20 |
| Accessibility | - | - | 21 | 21 |
| **TOTAL** | **370** | **256** | **282** | **908** |

---

Would you like me to:
1. Create test file templates for any specific feature?
2. Prioritize which tests to write first for MVP?
3. Add more edge case tests for specific scenarios?