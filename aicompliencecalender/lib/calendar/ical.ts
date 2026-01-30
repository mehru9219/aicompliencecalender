/**
 * iCal generation utilities for calendar export.
 */

import ical, { ICalEventRepeatingFreq, ICalAlarmType } from "ical-generator";
import type { CalendarDeadline } from "./transformer";

interface ICalOptions {
  calendarName?: string;
  organizationName?: string;
  prodId?: string;
}

const RECURRENCE_MAP: Record<string, ICalEventRepeatingFreq> = {
  weekly: ICalEventRepeatingFreq.WEEKLY,
  monthly: ICalEventRepeatingFreq.MONTHLY,
  quarterly: ICalEventRepeatingFreq.MONTHLY, // Use 3-month interval
  semi_annual: ICalEventRepeatingFreq.MONTHLY, // Use 6-month interval
  annual: ICalEventRepeatingFreq.YEARLY,
};

/**
 * Generate an iCal feed from deadlines.
 */
export function generateICalFeed(
  deadlines: CalendarDeadline[],
  options: ICalOptions = {},
): string {
  const {
    calendarName = "Compliance Deadlines",
    organizationName = "AI Compliance Calendar",
    prodId = "-//AI Compliance Calendar//EN",
  } = options;

  const calendar = ical({
    name: calendarName,
    prodId,
  });

  for (const deadline of deadlines) {
    const event = calendar.createEvent({
      id: deadline._id,
      summary: deadline.title,
      description: formatDescription(deadline),
      start: new Date(deadline.dueDate),
      allDay: true,
      categories: [{ name: deadline.category }],
      organizer: {
        name: organizationName,
        email: "noreply@example.com",
      },
    });

    // Add recurrence if applicable
    if (deadline.recurrence && !deadline.completedAt) {
      const freq = RECURRENCE_MAP[deadline.recurrence.type];
      if (freq) {
        let interval = 1;
        if (deadline.recurrence.type === "quarterly") interval = 3;
        if (deadline.recurrence.type === "semi_annual") interval = 6;
        if (
          deadline.recurrence.type === "custom" &&
          deadline.recurrence.interval
        ) {
          // Custom interval in days - convert to daily frequency
          event.repeating({
            freq: ICalEventRepeatingFreq.DAILY,
            interval: deadline.recurrence.interval,
          });
        } else {
          event.repeating({ freq, interval });
        }
      }
    }

    // Add reminder alarms (7 days and 1 day before)
    event.createAlarm({
      type: ICalAlarmType.display,
      trigger: 7 * 24 * 60 * 60, // 7 days in seconds
      description: `Reminder: ${deadline.title} is due in 7 days`,
    });

    event.createAlarm({
      type: ICalAlarmType.display,
      trigger: 24 * 60 * 60, // 1 day in seconds
      description: `Reminder: ${deadline.title} is due tomorrow`,
    });

    // Mark completed events
    if (deadline.completedAt) {
      event.status("COMPLETED" as Parameters<typeof event.status>[0]);
    }
  }

  return calendar.toString();
}

/**
 * Format deadline details for iCal description.
 */
function formatDescription(deadline: CalendarDeadline): string {
  const parts: string[] = [];

  parts.push(`Category: ${deadline.category}`);

  if (deadline.assignedTo) {
    parts.push(`Assigned to: ${deadline.assignedTo}`);
  }

  if (deadline.description) {
    parts.push("");
    parts.push(deadline.description);
  }

  if (deadline.recurrence) {
    parts.push("");
    parts.push(`Repeats: ${formatRecurrence(deadline.recurrence)}`);
  }

  return parts.join("\n");
}

/**
 * Format recurrence for display.
 */
function formatRecurrence(
  recurrence: NonNullable<CalendarDeadline["recurrence"]>,
): string {
  switch (recurrence.type) {
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "quarterly":
      return "Quarterly";
    case "semi_annual":
      return "Semi-annually";
    case "annual":
      return "Annually";
    case "custom":
      return `Every ${recurrence.interval || 30} days`;
    default:
      return recurrence.type;
  }
}

/**
 * Generate a download filename for the iCal export.
 */
export function generateICalFilename(
  orgName?: string,
  dateRange?: { start: Date; end: Date },
): string {
  const sanitizedOrg = orgName
    ? orgName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()
    : "compliance";

  if (dateRange) {
    const startMonth = dateRange.start.toISOString().slice(0, 7);
    const endMonth = dateRange.end.toISOString().slice(0, 7);
    if (startMonth === endMonth) {
      return `${sanitizedOrg}-deadlines-${startMonth}.ics`;
    }
    return `${sanitizedOrg}-deadlines-${startMonth}-to-${endMonth}.ics`;
  }

  return `${sanitizedOrg}-deadlines.ics`;
}

/**
 * Generate webcal URL for calendar subscription.
 */
export function generateWebcalUrl(baseUrl: string, orgId: string): string {
  const url = new URL(`/api/calendar/${orgId}/feed.ics`, baseUrl);
  return url.toString().replace(/^https?:/, "webcal:");
}

/**
 * Generate Google Calendar import URL.
 */
export function generateGoogleCalendarUrl(
  baseUrl: string,
  orgId: string,
): string {
  const feedUrl = new URL(`/api/calendar/${orgId}/feed.ics`, baseUrl);
  const googleUrl = new URL("https://calendar.google.com/calendar/r");
  googleUrl.searchParams.set("cid", feedUrl.toString());
  return googleUrl.toString();
}
