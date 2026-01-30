import { describe, it, expect } from "vitest";
import {
  getDeadlineStatus,
  getStatusColor,
  matchesFilters,
  transformDeadlineToEvent,
  transformToEvents,
  calculateNextOccurrence,
  getRecurringEvents,
  transformToEventsWithRecurrence,
  groupDeadlinesByDate,
  type CalendarDeadline,
  type CalendarFilters,
} from "@/lib/calendar/transformer";
import { STATUS_COLORS, DUE_SOON_DAYS } from "@/lib/calendar/config";
import type { Id } from "@/convex/_generated/dataModel";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function createMockDeadline(
  overrides: Partial<CalendarDeadline> = {},
): CalendarDeadline {
  return {
    _id: "test-id" as Id<"deadlines">,
    title: "Test Deadline",
    dueDate: Date.now() + 14 * MS_PER_DAY, // 14 days from now
    category: "licenses",
    completedAt: null,
    assignedTo: null,
    description: null,
    recurrence: null,
    ...overrides,
  };
}

describe("getDeadlineStatus", () => {
  const now = Date.now();

  it("returns 'completed' when deadline has completedAt", () => {
    const deadline = createMockDeadline({ completedAt: now - MS_PER_DAY });
    expect(getDeadlineStatus(deadline, now)).toBe("completed");
  });

  it("returns 'overdue' when dueDate is in the past", () => {
    const deadline = createMockDeadline({
      dueDate: now - MS_PER_DAY,
      completedAt: null,
    });
    expect(getDeadlineStatus(deadline, now)).toBe("overdue");
  });

  it("returns 'dueSoon' when dueDate is within DUE_SOON_DAYS", () => {
    const deadline = createMockDeadline({
      dueDate: now + (DUE_SOON_DAYS - 1) * MS_PER_DAY,
      completedAt: null,
    });
    expect(getDeadlineStatus(deadline, now)).toBe("dueSoon");
  });

  it("returns 'upcoming' when dueDate is beyond DUE_SOON_DAYS", () => {
    const deadline = createMockDeadline({
      dueDate: now + (DUE_SOON_DAYS + 1) * MS_PER_DAY,
      completedAt: null,
    });
    expect(getDeadlineStatus(deadline, now)).toBe("upcoming");
  });

  it("returns 'dueSoon' when dueDate is exactly DUE_SOON_DAYS away", () => {
    const deadline = createMockDeadline({
      dueDate: now + DUE_SOON_DAYS * MS_PER_DAY,
      completedAt: null,
    });
    expect(getDeadlineStatus(deadline, now)).toBe("dueSoon");
  });

  it("uses custom now parameter", () => {
    const customNow = now + 30 * MS_PER_DAY;
    const deadline = createMockDeadline({
      dueDate: now + 20 * MS_PER_DAY,
      completedAt: null,
    });
    expect(getDeadlineStatus(deadline, customNow)).toBe("overdue");
  });
});

describe("getStatusColor", () => {
  it("returns correct color for completed status", () => {
    expect(getStatusColor("completed")).toBe(STATUS_COLORS.completed);
  });

  it("returns correct color for overdue status", () => {
    expect(getStatusColor("overdue")).toBe(STATUS_COLORS.overdue);
  });

  it("returns correct color for dueSoon status", () => {
    expect(getStatusColor("dueSoon")).toBe(STATUS_COLORS.dueSoon);
  });

  it("returns correct color for upcoming status", () => {
    expect(getStatusColor("upcoming")).toBe(STATUS_COLORS.upcoming);
  });
});

describe("matchesFilters", () => {
  it("returns true when no filters are applied", () => {
    const deadline = createMockDeadline();
    const filters: CalendarFilters = {};
    expect(matchesFilters(deadline, filters)).toBe(true);
  });

  it("filters by category", () => {
    const deadline = createMockDeadline({ category: "licenses" });
    expect(matchesFilters(deadline, { categories: ["licenses"] })).toBe(true);
    expect(matchesFilters(deadline, { categories: ["certifications"] })).toBe(
      false,
    );
  });

  it("filters by multiple categories", () => {
    const deadline = createMockDeadline({ category: "licenses" });
    expect(
      matchesFilters(deadline, { categories: ["licenses", "certifications"] }),
    ).toBe(true);
  });

  it("filters by assignedTo", () => {
    const deadline = createMockDeadline({ assignedTo: "user1" });
    expect(matchesFilters(deadline, { assignedTo: "user1" })).toBe(true);
    expect(matchesFilters(deadline, { assignedTo: "user2" })).toBe(false);
  });

  it("filters out completed when showCompleted is false", () => {
    const completedDeadline = createMockDeadline({ completedAt: Date.now() });
    const pendingDeadline = createMockDeadline({ completedAt: null });

    expect(matchesFilters(completedDeadline, { showCompleted: false })).toBe(
      false,
    );
    expect(matchesFilters(pendingDeadline, { showCompleted: false })).toBe(
      true,
    );
  });

  it("shows completed when showCompleted is true or undefined", () => {
    const completedDeadline = createMockDeadline({ completedAt: Date.now() });

    expect(matchesFilters(completedDeadline, { showCompleted: true })).toBe(
      true,
    );
    expect(matchesFilters(completedDeadline, {})).toBe(true);
  });

  it("filters by search query (case-insensitive)", () => {
    const deadline = createMockDeadline({ title: "Annual License Renewal" });

    expect(matchesFilters(deadline, { searchQuery: "license" })).toBe(true);
    expect(matchesFilters(deadline, { searchQuery: "LICENSE" })).toBe(true);
    expect(matchesFilters(deadline, { searchQuery: "certificate" })).toBe(
      false,
    );
  });

  it("combines multiple filters", () => {
    const deadline = createMockDeadline({
      category: "licenses",
      assignedTo: "user1",
      title: "Annual License",
    });

    expect(
      matchesFilters(deadline, {
        categories: ["licenses"],
        assignedTo: "user1",
        searchQuery: "license",
      }),
    ).toBe(true);

    expect(
      matchesFilters(deadline, {
        categories: ["licenses"],
        assignedTo: "user2",
        searchQuery: "license",
      }),
    ).toBe(false);
  });
});

describe("transformDeadlineToEvent", () => {
  const now = Date.now();

  it("transforms deadline to FullCalendar event format", () => {
    const deadline = createMockDeadline({
      _id: "deadline-123" as Id<"deadlines">,
      title: "Test Event",
      dueDate: now + 14 * MS_PER_DAY,
      category: "licenses",
    });

    const event = transformDeadlineToEvent(deadline, now);

    expect(event.id).toBe("deadline-123");
    expect(event.title).toBe("Test Event");
    expect(event.allDay).toBe(true);
    expect(event.backgroundColor).toBe(STATUS_COLORS.upcoming);
    expect(event.textColor).toBe("#ffffff");
    expect(event.extendedProps?.deadline).toBe(deadline);
    expect(event.extendedProps?.status).toBe("upcoming");
    expect(event.extendedProps?.category).toBe("licenses");
  });

  it("sets correct color for overdue deadline", () => {
    const deadline = createMockDeadline({
      dueDate: now - MS_PER_DAY,
    });

    const event = transformDeadlineToEvent(deadline, now);
    expect(event.backgroundColor).toBe(STATUS_COLORS.overdue);
  });

  it("sets correct color for completed deadline", () => {
    const deadline = createMockDeadline({
      completedAt: now,
    });

    const event = transformDeadlineToEvent(deadline, now);
    expect(event.backgroundColor).toBe(STATUS_COLORS.completed);
  });

  it("includes deadline-completed class when completed", () => {
    const deadline = createMockDeadline({
      completedAt: now,
    });

    const event = transformDeadlineToEvent(deadline, now);
    expect(event.classNames).toContain("deadline-completed");
  });
});

describe("transformToEvents", () => {
  const now = Date.now();

  it("transforms array of deadlines to events", () => {
    const deadlines = [
      createMockDeadline({ _id: "1" as Id<"deadlines">, title: "Deadline 1" }),
      createMockDeadline({ _id: "2" as Id<"deadlines">, title: "Deadline 2" }),
    ];

    const events = transformToEvents(deadlines, {}, now);
    expect(events).toHaveLength(2);
  });

  it("applies filters to deadlines", () => {
    const deadlines = [
      createMockDeadline({
        _id: "1" as Id<"deadlines">,
        category: "licenses",
      }),
      createMockDeadline({
        _id: "2" as Id<"deadlines">,
        category: "certifications",
      }),
    ];

    const events = transformToEvents(
      deadlines,
      { categories: ["licenses"] },
      now,
    );
    expect(events).toHaveLength(1);
  });
});

describe("calculateNextOccurrence", () => {
  const baseDate = new Date("2025-01-15").getTime();

  it("calculates weekly recurrence", () => {
    const next = calculateNextOccurrence(baseDate, { type: "weekly" });
    const nextDate = new Date(next);
    expect(nextDate.getDate()).toBe(22);
  });

  it("calculates monthly recurrence", () => {
    const next = calculateNextOccurrence(baseDate, { type: "monthly" });
    const nextDate = new Date(next);
    expect(nextDate.getMonth()).toBe(1); // February
    expect(nextDate.getDate()).toBe(15);
  });

  it("calculates quarterly recurrence", () => {
    const next = calculateNextOccurrence(baseDate, { type: "quarterly" });
    const nextDate = new Date(next);
    expect(nextDate.getMonth()).toBe(3); // April
  });

  it("calculates semi-annual recurrence", () => {
    const next = calculateNextOccurrence(baseDate, { type: "semi_annual" });
    const nextDate = new Date(next);
    expect(nextDate.getMonth()).toBe(6); // July
  });

  it("calculates annual recurrence", () => {
    const next = calculateNextOccurrence(baseDate, { type: "annual" });
    const nextDate = new Date(next);
    expect(nextDate.getFullYear()).toBe(2026);
    expect(nextDate.getMonth()).toBe(0);
    expect(nextDate.getDate()).toBe(15);
  });

  it("calculates custom recurrence with interval", () => {
    const next = calculateNextOccurrence(baseDate, {
      type: "custom",
      interval: 10,
    });
    const nextDate = new Date(next);
    expect(nextDate.getDate()).toBe(25);
  });

  it("uses default 30 days for custom without interval", () => {
    const next = calculateNextOccurrence(baseDate, { type: "custom" });
    const nextDate = new Date(next);
    expect(nextDate.getDate()).toBe(14); // 15 + 30 = Feb 14
  });
});

describe("getRecurringEvents", () => {
  const now = Date.now();

  it("returns single event for non-recurring deadline", () => {
    const deadline = createMockDeadline({ recurrence: null });
    const events = getRecurringEvents(deadline, now);
    expect(events).toHaveLength(1);
  });

  it("returns single event for completed recurring deadline", () => {
    const deadline = createMockDeadline({
      recurrence: { type: "monthly" },
      completedAt: now,
    });
    const events = getRecurringEvents(deadline, now);
    expect(events).toHaveLength(1);
  });

  it("returns 3 events for active recurring deadline (current + 2 future)", () => {
    const deadline = createMockDeadline({
      recurrence: { type: "monthly" },
      completedAt: null,
    });
    const events = getRecurringEvents(deadline, now);
    expect(events).toHaveLength(3);
  });

  it("marks future occurrences with faded styling", () => {
    const deadline = createMockDeadline({
      recurrence: { type: "monthly" },
      completedAt: null,
    });
    const events = getRecurringEvents(deadline, now);

    expect(events[0].classNames).not.toContain("deadline-future-occurrence");
    expect(events[1].classNames).toContain("deadline-future-occurrence");
    expect(events[2].classNames).toContain("deadline-future-occurrence");
  });
});

describe("transformToEventsWithRecurrence", () => {
  const now = Date.now();

  it("expands recurring deadlines", () => {
    const deadlines = [
      createMockDeadline({
        _id: "1" as Id<"deadlines">,
        recurrence: { type: "monthly" },
        completedAt: null,
      }),
      createMockDeadline({
        _id: "2" as Id<"deadlines">,
        recurrence: null,
        completedAt: null,
      }),
    ];

    const events = transformToEventsWithRecurrence(deadlines, {}, now);
    expect(events).toHaveLength(4); // 3 for recurring + 1 for non-recurring
  });

  it("applies filters before expansion", () => {
    const deadlines = [
      createMockDeadline({
        _id: "1" as Id<"deadlines">,
        category: "licenses",
        recurrence: { type: "monthly" },
      }),
      createMockDeadline({
        _id: "2" as Id<"deadlines">,
        category: "certifications",
        recurrence: { type: "monthly" },
      }),
    ];

    const events = transformToEventsWithRecurrence(
      deadlines,
      { categories: ["licenses"] },
      now,
    );
    expect(events).toHaveLength(3); // Only licenses recurring
  });
});

describe("groupDeadlinesByDate", () => {
  it("groups deadlines by date", () => {
    const date1 = new Date("2025-01-15").getTime();
    const date2 = new Date("2025-01-16").getTime();

    const deadlines = [
      createMockDeadline({ _id: "1" as Id<"deadlines">, dueDate: date1 }),
      createMockDeadline({ _id: "2" as Id<"deadlines">, dueDate: date1 }),
      createMockDeadline({ _id: "3" as Id<"deadlines">, dueDate: date2 }),
    ];

    const groups = groupDeadlinesByDate(deadlines);

    expect(groups.size).toBe(2);
    expect(groups.get("2025-01-15")).toHaveLength(2);
    expect(groups.get("2025-01-16")).toHaveLength(1);
  });

  it("sorts deadlines within each day by title", () => {
    const date1 = new Date("2025-01-15").getTime();

    const deadlines = [
      createMockDeadline({
        _id: "1" as Id<"deadlines">,
        dueDate: date1,
        title: "Zebra",
      }),
      createMockDeadline({
        _id: "2" as Id<"deadlines">,
        dueDate: date1,
        title: "Apple",
      }),
    ];

    const groups = groupDeadlinesByDate(deadlines);
    const dayDeadlines = groups.get("2025-01-15")!;

    expect(dayDeadlines[0].title).toBe("Apple");
    expect(dayDeadlines[1].title).toBe("Zebra");
  });
});
