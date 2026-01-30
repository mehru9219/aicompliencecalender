# Implementation Plan: Alert & Notification System

**Branch**: `002-alert-notification-system` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-alert-notification-system/spec.md`

## Summary

Build a multi-channel alert system with automatic scheduling, retry logic, channel fallback, and escalation to ensure users never miss a compliance deadline. Supports email (Resend), SMS (Twilio), and in-app notifications with full delivery tracking.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x
**Primary Dependencies**: Convex (cron jobs, actions), Resend API, Twilio API, Web Push API
**Storage**: Convex (alerts table, preferences, logs)
**Testing**: Vitest (unit), mocked external services
**Target Platform**: Web + email + SMS
**Project Type**: Web application with background jobs
**Performance Goals**: Alert delivery within 5 minutes of scheduled time
**Constraints**: 99.9% delivery rate, exponential backoff on failures
**Scale/Scope**: 100,000+ alerts per day across all organizations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with The Three Laws:
- [x] **Data Integrity**: Alert records immutable once created, full lifecycle tracking
- [x] **Alert Reliability**: Retry with exponential backoff, channel fallback, escalation to admin
- [x] **Clarity**: Failed alerts visible in user dashboard, audit log for admins

Additional checks:
- [x] **Security**: User contact info encrypted, org isolation on alert queries
- [x] **Code Quality**: TypeScript strict, Zod validation, adapters for external services
- [x] **Testing**: 100% coverage for scheduling logic, mocked Resend/Twilio
- [x] **Performance**: Batch processing in 15-minute windows, indexed queries
- [x] **External Services**: Adapter pattern for email/SMS, circuit breakers, retry queues

## Project Structure

### Source Code (repository root)

```text
src/
├── app/
│   └── (dashboard)/
│       └── settings/
│           └── alerts/
│               └── page.tsx          # Alert preferences UI
├── components/
│   └── features/
│       └── alerts/
│           ├── AlertPreferencesForm.tsx
│           ├── AlertHistory.tsx
│           ├── SnoozeButton.tsx
│           └── AlertStatusBadge.tsx
├── convex/
│   ├── alerts.ts                     # Alert queries/mutations/actions
│   ├── crons.ts                      # Scheduled jobs
│   └── schema.ts                     # Alert tables
├── lib/
│   └── adapters/
│       ├── email/
│       │   ├── interface.ts          # EmailAdapter interface
│       │   └── resend.ts             # Resend implementation
│       └── sms/
│           ├── interface.ts          # SMSAdapter interface
│           └── twilio.ts             # Twilio implementation
└── types/
    └── alert.ts
```

## Database Schema

```typescript
// convex/schema.ts (additions)
alerts: defineTable({
  deadlineId: v.id("deadlines"),
  orgId: v.id("organizations"),
  scheduledFor: v.number(),
  channel: v.string(),           // 'email', 'sms', 'push', 'in_app'
  urgency: v.string(),           // 'early', 'medium', 'high', 'critical'
  status: v.string(),            // 'scheduled', 'sent', 'delivered', 'failed', 'acknowledged'
  sentAt: v.optional(v.number()),
  deliveredAt: v.optional(v.number()),
  acknowledgedAt: v.optional(v.number()),
  errorMessage: v.optional(v.string()),
  retryCount: v.number(),
  snoozedUntil: v.optional(v.number()),
})
  .index("by_scheduled", ["status", "scheduledFor"])
  .index("by_deadline", ["deadlineId"])
  .index("by_org", ["orgId", "scheduledFor"]),

alert_preferences: defineTable({
  orgId: v.id("organizations"),
  userId: v.optional(v.string()),
  earlyChannels: v.array(v.string()),
  mediumChannels: v.array(v.string()),
  highChannels: v.array(v.string()),
  criticalChannels: v.array(v.string()),
  alertDays: v.array(v.number()),
  escalationEnabled: v.boolean(),
  escalationContacts: v.array(v.string()),
}),
```

## Cron Jobs

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";

const crons = cronJobs();

// Process alerts every 15 minutes
crons.interval(
  "process-alerts",
  { minutes: 15 },
  internal.alerts.processScheduledAlerts
);

// Daily maintenance at 2 AM UTC
crons.daily(
  "daily-maintenance",
  { hourUTC: 2, minuteUTC: 0 },
  internal.alerts.dailyMaintenance
);

export default crons;
```

## Alert Processing Flow

```typescript
// convex/alerts.ts
export const processScheduledAlerts = internalAction({
  handler: async (ctx) => {
    const now = Date.now();
    const windowEnd = now + 15 * 60 * 1000;

    const dueAlerts = await ctx.runQuery(internal.alerts.getDueAlerts, {
      from: now,
      to: windowEnd,
    });

    for (const alert of dueAlerts) {
      await ctx.scheduler.runAfter(0, internal.alerts.sendAlert, {
        alertId: alert._id,
      });
    }
  },
});

export const sendAlert = internalAction({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, { alertId }) => {
    const alert = await ctx.runQuery(internal.alerts.get, { alertId });

    try {
      switch (alert.channel) {
        case 'email':
          await sendEmailAlert(/* ... */);
          break;
        case 'sms':
          await sendSmsAlert(/* ... */);
          break;
        // ... other channels
      }

      await ctx.runMutation(internal.alerts.markSent, { alertId });
    } catch (error) {
      await ctx.runMutation(internal.alerts.markFailed, {
        alertId,
        error: error.message
      });

      // Retry with exponential backoff
      if (alert.retryCount < 3) {
        await ctx.scheduler.runAfter(
          15 * 60 * 1000 * (alert.retryCount + 1),
          internal.alerts.sendAlert,
          { alertId }
        );
      } else {
        // Escalate after max retries
        await ctx.scheduler.runAfter(0, internal.alerts.escalate, { alertId });
      }
    }
  },
});
```

## Email Adapter (Resend)

```typescript
// lib/adapters/email/resend.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailAlert(
  email: string,
  deadline: Deadline,
  urgency: string
): Promise<void> {
  const daysUntil = Math.ceil((deadline.dueDate - Date.now()) / (1000*60*60*24));

  await resend.emails.send({
    from: 'alerts@compliancecalendar.app',
    to: email,
    subject: `[${urgency.toUpperCase()}] ${deadline.title} - Due in ${daysUntil} days`,
    react: DeadlineAlertEmail({ deadline, urgency, daysUntil }),
  });
}
```

## SMS Adapter (Twilio)

```typescript
// lib/adapters/sms/twilio.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSmsAlert(
  phone: string,
  deadline: Deadline,
  urgency: string
): Promise<void> {
  const daysUntil = Math.ceil((deadline.dueDate - Date.now()) / (1000*60*60*24));

  let message: string;
  if (daysUntil <= 0) message = `OVERDUE: ${deadline.title} - Action required`;
  else if (daysUntil === 1) message = `DUE TOMORROW: ${deadline.title}`;
  else message = `Due in ${daysUntil} days: ${deadline.title}`;

  await client.messages.create({
    body: message,
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER,
  });
}
```

## Urgency Level Mapping

```typescript
function getUrgencyLevel(daysBefore: number): string {
  if (daysBefore >= 14) return 'early';
  if (daysBefore >= 7) return 'medium';
  if (daysBefore >= 1) return 'high';
  return 'critical';
}

// Default channel mappings
const DEFAULT_PREFERENCES = {
  earlyChannels: ['email'],
  mediumChannels: ['email', 'in_app'],
  highChannels: ['email', 'sms', 'in_app'],
  criticalChannels: ['email', 'sms', 'in_app'],
  alertDays: [30, 14, 7, 3, 1, 0],
};
```

## Complexity Tracking

No constitution violations - implements all required reliability patterns.
