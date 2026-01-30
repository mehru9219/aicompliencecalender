import { describe, it, expect } from "vitest";
import {
  calculateNextDueDate,
  generateNextDeadline,
} from "../../lib/utils/recurrence";
import type { Deadline, RecurrencePattern } from "../../types/deadline";
import type { Id } from "../../convex/_generated/dataModel";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

describe("calculateNextDueDate", () => {
  const BASE_DATE = new Date("2025-01-15T10:00:00Z").getTime();

  describe("weekly recurrence", () => {
    it("adds 7 days for weekly recurrence", () => {
      const recurrence: RecurrencePattern = { type: "weekly" };
      const next = calculateNextDueDate(BASE_DATE, recurrence);
      const expected = new Date("2025-01-22T10:00:00Z").getTime();
      expect(next).toBe(expected);
    });
  });

  describe("monthly recurrence", () => {
    it("adds 1 month for monthly recurrence", () => {
      const recurrence: RecurrencePattern = { type: "monthly" };
      const next = calculateNextDueDate(BASE_DATE, recurrence);
      const expected = new Date("2025-02-15T10:00:00Z").getTime();
      expect(next).toBe(expected);
    });

    it("handles Jan 31 -> Feb 28 (month-end edge case)", () => {
      const jan31 = new Date("2025-01-31T10:00:00Z").getTime();
      const recurrence: RecurrencePattern = { type: "monthly" };
      const next = calculateNextDueDate(jan31, recurrence);
      const result = new Date(next!);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28); // Feb 28 (non-leap year)
    });

    it("handles Jan 31 -> Feb 29 in leap year", () => {
      const jan31 = new Date("2024-01-31T10:00:00Z").getTime();
      const recurrence: RecurrencePattern = { type: "monthly" };
      const next = calculateNextDueDate(jan31, recurrence);
      const result = new Date(next!);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29); // Feb 29 (leap year)
    });

    it("handles Dec -> Jan year rollover", () => {
      const dec15 = new Date("2025-12-15T10:00:00Z").getTime();
      const recurrence: RecurrencePattern = { type: "monthly" };
      const next = calculateNextDueDate(dec15, recurrence);
      const result = new Date(next!);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });
  });

  describe("quarterly recurrence", () => {
    it("adds 3 months for quarterly recurrence", () => {
      const recurrence: RecurrencePattern = { type: "quarterly" };
      const next = calculateNextDueDate(BASE_DATE, recurrence);
      const result = new Date(next!);
      // Check date components (DST can shift time)
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(15);
      expect(result.getFullYear()).toBe(2025);
    });
  });

  describe("semi_annual recurrence", () => {
    it("adds 6 months for semi-annual recurrence", () => {
      const recurrence: RecurrencePattern = { type: "semi_annual" };
      const next = calculateNextDueDate(BASE_DATE, recurrence);
      const result = new Date(next!);
      // Check date components (DST can shift time)
      expect(result.getMonth()).toBe(6); // July
      expect(result.getDate()).toBe(15);
      expect(result.getFullYear()).toBe(2025);
    });
  });

  describe("annual recurrence", () => {
    it("adds 12 months for annual recurrence", () => {
      const recurrence: RecurrencePattern = { type: "annual" };
      const next = calculateNextDueDate(BASE_DATE, recurrence);
      const expected = new Date("2026-01-15T10:00:00Z").getTime();
      expect(next).toBe(expected);
    });

    it("handles Feb 29 in leap year -> Feb 28 next year", () => {
      const feb29 = new Date("2024-02-29T10:00:00Z").getTime();
      const recurrence: RecurrencePattern = { type: "annual" };
      const next = calculateNextDueDate(feb29, recurrence);
      const result = new Date(next!);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1);
      expect(result.getDate()).toBe(28);
    });
  });

  describe("custom recurrence", () => {
    it("adds N days for custom recurrence", () => {
      const recurrence: RecurrencePattern = { type: "custom", interval: 45 };
      const next = calculateNextDueDate(BASE_DATE, recurrence);
      const expected = BASE_DATE + 45 * MS_PER_DAY;
      expect(next).toBe(expected);
    });

    it("returns null if custom interval is missing", () => {
      const recurrence: RecurrencePattern = { type: "custom" };
      const next = calculateNextDueDate(BASE_DATE, recurrence);
      expect(next).toBeNull();
    });
  });

  describe("endDate handling", () => {
    it("returns null if next date exceeds endDate", () => {
      const recurrence: RecurrencePattern = {
        type: "monthly",
        endDate: new Date("2025-02-01T00:00:00Z").getTime(),
      };
      const next = calculateNextDueDate(BASE_DATE, recurrence);
      expect(next).toBeNull();
    });

    it("returns next date if before endDate", () => {
      const recurrence: RecurrencePattern = {
        type: "monthly",
        endDate: new Date("2025-12-31T23:59:59Z").getTime(),
      };
      const next = calculateNextDueDate(BASE_DATE, recurrence);
      expect(next).not.toBeNull();
    });
  });

  describe("baseDate handling", () => {
    it("uses due_date as base by default", () => {
      const recurrence: RecurrencePattern = { type: "weekly" };
      const completionDate = BASE_DATE + 3 * MS_PER_DAY;
      const next = calculateNextDueDate(BASE_DATE, recurrence, completionDate);
      const expected = BASE_DATE + 7 * MS_PER_DAY;
      expect(next).toBe(expected);
    });

    it("uses completion_date as base when specified", () => {
      const recurrence: RecurrencePattern = {
        type: "weekly",
        baseDate: "completion_date",
      };
      const completionDate = BASE_DATE + 3 * MS_PER_DAY;
      const next = calculateNextDueDate(BASE_DATE, recurrence, completionDate);
      const expected = completionDate + 7 * MS_PER_DAY;
      expect(next).toBe(expected);
    });

    it("falls back to due_date if completion_date not provided", () => {
      const recurrence: RecurrencePattern = {
        type: "weekly",
        baseDate: "completion_date",
      };
      const next = calculateNextDueDate(BASE_DATE, recurrence);
      const expected = BASE_DATE + 7 * MS_PER_DAY;
      expect(next).toBe(expected);
    });
  });
});

describe("generateNextDeadline", () => {
  const mockDeadline: Deadline = {
    _id: "test_id" as Id<"deadlines">,
    _creationTime: Date.now(),
    orgId: "org_id" as Id<"organizations">,
    title: "Quarterly Report",
    description: "Submit quarterly report",
    dueDate: new Date("2025-01-15T10:00:00Z").getTime(),
    category: "filing",
    recurrence: { type: "quarterly" },
    assignedTo: "user@example.com",
    completedAt: new Date("2025-01-14T10:00:00Z").getTime(),
    completedBy: "user@example.com",
    deletedAt: undefined,
    createdAt: Date.now() - MS_PER_DAY * 90,
    createdBy: "admin@example.com",
  };

  it("returns null if no recurrence", () => {
    const deadline = { ...mockDeadline, recurrence: undefined };
    expect(generateNextDeadline(deadline)).toBeNull();
  });

  it("returns null if recurrence ended", () => {
    const deadline = {
      ...mockDeadline,
      recurrence: {
        type: "quarterly" as const,
        endDate: new Date("2025-02-01T00:00:00Z").getTime(),
      },
    };
    expect(generateNextDeadline(deadline)).toBeNull();
  });

  it("generates next deadline with correct due date", () => {
    const next = generateNextDeadline(mockDeadline);
    expect(next).not.toBeNull();
    const result = new Date(next!.dueDate);
    // Check date components (DST can shift time)
    expect(result.getMonth()).toBe(3); // April
    expect(result.getDate()).toBe(15);
    expect(result.getFullYear()).toBe(2025);
  });

  it("preserves orgId from original", () => {
    const next = generateNextDeadline(mockDeadline);
    expect(next!.orgId).toBe(mockDeadline.orgId);
  });

  it("preserves title from original", () => {
    const next = generateNextDeadline(mockDeadline);
    expect(next!.title).toBe(mockDeadline.title);
  });

  it("preserves description from original", () => {
    const next = generateNextDeadline(mockDeadline);
    expect(next!.description).toBe(mockDeadline.description);
  });

  it("preserves category from original", () => {
    const next = generateNextDeadline(mockDeadline);
    expect(next!.category).toBe(mockDeadline.category);
  });

  it("preserves recurrence from original", () => {
    const next = generateNextDeadline(mockDeadline);
    expect(next!.recurrence).toEqual(mockDeadline.recurrence);
  });

  it("preserves assignedTo from original", () => {
    const next = generateNextDeadline(mockDeadline);
    expect(next!.assignedTo).toBe(mockDeadline.assignedTo);
  });

  it("preserves createdBy from original", () => {
    const next = generateNextDeadline(mockDeadline);
    expect(next!.createdBy).toBe(mockDeadline.createdBy);
  });

  it("clears completedAt", () => {
    const next = generateNextDeadline(mockDeadline);
    expect(next!.completedAt).toBeUndefined();
  });

  it("clears completedBy", () => {
    const next = generateNextDeadline(mockDeadline);
    expect(next!.completedBy).toBeUndefined();
  });

  it("clears deletedAt", () => {
    const next = generateNextDeadline(mockDeadline);
    expect(next!.deletedAt).toBeUndefined();
  });

  it("sets new createdAt", () => {
    const next = generateNextDeadline(mockDeadline);
    expect(next!.createdAt).toBeGreaterThan(mockDeadline.createdAt);
  });

  it("does not include _id field", () => {
    const next = generateNextDeadline(mockDeadline);
    expect(next).not.toHaveProperty("_id");
  });

  it("does not include _creationTime field", () => {
    const next = generateNextDeadline(mockDeadline);
    expect(next).not.toHaveProperty("_creationTime");
  });
});
