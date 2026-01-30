# Tasks: Alert & Notification System

**Feature**: 002-alert-notification-system | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Overview

Build a multi-channel alert system with automatic scheduling, retry logic, channel fallback, and escalation. This is the most critical feature for the product - **alerts must never fail silently** (Constitution Law #2).

---

## Phase 1: Database & Schema

### Task 1.1: Define Alert Schema
**Priority**: P0 (Critical) | **Estimate**: 2 hours | **Dependencies**: 001-deadline-management

**Description**: Create Convex schema for alerts and alert preferences.

**Files to create/modify**:
- `convex/schema.ts`

**Acceptance Criteria**:
- [x] `alerts` table: deadlineId, orgId, scheduledFor, channel, urgency, status, sentAt, deliveredAt, acknowledgedAt, errorMessage, retryCount, snoozedUntil
- [x] `alert_preferences` table: orgId, userId, earlyChannels[], mediumChannels[], highChannels[], criticalChannels[], alertDays[], escalationEnabled, escalationContacts[]
- [x] Status enum: `'scheduled' | 'sent' | 'delivered' | 'failed' | 'acknowledged'`
- [x] Urgency enum: `'early' | 'medium' | 'high' | 'critical'`
- [x] Channel enum: `'email' | 'sms' | 'push' | 'in_app'`
- [x] Indexes: `by_scheduled` (status, scheduledFor), `by_deadline`, `by_org`

**Constitution Checklist**:
- [x] All alert failures logged with errorMessage (Alert Reliability)
- [x] retryCount tracked for exponential backoff (Alert Reliability)

---

### Task 1.2: Create Alert TypeScript Types
**Priority**: P0 (Critical) | **Estimate**: 1 hour | **Dependencies**: 1.1

**Description**: Define TypeScript types for alerts.

**Files to create/modify**:
- `src/types/alert.ts`

**Acceptance Criteria**:
- [x] `Alert` type matches schema
- [x] `AlertPreferences` type with channel arrays
- [x] `AlertChannel`, `AlertUrgency`, `AlertStatus` enums
- [x] `DEFAULT_PREFERENCES` constant with sensible defaults

**Constitution Checklist**:
- [x] No `any` types (Code Quality)

---

## Phase 2: Alert Scheduling Logic

### Task 2.1: Implement Urgency Level Calculator
**Priority**: P0 (Critical) | **Estimate**: 1-2 hours | **Dependencies**: 1.2

**Description**: Create utility to determine alert urgency based on days until deadline.

**Files to create/modify**:
- `src/lib/utils/urgency.ts`
- `tests/unit/urgency.test.ts`

**Acceptance Criteria**:
- [x] `getUrgencyLevel(daysBefore)` returns:
  - `'early'` if >= 14 days
  - `'medium'` if >= 7 days
  - `'high'` if >= 1 day
  - `'critical'` if 0 or overdue
- [x] 100% test coverage

**Constitution Checklist**:
- [x] 100% coverage for alert scheduling logic (Testing Standards)

---

### Task 2.2: Implement Alert Scheduling Function
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 2.1

**Description**: Create function to schedule alerts when deadlines are created/updated.

**Files to create/modify**:
- `convex/alerts.ts`
- `tests/unit/alert-scheduling.test.ts`

**Acceptance Criteria**:
- [x] `scheduleAlertsForDeadline(deadline, preferences)`:
  - Clears existing scheduled alerts for deadline
  - Creates alerts for each day in preferences.alertDays
  - Skips dates in the past
  - Creates separate alert for each channel based on urgency
- [x] Called from `deadlines.create` and `deadlines.update`
- [x] Alerts scheduled in UTC, timezone conversion at send time
- [x] 100% test coverage

**Constitution Checklist**:
- [x] UTC internally, timezone at display/send (Alert Reliability)
- [x] 100% coverage for scheduling (Testing Standards)

---

### Task 2.3: Implement Alert Rescheduling on Deadline Update
**Priority**: P0 (Critical) | **Estimate**: 2 hours | **Dependencies**: 2.2

**Description**: When a deadline's due date changes, reschedule all associated alerts.

**Files to create/modify**:
- `convex/deadlines.ts` (modify update mutation)
- `convex/alerts.ts`

**Acceptance Criteria**:
- [x] When dueDate changes, cancel all `scheduled` alerts
- [x] Reschedule alerts based on new dueDate
- [x] Do not reschedule alerts that are already `sent` or `delivered`
- [x] Log the rescheduling action

**Constitution Checklist**:
- [x] Alerts update atomically with deadline (Data Integrity)

---

## Phase 3: External Service Adapters

### Task 3.1: Create Email Adapter Interface and Resend Implementation
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: None

**Description**: Create the email adapter with Resend implementation.

**Files to create/modify**:
- `src/lib/adapters/email/interface.ts`
- `src/lib/adapters/email/resend.ts`
- `src/lib/email/templates/DeadlineAlertEmail.tsx`
- `tests/unit/email-adapter.test.ts`

**Acceptance Criteria**:
- [x] `EmailAdapter` interface: `send(to, subject, body, options)`
- [x] `ResendEmailAdapter` implements interface
- [x] Timeout of 30 seconds on API calls
- [x] Retry logic (3 attempts with exponential backoff)
- [ ] Email template with urgency-based styling (red for critical, yellow for high)
- [ ] Template includes: deadline title, due date, days remaining, action link
- [ ] 80% test coverage with mocked Resend

**Constitution Checklist**:
- [x] External services wrapped in adapter interfaces (External Services)
- [x] Timeout limits on external calls (Code Quality)
- [x] Never crash on external failure (Failure Handling)

---

### Task 3.2: Create SMS Adapter Interface and Twilio Implementation
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: None

**Description**: Create the SMS adapter with Twilio implementation.

**Files to create/modify**:
- `src/lib/adapters/sms/interface.ts`
- `src/lib/adapters/sms/twilio.ts`
- `tests/unit/sms-adapter.test.ts`

**Acceptance Criteria**:
- [x] `SMSAdapter` interface: `send(to, message)`
- [x] `TwilioSMSAdapter` implements interface
- [x] Message templates by urgency:
  - Critical/overdue: "⚠️ OVERDUE: {title} - Action required"
  - High (1 day): "🔴 DUE TOMORROW: {title}"
  - Medium (≤7 days): "🟡 Due in {days} days: {title}"
  - Early: "📅 Reminder: {title} due in {days} days"
- [x] Timeout of 30 seconds
- [x] Retry logic (3 attempts)
- [ ] 80% test coverage with mocked Twilio

**Constitution Checklist**:
- [x] Adapter pattern for provider switching (External Services)
- [x] Clear, actionable messages (Clarity)

---

### Task 3.3: Create In-App Notification System
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 1.1

**Description**: Create in-app notification storage and retrieval.

**Files to create/modify**:
- `convex/schema.ts` (add notifications table)
- `convex/notifications.ts`

**Acceptance Criteria**:
- [x] `notifications` table: orgId, userId, type, data, createdAt, readAt
- [x] `create(notification)` mutation
- [x] `list(userId)` query - unread first, paginated
- [x] `markRead(notificationId)` mutation
- [x] `markAllRead(userId)` mutation
- [x] Real-time updates via Convex subscription

**Constitution Checklist**:
- [x] Org isolation on queries (Security)

---

## Phase 4: Alert Processing Engine

### Task 4.1: Create Cron Job for Alert Processing
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 2.2

**Description**: Set up the cron job that processes scheduled alerts.

**Files to create/modify**:
- `convex/crons.ts`
- `convex/alerts.ts`

**Acceptance Criteria**:
- [x] Cron runs every 15 minutes
- [x] `processScheduledAlerts` action:
  - Queries alerts where status='scheduled' and scheduledFor <= now + 15min
  - Dispatches each alert to `sendAlert` action
- [x] Daily maintenance cron at 2 AM UTC for cleanup
- [x] Cron jobs logged for monitoring

**Constitution Checklist**:
- [x] Scheduled jobs have monitoring (Alert Reliability)
- [x] 15-minute windows ensure timely delivery (Performance)

---

### Task 4.2: Implement Alert Sending Action
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 3.1, 3.2, 3.3, 4.1

**Description**: Implement the core alert sending logic with retry and fallback.

**Files to create/modify**:
- `convex/alerts.ts`
- `tests/integration/alert-sending.test.ts`

**Acceptance Criteria**:
- [x] `sendAlert(alertId)` action:
  - Fetches alert and associated deadline
  - Routes to correct adapter (email/sms/push/in_app)
  - On success: marks status='sent', sets sentAt
  - On failure: increments retryCount, logs error
- [x] Retry with exponential backoff: 15min, 30min, 45min
- [x] After 3 failures, trigger escalation
- [ ] 80% test coverage

**Constitution Checklist**:
- [x] Retry with exponential backoff (Alert Reliability)
- [x] Never fail silently (Alert Reliability)
- [x] Log failures visibly (Alert Reliability)

---

### Task 4.3: Implement Escalation Logic
**Priority**: P0 (Critical) | **Estimate**: 2-3 hours | **Dependencies**: 4.2

**Description**: Implement escalation when alerts fail repeatedly.

**Files to create/modify**:
- `convex/alerts.ts`

**Acceptance Criteria**:
- [x] `escalate(alertId)` action:
  - Tries alternative channel (if email failed, try SMS)
  - Notifies escalation contacts from preferences
  - Creates in-app notification for org admin
  - Logs escalation with full context
- [ ] Escalation visible in user dashboard
- [ ] System admin notification for repeated failures

**Constitution Checklist**:
- [x] Escalate to alternative channels (Alert Reliability)
- [x] Notify system administrators (Alert Reliability)
- [ ] Failure visible in dashboard (Alert Reliability)

---

### Task 4.4: Implement Delivery Confirmation Webhooks
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 3.1, 3.2

**Description**: Handle delivery status webhooks from email/SMS providers.

**Files to create/modify**:
- `src/app/api/webhooks/resend/route.ts`
- `src/app/api/webhooks/twilio/route.ts`
- `convex/alerts.ts`

**Acceptance Criteria**:
- [ ] Resend webhook updates alert to `delivered` on delivery confirmation
- [ ] Twilio webhook updates alert status
- [ ] Webhook signature verification for security
- [ ] Handle bounce/failure webhooks - mark alert failed

**Constitution Checklist**:
- [ ] Webhook security (Security)

---

## Phase 5: Alert Preferences UI

### Task 5.1: Create AlertPreferencesForm Component
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 1.2

**Description**: Create the form for managing alert preferences.

**Files to create/modify**:
- `src/components/features/alerts/AlertPreferencesForm.tsx`

**Acceptance Criteria**:
- [x] Channel selection per urgency level (checkboxes)
- [x] Alert days selector (multi-select: 30, 14, 7, 3, 1, 0)
- [x] Phone number input for SMS (with verification)
- [x] Escalation toggle and contact selector
- [ ] "Send Test Alert" button for each channel
- [x] Save shows loading, success toast on completion

**Constitution Checklist**:
- [ ] Test alert to verify delivery (Alert Reliability)
- [x] Clear labels, not placeholder-only (Accessibility)

---

### Task 5.2: Create Alert History Component
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 4.2

**Description**: Create component showing alert delivery history.

**Files to create/modify**:
- `src/components/features/alerts/AlertHistory.tsx`
- `src/components/features/alerts/AlertStatusBadge.tsx`

**Acceptance Criteria**:
- [x] Lists alerts for deadline or org
- [x] Shows: scheduled time, channel, status, sent/delivered time
- [x] Failed alerts highlighted in red with error message
- [ ] Retry button for failed alerts
- [ ] Pagination for long history

**Constitution Checklist**:
- [x] Failed alerts visible (Alert Reliability)
- [x] Audit trail accessible (Compliance)

---

### Task 5.3: Create Snooze Functionality
**Priority**: P2 (Medium) | **Estimate**: 2 hours | **Dependencies**: 4.2

**Description**: Allow users to snooze alerts temporarily.

**Files to create/modify**:
- `src/components/features/alerts/SnoozeButton.tsx`
- `convex/alerts.ts`

**Acceptance Criteria**:
- [x] Snooze options: 1 hour, 4 hours, 1 day, 1 week
- [x] `snooze(alertId, until)` mutation sets snoozedUntil
- [x] Snoozed alerts skipped in processing until snooze expires
- [ ] Un-snooze option available

**Constitution Checklist**:
- [x] Snooze doesn't delete alert (Data Integrity)

---

### Task 5.4: Create Alert Settings Page
**Priority**: P1 (High) | **Estimate**: 2-3 hours | **Dependencies**: 5.1, 5.2

**Description**: Create the settings page for alert configuration.

**Files to create/modify**:
- `src/app/(dashboard)/settings/alerts/page.tsx`

**Acceptance Criteria**:
- [x] AlertPreferencesForm for configuration
- [x] AlertHistory for recent deliveries
- [ ] Statistics: delivery success rate, alerts sent this month
- [ ] Link to upgrade if SMS not available on plan

**Constitution Checklist**:
- [ ] Clear upgrade path (UX)

---

## Phase 6: Testing & Monitoring

### Task 6.1: Write Unit Tests for Alert Scheduling
**Priority**: P0 (Critical) | **Estimate**: 3-4 hours | **Dependencies**: 2.2

**Description**: Comprehensive unit tests for alert scheduling logic.

**Files to create/modify**:
- `tests/unit/alert-scheduling.test.ts`

**Acceptance Criteria**:
- [ ] Test scheduling for all urgency levels
- [ ] Test timezone handling (alerts fire at correct local time)
- [ ] Test rescheduling on deadline update
- [ ] Test cancellation on deadline completion
- [ ] Test edge cases: deadline in past, deadline today
- [ ] 100% coverage for scheduling logic

**Constitution Checklist**:
- [ ] 100% coverage for alert scheduling (Testing Standards)
- [ ] Tests don't depend on real time (Testing Principles)

---

### Task 6.2: Write Integration Tests for Alert Delivery
**Priority**: P0 (Critical) | **Estimate**: 4-5 hours | **Dependencies**: 4.2

**Description**: Integration tests for the full alert delivery flow.

**Files to create/modify**:
- `tests/integration/alert-delivery.test.ts`

**Acceptance Criteria**:
- [ ] Test email delivery (mocked Resend)
- [ ] Test SMS delivery (mocked Twilio)
- [ ] Test retry logic (simulate failure then success)
- [ ] Test escalation (3 failures triggers escalation)
- [ ] Test multi-tenant isolation
- [ ] 80% coverage

**Constitution Checklist**:
- [ ] External services mocked (Testing Principles)
- [ ] 80% coverage for integrations (Testing Standards)

---

### Task 6.3: Implement Alert Monitoring Dashboard
**Priority**: P1 (High) | **Estimate**: 3-4 hours | **Dependencies**: 4.2

**Description**: Create monitoring for alert system health.

**Files to create/modify**:
- `convex/monitoring.ts`
- Admin dashboard component (or integrate with external monitoring)

**Acceptance Criteria**:
- [ ] Track: alerts sent, delivery rate, failure rate
- [ ] Alert developers when failure rate > 1%
- [ ] Alert when cron jobs fail to execute
- [ ] Weekly digest of alert statistics

**Constitution Checklist**:
- [ ] Alert on failure rate > 1% (Metrics & Monitoring)
- [ ] Alert on cron job failures (Metrics & Monitoring)

---

## Summary

| Phase | Tasks | Priority | Est. Hours |
|-------|-------|----------|------------|
| 1. Database & Schema | 2 | P0 | 3 |
| 2. Alert Scheduling | 3 | P0 | 6-8 |
| 3. External Adapters | 3 | P0-P1 | 8-11 |
| 4. Processing Engine | 4 | P0-P1 | 10-14 |
| 5. Preferences UI | 4 | P1-P2 | 9-12 |
| 6. Testing & Monitoring | 3 | P0-P1 | 10-13 |
| **Total** | **19** | | **46-61** |

## Critical Path

```
1.1 Schema ─► 2.1 Urgency ─► 2.2 Scheduling ─► 4.1 Cron Job ─► 4.2 Sending ─► 4.3 Escalation
                                    │
                                    ▼
                            3.1 Email Adapter
                            3.2 SMS Adapter
                            3.3 In-App Notifications
```

**Note**: This feature is **Constitution Law #2 critical**. All P0 tasks must be completed with 100% test coverage before launch.
