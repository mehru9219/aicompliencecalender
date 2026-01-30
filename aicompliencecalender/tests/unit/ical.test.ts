import { describe, it, expect } from "vitest";
import {
  generateICalFeed,
  generateICalFilename,
  generateWebcalUrl,
  generateGoogleCalendarUrl,
} from "@/lib/calendar/ical";
import type { CalendarDeadline } from "@/lib/calendar/transformer";
import type { Id } from "@/convex/_generated/dataModel";

function createMockDeadline(
  overrides: Partial<CalendarDeadline> = {},
): CalendarDeadline {
  return {
    _id: "test-id-123" as Id<"deadlines">,
    title: "Test Deadline",
    dueDate: new Date("2025-03-15").getTime(),
    category: "licenses",
    completedAt: null,
    assignedTo: null,
    description: null,
    recurrence: null,
    ...overrides,
  };
}

describe("generateICalFeed", () => {
  it("generates valid iCal format with VCALENDAR wrapper", () => {
    const deadlines = [createMockDeadline()];
    const icalContent = generateICalFeed(deadlines);

    expect(icalContent).toContain("BEGIN:VCALENDAR");
    expect(icalContent).toContain("END:VCALENDAR");
    expect(icalContent).toContain("VERSION:2.0");
  });

  it("includes VEVENT for each deadline", () => {
    const deadlines = [
      createMockDeadline({ _id: "1" as Id<"deadlines"> }),
      createMockDeadline({ _id: "2" as Id<"deadlines"> }),
    ];
    const icalContent = generateICalFeed(deadlines);

    const eventCount = (icalContent.match(/BEGIN:VEVENT/g) || []).length;
    expect(eventCount).toBe(2);
  });

  it("includes UID for each event", () => {
    const deadlines = [
      createMockDeadline({ _id: "unique-id-abc" as Id<"deadlines"> }),
    ];
    const icalContent = generateICalFeed(deadlines);

    expect(icalContent).toContain("unique-id-abc");
  });

  it("includes SUMMARY with deadline title", () => {
    const deadlines = [createMockDeadline({ title: "Annual License Renewal" })];
    const icalContent = generateICalFeed(deadlines);

    expect(icalContent).toContain("SUMMARY:Annual License Renewal");
  });

  it("includes DTSTART for due date", () => {
    const deadlines = [
      createMockDeadline({ dueDate: new Date("2025-03-15").getTime() }),
    ];
    const icalContent = generateICalFeed(deadlines);

    // Should contain date in iCal format (VALUE=DATE for all-day events)
    expect(icalContent).toContain("DTSTART");
    expect(icalContent).toContain("20250315");
  });

  it("includes DESCRIPTION with category and details", () => {
    const deadlines = [
      createMockDeadline({
        category: "licenses",
        assignedTo: "John Doe",
        description: "Important renewal",
      }),
    ];
    const icalContent = generateICalFeed(deadlines);

    expect(icalContent).toContain("DESCRIPTION:");
    expect(icalContent).toContain("Category: licenses");
  });

  it("includes VALARM components for reminders", () => {
    const deadlines = [createMockDeadline()];
    const icalContent = generateICalFeed(deadlines);

    expect(icalContent).toContain("BEGIN:VALARM");
    expect(icalContent).toContain("END:VALARM");
    expect(icalContent).toContain("ACTION:DISPLAY");
  });

  it("includes RRULE for recurring deadlines", () => {
    const deadlines = [
      createMockDeadline({
        recurrence: { type: "monthly" },
        completedAt: null,
      }),
    ];
    const icalContent = generateICalFeed(deadlines);

    expect(icalContent).toContain("RRULE:");
    expect(icalContent).toContain("FREQ=MONTHLY");
  });

  it("includes weekly recurrence rule", () => {
    const deadlines = [
      createMockDeadline({
        recurrence: { type: "weekly" },
        completedAt: null,
      }),
    ];
    const icalContent = generateICalFeed(deadlines);

    expect(icalContent).toContain("FREQ=WEEKLY");
  });

  it("includes yearly recurrence rule for annual", () => {
    const deadlines = [
      createMockDeadline({
        recurrence: { type: "annual" },
        completedAt: null,
      }),
    ];
    const icalContent = generateICalFeed(deadlines);

    expect(icalContent).toContain("FREQ=YEARLY");
  });

  it("handles quarterly as monthly with interval 3", () => {
    const deadlines = [
      createMockDeadline({
        recurrence: { type: "quarterly" },
        completedAt: null,
      }),
    ];
    const icalContent = generateICalFeed(deadlines);

    expect(icalContent).toContain("FREQ=MONTHLY");
    expect(icalContent).toContain("INTERVAL=3");
  });

  it("uses custom calendar name from options", () => {
    const deadlines = [createMockDeadline()];
    const icalContent = generateICalFeed(deadlines, {
      calendarName: "My Custom Calendar",
    });

    expect(icalContent).toContain("X-WR-CALNAME:My Custom Calendar");
  });

  it("handles empty deadlines array", () => {
    const icalContent = generateICalFeed([]);

    expect(icalContent).toContain("BEGIN:VCALENDAR");
    expect(icalContent).toContain("END:VCALENDAR");
    expect(icalContent).not.toContain("BEGIN:VEVENT");
  });

  it("includes CATEGORIES with deadline category", () => {
    const deadlines = [createMockDeadline({ category: "certifications" })];
    const icalContent = generateICalFeed(deadlines);

    expect(icalContent).toContain("CATEGORIES:certifications");
  });
});

describe("generateICalFilename", () => {
  it("generates default filename without org name", () => {
    const filename = generateICalFilename();
    expect(filename).toBe("compliance-deadlines.ics");
  });

  it("sanitizes organization name", () => {
    const filename = generateICalFilename("Acme Corp & Sons!");
    expect(filename).toBe("acme-corp---sons--deadlines.ics");
  });

  it("includes date range for single month", () => {
    const filename = generateICalFilename("Acme", {
      start: new Date("2025-03-01"),
      end: new Date("2025-03-31"),
    });
    expect(filename).toBe("acme-deadlines-2025-03.ics");
  });

  it("includes date range for multiple months", () => {
    const filename = generateICalFilename("Acme", {
      start: new Date("2025-03-01"),
      end: new Date("2025-06-30"),
    });
    expect(filename).toBe("acme-deadlines-2025-03-to-2025-06.ics");
  });
});

describe("generateWebcalUrl", () => {
  it("generates webcal URL from https base", () => {
    const url = generateWebcalUrl("https://example.com", "org123");
    expect(url).toBe("webcal://example.com/api/calendar/org123/feed.ics");
  });

  it("generates webcal URL from http base", () => {
    const url = generateWebcalUrl("http://localhost:3000", "org123");
    expect(url).toBe("webcal://localhost:3000/api/calendar/org123/feed.ics");
  });
});

describe("generateGoogleCalendarUrl", () => {
  it("generates Google Calendar URL", () => {
    const url = generateGoogleCalendarUrl("https://example.com", "org123");

    expect(url).toContain("https://calendar.google.com/calendar/r");
    expect(url).toContain("cid=");
    expect(url).toContain("example.com%2Fapi%2Fcalendar%2Forg123%2Ffeed.ics");
  });
});
