# Feature Specification: Alert & Notification System

**Feature Branch**: `002-alert-notification-system`
**Created**: 2026-01-27
**Status**: Draft
**Input**: User description: "Build a multi-channel alert system that ensures users never miss a compliance deadline by sending reminders at multiple intervals through multiple channels."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Alert Scheduling (Priority: P1)

When a compliance manager creates a deadline, the system automatically schedules alerts at predefined intervals (30, 14, 7, 3, 1 days before, and on due date) without manual configuration.

**Why this priority**: Automatic scheduling is the core value proposition - users shouldn't have to remember to set reminders.

**Independent Test**: Can be tested by creating a deadline and verifying that alerts are scheduled at correct intervals.

**Acceptance Scenarios**:

1. **Given** a new deadline created with due date 45 days away, **When** saved, **Then** the system schedules alerts at 30, 14, 7, 3, 1 days before and on the due date.
2. **Given** a deadline with due date 10 days away, **When** saved, **Then** the system schedules only relevant future alerts (7, 3, 1, and due date).
3. **Given** scheduled alerts, **When** the deadline is completed, **Then** all pending alerts for that deadline are cancelled.

---

### User Story 2 - Multi-Channel Alert Delivery (Priority: P1)

A user receives compliance reminders through email, SMS, and in-app notifications based on urgency level and their preferences.

**Why this priority**: Multi-channel delivery ensures at least one message gets through - critical for the "never miss" promise.

**Independent Test**: Can be tested by triggering alerts at different urgency levels and verifying correct channels are used.

**Acceptance Scenarios**:

1. **Given** an early reminder (30-14 days before), **When** triggered, **Then** the system sends email only by default.
2. **Given** a medium urgency alert (14-7 days before), **When** triggered, **Then** the system sends email and in-app notification.
3. **Given** a high urgency alert (7-1 days before), **When** triggered, **Then** the system sends email, SMS, and in-app notification.
4. **Given** a due date or overdue alert, **When** triggered, **Then** the system sends all channels plus escalation to organization admin.

---

### User Story 3 - Configure Alert Preferences (Priority: P2)

A user customizes which channels they receive alerts on and at what urgency levels, overriding organization defaults.

**Why this priority**: Personalization improves user experience but the system works with defaults.

**Independent Test**: Can be tested by changing preferences and verifying subsequent alerts follow the new configuration.

**Acceptance Scenarios**:

1. **Given** a user with SMS disabled, **When** a high-urgency alert triggers, **Then** SMS is skipped and only email and in-app are sent.
2. **Given** organization-wide defaults, **When** a user overrides for themselves, **Then** their preferences take precedence for their alerts.
3. **Given** a user who enables "email only for all", **When** any alert triggers, **Then** only email is sent regardless of urgency.

---

### User Story 4 - Alert Escalation (Priority: P2)

When a deadline is within 24 hours and the assigned user hasn't acknowledged the alert, the system escalates to backup contacts and organization admin.

**Why this priority**: Escalation prevents single points of failure - critical for reliability but requires basic alerting first.

**Independent Test**: Can be tested by simulating an unacknowledged alert near due date and verifying escalation occurs.

**Acceptance Scenarios**:

1. **Given** an alert sent 24 hours before deadline, **When** no acknowledgment received within 12 hours, **Then** escalation alert is sent to backup contacts.
2. **Given** an overdue deadline with unacknowledged alerts, **When** escalation triggers, **Then** organization admin receives urgent notification.
3. **Given** an acknowledged alert, **When** escalation window passes, **Then** no escalation occurs.

---

### User Story 5 - Snooze Alerts (Priority: P3)

A user temporarily snoozes a reminder they can't act on immediately, and it re-appears later.

**Why this priority**: Snoozing improves UX but is not critical to core alert delivery.

**Independent Test**: Can be tested by snoozing an alert and verifying it reappears at the snoozed time.

**Acceptance Scenarios**:

1. **Given** an alert notification, **When** user snoozes for 1 day, **Then** the alert is hidden and reappears in 24 hours.
2. **Given** an alert for a deadline due tomorrow, **When** user tries to snooze for 3 days, **Then** the system prevents snoozing past the due date.
3. **Given** a snoozed alert, **When** the deadline is completed before snooze expires, **Then** the snoozed alert is cancelled.

---

### User Story 6 - Alert Delivery Tracking (Priority: P3)

An organization admin views the complete audit trail of all alerts sent, including delivery status and user interactions.

**Why this priority**: Audit trail is important for compliance proof but requires alerts to be sent first.

**Independent Test**: Can be tested by sending alerts and verifying the audit log captures all status changes.

**Acceptance Scenarios**:

1. **Given** an alert sent via email, **When** viewed in audit log, **Then** it shows: scheduled, sent, delivered, opened timestamps.
2. **Given** a failed alert delivery, **When** viewed in audit log, **Then** it shows the failure reason and retry attempts.
3. **Given** an organization admin, **When** they access the alert audit log, **Then** they can filter by user, deadline, channel, and date range.

---

### Edge Cases

- What happens when all configured channels fail to deliver?
- How does the system handle alerts for deadlines with past due dates created retroactively?
- What happens when a user's phone number becomes invalid mid-alert-sequence?
- How does the system handle timezone differences for alert scheduling?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically schedule alerts when deadlines are created based on default intervals (30, 14, 7, 3, 1, 0 days before due date).
- **FR-002**: System MUST support three alert channels: email, SMS, and in-app notification.
- **FR-003**: System MUST map urgency levels to channels: early (email only), medium (email + in-app), high (all channels), critical (all + escalation).
- **FR-004**: System MUST allow users to configure per-channel preferences and override organization defaults.
- **FR-005**: System MUST allow customization of alert intervals per deadline or organization-wide.
- **FR-006**: System MUST cancel all pending alerts when a deadline is completed.
- **FR-007**: System MUST implement escalation to backup contacts if primary user doesn't acknowledge within 24 hours of due date.
- **FR-008**: System MUST escalate to organization admin for overdue deadlines with unacknowledged alerts.
- **FR-009**: System MUST allow users to snooze alerts for 1 day, 3 days, or 1 week.
- **FR-010**: System MUST prevent snoozing alerts past the deadline due date.
- **FR-011**: System MUST track alert lifecycle: scheduled, sent, delivered, opened, acknowledged.
- **FR-012**: System MUST retry failed deliveries with exponential backoff before marking as failed.
- **FR-013**: System MUST fall back to alternative channels when primary channel fails.
- **FR-014**: System MUST log all failed deliveries visibly in user dashboard.
- **FR-015**: System MUST provide audit log of all alerts for organization admins.
- **FR-016**: System MUST store all alert timestamps in UTC and convert to user timezone only at display/send time.

### Key Entities

- **Alert Schedule**: Collection of planned alerts for a deadline, with intervals and channels.
- **Alert Instance**: A single scheduled alert with status, channel, scheduled time, and delivery tracking.
- **Alert Preference**: User or organization-level configuration for channels and urgency mappings.
- **Escalation Contact**: Backup user designated to receive escalated alerts.
- **Alert Log Entry**: Immutable audit record of alert lifecycle events.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 99.9% of scheduled alerts are delivered through at least one channel.
- **SC-002**: Alerts are delivered within 5 minutes of scheduled time.
- **SC-003**: Failed deliveries trigger retry within 15 minutes and fallback channel within 1 hour.
- **SC-004**: Users can configure alert preferences in under 2 minutes.
- **SC-005**: Alert audit log provides complete history retrievable within 10 seconds.
- **SC-006**: Escalation alerts reach backup contacts within 30 minutes of trigger condition.
- **SC-007**: Zero silent failures - every failed delivery is logged and visible to users.

## Assumptions

- Users will provide valid email and phone numbers during setup.
- SMS delivery is available in the user's region (US initially, international expansion later).
- "Acknowledgment" means clicking a link in email, replying to SMS, or clicking "Got it" in-app.
- Default alert intervals are appropriate for most compliance contexts; edge cases can customize.
- Email open tracking uses standard pixel tracking with privacy considerations documented.

## Clarifications

### Session 2026-01-28

- Q: When all alert channels (email, SMS, in-app) fail to deliver? → A: Retry all channels with escalation to org admin - core value is "never miss a deadline"
- Q: Which regions should SMS delivery support at launch? → A: US only (all US carriers) for MVP - simplifies Twilio config, can expand to Canada in v1.1
- Q: What counts as "acknowledgment" for escalation prevention? → A: Any of: click link in email, reply to SMS, click "Got it" in-app - reduces friction for busy managers
- Q: When a user's phone number becomes invalid during an alert sequence? → A: Create in-app alert asking user to update phone, continue sending via other channels

### Integrated Decisions

**All Channels Fail Behavior**:
```typescript
if (allChannelsFailed && retryCount >= 3) {
  await escalateToOrgAdmin(orgId, { type: 'alert_delivery_failed', deadlineId });
  await createHighPriorityInAppAlert(orgId, deadlineId);
}
```

**SMS Region**: US only for MVP. Document in user-facing settings that international SMS is planned for future release.

**Acknowledgment Tracking Schema**:
```typescript
acknowledgedAt: v.optional(v.number()),
acknowledgedVia: v.optional(v.union(
  v.literal('email_link'),
  v.literal('sms_reply'),
  v.literal('in_app_button')
)),
```

**Invalid Phone Handling**: On SMS delivery failure with reason `invalid_number`:
1. Send via remaining channels (email, in-app)
2. Create persistent in-app notification: "Please update your phone number to receive SMS alerts"
3. Do NOT pause other alerts
