import { describe, it, expect } from "vitest";
import {
  formatDueDate,
  formatDateTime,
  getDaysUntil,
  formatRelativeDate,
  isToday,
  startOfDay,
  endOfDay,
} from "../../lib/utils/date";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

describe("getDaysUntil", () => {
  const NOW = new Date("2025-06-15T12:00:00Z").getTime();

  it("returns positive days for future date", () => {
    const future = NOW + 5 * MS_PER_DAY;
    expect(getDaysUntil(future, NOW)).toBe(5);
  });

  it("returns negative days for past date", () => {
    const past = NOW - 5 * MS_PER_DAY;
    expect(getDaysUntil(past, NOW)).toBe(-5);
  });

  it("returns 0 for same day", () => {
    expect(getDaysUntil(NOW, NOW)).toBe(0);
  });

  it("returns 1 for less than 24 hours in future", () => {
    const almostTomorrow = NOW + 20 * 60 * 60 * 1000; // 20 hours
    expect(getDaysUntil(almostTomorrow, NOW)).toBe(1);
  });

  it("returns -1 for slightly more than 24 hours in past", () => {
    // Math.ceil(-1.04) = -1
    const yesterday = NOW - 25 * 60 * 60 * 1000; // 25 hours ago
    expect(getDaysUntil(yesterday, NOW)).toBe(-1);
  });

  it("uses current time when now is not provided", () => {
    const future = Date.now() + 10 * MS_PER_DAY;
    const result = getDaysUntil(future);
    expect(result).toBeGreaterThanOrEqual(9);
    expect(result).toBeLessThanOrEqual(11);
  });
});

describe("formatRelativeDate", () => {
  const NOW = new Date("2025-06-15T12:00:00Z").getTime();

  it('returns "Due today" for same day', () => {
    expect(formatRelativeDate(NOW, NOW)).toBe("Due today");
  });

  it('returns "Due tomorrow" for 1 second in future (rounds up)', () => {
    const laterToday = NOW + 1000; // 1 second later - Math.ceil rounds up
    expect(formatRelativeDate(laterToday, NOW)).toBe("Due tomorrow");
  });

  it('returns "Due tomorrow" for 1 day in future', () => {
    const tomorrow = NOW + MS_PER_DAY;
    expect(formatRelativeDate(tomorrow, NOW)).toBe("Due tomorrow");
  });

  it('returns "Due in X days" for 2+ days in future', () => {
    const future = NOW + 5 * MS_PER_DAY;
    expect(formatRelativeDate(future, NOW)).toBe("Due in 5 days");
  });

  it('returns "1 day overdue" for 1 day past', () => {
    const yesterday = NOW - MS_PER_DAY;
    expect(formatRelativeDate(yesterday, NOW)).toBe("1 day overdue");
  });

  it('returns "X days overdue" for 2+ days past', () => {
    const past = NOW - 5 * MS_PER_DAY;
    expect(formatRelativeDate(past, NOW)).toBe("5 days overdue");
  });

  it("handles 30 days in future", () => {
    const future = NOW + 30 * MS_PER_DAY;
    expect(formatRelativeDate(future, NOW)).toBe("Due in 30 days");
  });

  it("handles 100 days overdue", () => {
    const past = NOW - 100 * MS_PER_DAY;
    expect(formatRelativeDate(past, NOW)).toBe("100 days overdue");
  });
});

describe("formatDueDate", () => {
  it("formats date correctly", () => {
    const timestamp = new Date("2025-06-15T00:00:00Z").getTime();
    const result = formatDueDate(timestamp);
    // Locale-dependent, but should contain month and day
    expect(result).toMatch(/Jun|June/i);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2025/);
  });

  it("handles dates from different months", () => {
    const december = new Date("2025-12-25T00:00:00Z").getTime();
    const result = formatDueDate(december);
    // Locale-dependent, just check it contains day and year
    expect(result).toMatch(/25/);
    expect(result).toMatch(/2025/);
  });
});

describe("formatDateTime", () => {
  it("includes time in output", () => {
    const timestamp = new Date("2025-06-15T14:30:00Z").getTime();
    const result = formatDateTime(timestamp);
    // Should contain date parts
    expect(result).toMatch(/Jun|June/i);
    expect(result).toMatch(/15/);
    // Should contain time (exact format is locale-dependent)
    expect(result.length).toBeGreaterThan(formatDueDate(timestamp).length);
  });
});

describe("isToday", () => {
  it("returns true for same day", () => {
    const now = new Date("2025-06-15T12:00:00Z").getTime();
    const sameDayMorning = new Date("2025-06-15T06:00:00Z").getTime();
    expect(isToday(sameDayMorning, now)).toBe(true);
  });

  it("returns true for same timestamp", () => {
    const now = new Date("2025-06-15T12:00:00Z").getTime();
    expect(isToday(now, now)).toBe(true);
  });

  it("returns false for different day", () => {
    const now = new Date("2025-06-15T12:00:00Z").getTime();
    const yesterday = new Date("2025-06-14T12:00:00Z").getTime();
    expect(isToday(yesterday, now)).toBe(false);
  });

  it("returns false for same time different day", () => {
    const now = new Date("2025-06-15T12:00:00Z").getTime();
    const tomorrow = new Date("2025-06-16T12:00:00Z").getTime();
    expect(isToday(tomorrow, now)).toBe(false);
  });

  it("handles year boundary with clear day difference", () => {
    const dec30 = new Date("2025-12-30T12:00:00Z").getTime();
    const jan2 = new Date("2026-01-02T12:00:00Z").getTime();
    expect(isToday(jan2, dec30)).toBe(false);
  });
});

describe("startOfDay", () => {
  it("sets time to midnight UTC", () => {
    const afternoon = new Date("2025-06-15T14:30:45.123Z").getTime();
    const result = startOfDay(afternoon);
    const date = new Date(result);
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCSeconds()).toBe(0);
    expect(date.getUTCMilliseconds()).toBe(0);
  });

  it("preserves the date", () => {
    const afternoon = new Date("2025-06-15T14:30:45.123Z").getTime();
    const result = startOfDay(afternoon);
    const date = new Date(result);
    expect(date.getUTCDate()).toBe(15);
    expect(date.getUTCMonth()).toBe(5); // June
    expect(date.getUTCFullYear()).toBe(2025);
  });

  it("is idempotent", () => {
    const timestamp = new Date("2025-06-15T14:30:00Z").getTime();
    const first = startOfDay(timestamp);
    const second = startOfDay(first);
    expect(first).toBe(second);
  });
});

describe("endOfDay", () => {
  it("sets time to 23:59:59.999 UTC", () => {
    const morning = new Date("2025-06-15T08:00:00Z").getTime();
    const result = endOfDay(morning);
    const date = new Date(result);
    expect(date.getUTCHours()).toBe(23);
    expect(date.getUTCMinutes()).toBe(59);
    expect(date.getUTCSeconds()).toBe(59);
    expect(date.getUTCMilliseconds()).toBe(999);
  });

  it("preserves the date", () => {
    const morning = new Date("2025-06-15T08:00:00Z").getTime();
    const result = endOfDay(morning);
    const date = new Date(result);
    expect(date.getUTCDate()).toBe(15);
    expect(date.getUTCMonth()).toBe(5); // June
    expect(date.getUTCFullYear()).toBe(2025);
  });

  it("is idempotent", () => {
    const timestamp = new Date("2025-06-15T08:00:00Z").getTime();
    const first = endOfDay(timestamp);
    const second = endOfDay(first);
    expect(first).toBe(second);
  });

  it("endOfDay is greater than startOfDay", () => {
    const timestamp = new Date("2025-06-15T12:00:00Z").getTime();
    const start = startOfDay(timestamp);
    const end = endOfDay(timestamp);
    expect(end).toBeGreaterThan(start);
  });
});
