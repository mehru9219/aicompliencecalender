import { describe, it, expect } from "vitest";
import {
  calculateStatus,
  getStatusColor,
  getStatusLabel,
} from "../../lib/utils/status";
import { DUE_SOON_DAYS } from "../../types/deadline";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

describe("calculateStatus", () => {
  const NOW = new Date("2025-06-15T12:00:00Z").getTime();

  describe("completed status", () => {
    it("returns completed when completedAt exists", () => {
      const deadline = {
        dueDate: NOW - 5 * MS_PER_DAY, // overdue
        completedAt: NOW - 1 * MS_PER_DAY,
      };
      expect(calculateStatus(deadline, NOW)).toBe("completed");
    });

    it("returns completed regardless of due date if completedAt exists", () => {
      const deadline = {
        dueDate: NOW + 30 * MS_PER_DAY, // far future
        completedAt: NOW,
      };
      expect(calculateStatus(deadline, NOW)).toBe("completed");
    });
  });

  describe("overdue status", () => {
    it("returns overdue when past due and not completed", () => {
      const deadline = {
        dueDate: NOW - 1 * MS_PER_DAY,
        completedAt: undefined,
      };
      expect(calculateStatus(deadline, NOW)).toBe("overdue");
    });

    it("returns overdue for deadline due yesterday", () => {
      const deadline = {
        dueDate: NOW - MS_PER_DAY,
        completedAt: undefined,
      };
      expect(calculateStatus(deadline, NOW)).toBe("overdue");
    });

    it("returns overdue for deadline past by 1 second", () => {
      const deadline = {
        dueDate: NOW - 1000,
        completedAt: undefined,
      };
      expect(calculateStatus(deadline, NOW)).toBe("overdue");
    });
  });

  describe("due_soon status", () => {
    it("returns due_soon when within DUE_SOON_DAYS threshold", () => {
      const deadline = {
        dueDate: NOW + 7 * MS_PER_DAY,
        completedAt: undefined,
      };
      expect(calculateStatus(deadline, NOW)).toBe("due_soon");
    });

    it("returns due_soon at exactly DUE_SOON_DAYS boundary", () => {
      const deadline = {
        dueDate: NOW + DUE_SOON_DAYS * MS_PER_DAY,
        completedAt: undefined,
      };
      expect(calculateStatus(deadline, NOW)).toBe("due_soon");
    });

    it("returns due_soon for due today", () => {
      const deadline = {
        dueDate: NOW + 1000, // 1 second from now
        completedAt: undefined,
      };
      expect(calculateStatus(deadline, NOW)).toBe("due_soon");
    });

    it("returns due_soon for due at exactly now", () => {
      const deadline = {
        dueDate: NOW,
        completedAt: undefined,
      };
      expect(calculateStatus(deadline, NOW)).toBe("due_soon");
    });
  });

  describe("upcoming status", () => {
    it("returns upcoming when more than DUE_SOON_DAYS out", () => {
      const deadline = {
        dueDate: NOW + (DUE_SOON_DAYS + 1) * MS_PER_DAY,
        completedAt: undefined,
      };
      expect(calculateStatus(deadline, NOW)).toBe("upcoming");
    });

    it("returns upcoming for far future deadline", () => {
      const deadline = {
        dueDate: NOW + 365 * MS_PER_DAY,
        completedAt: undefined,
      };
      expect(calculateStatus(deadline, NOW)).toBe("upcoming");
    });
  });

  describe("edge cases", () => {
    it("uses current time when now is not provided", () => {
      const futureDeadline = {
        dueDate: Date.now() + 30 * MS_PER_DAY,
        completedAt: undefined,
      };
      expect(calculateStatus(futureDeadline)).toBe("upcoming");
    });

    it("handles midnight boundary correctly", () => {
      const midnight = new Date("2025-06-15T00:00:00Z").getTime();
      const deadline = {
        dueDate: midnight,
        completedAt: undefined,
      };
      // At midnight, should be due_soon (same day)
      expect(calculateStatus(deadline, midnight)).toBe("due_soon");
    });
  });
});

describe("getStatusColor", () => {
  it("returns correct color for overdue", () => {
    expect(getStatusColor("overdue")).toBe("bg-status-overdue text-white");
  });

  it("returns correct color for due_soon", () => {
    expect(getStatusColor("due_soon")).toBe("bg-status-due-soon text-black");
  });

  it("returns correct color for upcoming", () => {
    expect(getStatusColor("upcoming")).toBe("bg-status-upcoming text-white");
  });

  it("returns correct color for completed", () => {
    expect(getStatusColor("completed")).toBe("bg-status-completed text-white");
  });
});

describe("getStatusLabel", () => {
  it("returns correct label for overdue", () => {
    expect(getStatusLabel("overdue")).toBe("Overdue");
  });

  it("returns correct label for due_soon", () => {
    expect(getStatusLabel("due_soon")).toBe("Due Soon");
  });

  it("returns correct label for upcoming", () => {
    expect(getStatusLabel("upcoming")).toBe("Upcoming");
  });

  it("returns correct label for completed", () => {
    expect(getStatusLabel("completed")).toBe("Completed");
  });
});
