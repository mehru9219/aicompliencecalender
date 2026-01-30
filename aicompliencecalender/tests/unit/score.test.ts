import { describe, it, expect } from "vitest";
import {
  calculateComplianceScore,
  calculateScoreBreakdown,
  getScoreStatus,
  getScoreColorClasses,
  type DeadlineForScore,
} from "@/lib/utils/score";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("calculateComplianceScore", () => {
  const baseNow = new Date("2025-06-15T12:00:00Z").getTime();

  it("returns 100 for empty deadlines", () => {
    const score = calculateComplianceScore([], baseNow);
    expect(score).toBe(100);
  });

  it("returns 100 for all completed deadlines", () => {
    const deadlines: DeadlineForScore[] = [
      { dueDate: baseNow - 5 * DAY_MS, completedAt: baseNow - 6 * DAY_MS },
      { dueDate: baseNow - 10 * DAY_MS, completedAt: baseNow - 11 * DAY_MS },
    ];
    const score = calculateComplianceScore(deadlines, baseNow);
    // +2 for on-time completions, capped at 100
    expect(score).toBe(100);
  });

  it("penalizes overdue deadlines at -2 per day", () => {
    // 5 days overdue = -10 penalty
    const deadlines: DeadlineForScore[] = [{ dueDate: baseNow - 5 * DAY_MS }];
    const score = calculateComplianceScore(deadlines, baseNow);
    expect(score).toBe(90); // 100 - 10
  });

  it("caps overdue penalty at -20 per deadline", () => {
    // 15 days overdue = -30, but capped at -20
    const deadlines: DeadlineForScore[] = [{ dueDate: baseNow - 15 * DAY_MS }];
    const score = calculateComplianceScore(deadlines, baseNow);
    expect(score).toBe(80); // 100 - 20 (capped)
  });

  it("penalizes items due within 7 days at -5 per deadline", () => {
    const deadlines: DeadlineForScore[] = [
      { dueDate: baseNow + 3 * DAY_MS }, // Due in 3 days
      { dueDate: baseNow + 5 * DAY_MS }, // Due in 5 days
    ];
    const score = calculateComplianceScore(deadlines, baseNow);
    expect(score).toBe(90); // 100 - 5 - 5
  });

  it("penalizes items due within 30 days at -1 per deadline", () => {
    const deadlines: DeadlineForScore[] = [
      { dueDate: baseNow + 15 * DAY_MS }, // Due in 15 days
      { dueDate: baseNow + 20 * DAY_MS }, // Due in 20 days
      { dueDate: baseNow + 25 * DAY_MS }, // Due in 25 days
    ];
    const score = calculateComplianceScore(deadlines, baseNow);
    expect(score).toBe(97); // 100 - 1 - 1 - 1
  });

  it("does not penalize items due beyond 30 days", () => {
    const deadlines: DeadlineForScore[] = [
      { dueDate: baseNow + 60 * DAY_MS }, // Due in 60 days
      { dueDate: baseNow + 90 * DAY_MS }, // Due in 90 days
    ];
    const score = calculateComplianceScore(deadlines, baseNow);
    expect(score).toBe(100);
  });

  it("adds bonus for recent on-time completions (+1 each, max +10)", () => {
    // Multiple on-time completions in last 30 days
    const deadlines: DeadlineForScore[] = Array.from(
      { length: 15 },
      (_, i) => ({
        dueDate: baseNow - (i + 1) * DAY_MS,
        completedAt: baseNow - (i + 2) * DAY_MS, // Completed 1 day before due
      }),
    );
    const score = calculateComplianceScore(deadlines, baseNow);
    // Only completions within last 30 days count
    // Bonus capped at +10, so score is 100
    expect(score).toBe(100);
  });

  it("handles mixed scenarios correctly", () => {
    const deadlines: DeadlineForScore[] = [
      { dueDate: baseNow - 3 * DAY_MS }, // Overdue 3 days = -6
      { dueDate: baseNow + 2 * DAY_MS }, // Due in 2 days = -5
      { dueDate: baseNow + 15 * DAY_MS }, // Due in 15 days = -1
      { dueDate: baseNow - 5 * DAY_MS, completedAt: baseNow - 6 * DAY_MS }, // On-time = +1
    ];
    const score = calculateComplianceScore(deadlines, baseNow);
    // 100 - 6 - 5 - 1 + 1 = 89
    expect(score).toBe(89);
  });

  it("clamps score to minimum of 0", () => {
    // Many severely overdue items
    const deadlines: DeadlineForScore[] = Array.from({ length: 10 }, () => ({
      dueDate: baseNow - 15 * DAY_MS, // Each -20 penalty
    }));
    const score = calculateComplianceScore(deadlines, baseNow);
    expect(score).toBe(0); // 100 - 200 = -100, clamped to 0
  });

  it("clamps score to maximum of 100", () => {
    // Many on-time completions with no active deadlines
    const deadlines: DeadlineForScore[] = Array.from(
      { length: 20 },
      (_, i) => ({
        dueDate: baseNow - (i + 1) * DAY_MS,
        completedAt: baseNow - (i + 2) * DAY_MS,
      }),
    );
    const score = calculateComplianceScore(deadlines, baseNow);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("ignores on-time completions older than 30 days", () => {
    const deadlines: DeadlineForScore[] = [
      {
        dueDate: baseNow - 45 * DAY_MS,
        completedAt: baseNow - 46 * DAY_MS, // On-time but > 30 days ago
      },
    ];
    const score = calculateComplianceScore(deadlines, baseNow);
    // No bonus for old completion
    expect(score).toBe(100);
  });

  it("does not count late completions as bonus", () => {
    const deadlines: DeadlineForScore[] = [
      {
        dueDate: baseNow - 10 * DAY_MS,
        completedAt: baseNow - 5 * DAY_MS, // Completed 5 days AFTER due
      },
    ];
    const score = calculateComplianceScore(deadlines, baseNow);
    // No bonus for late completion
    expect(score).toBe(100);
  });

  it("uses injectable now parameter for testing", () => {
    const customNow = new Date("2024-01-01T00:00:00Z").getTime();
    const deadlines: DeadlineForScore[] = [
      { dueDate: customNow + 5 * DAY_MS }, // Due in 5 days from customNow
    ];

    // With customNow, should be due soon (-5)
    const scoreWithCustomNow = calculateComplianceScore(deadlines, customNow);
    expect(scoreWithCustomNow).toBe(95);

    // With different now, might be overdue
    const laterNow = customNow + 10 * DAY_MS;
    const scoreWithLaterNow = calculateComplianceScore(deadlines, laterNow);
    expect(scoreWithLaterNow).toBe(90); // 5 days overdue = -10
  });
});

describe("calculateScoreBreakdown", () => {
  const baseNow = new Date("2025-06-15T12:00:00Z").getTime();

  it("returns complete breakdown for empty deadlines", () => {
    const breakdown = calculateScoreBreakdown([], baseNow);
    expect(breakdown).toEqual({
      score: 100,
      overdueCount: 0,
      overduePenalty: 0,
      dueSoonCount: 0,
      dueSoonPenalty: 0,
      upcomingCount: 0,
      upcomingPenalty: 0,
      onTimeCount: 0,
      onTimeBonus: 0,
    });
  });

  it("tracks overdue items correctly", () => {
    const deadlines: DeadlineForScore[] = [
      { dueDate: baseNow - 3 * DAY_MS }, // 3 days overdue
      { dueDate: baseNow - 5 * DAY_MS }, // 5 days overdue
    ];
    const breakdown = calculateScoreBreakdown(deadlines, baseNow);
    expect(breakdown.overdueCount).toBe(2);
    expect(breakdown.overduePenalty).toBe(6 + 10); // 3*2 + 5*2
    expect(breakdown.score).toBe(100 - 16);
  });

  it("tracks due soon items correctly", () => {
    const deadlines: DeadlineForScore[] = [
      { dueDate: baseNow + 2 * DAY_MS },
      { dueDate: baseNow + 5 * DAY_MS },
    ];
    const breakdown = calculateScoreBreakdown(deadlines, baseNow);
    expect(breakdown.dueSoonCount).toBe(2);
    expect(breakdown.dueSoonPenalty).toBe(10); // 5 + 5
    expect(breakdown.score).toBe(90);
  });

  it("tracks upcoming items correctly", () => {
    const deadlines: DeadlineForScore[] = [
      { dueDate: baseNow + 10 * DAY_MS },
      { dueDate: baseNow + 20 * DAY_MS },
    ];
    const breakdown = calculateScoreBreakdown(deadlines, baseNow);
    expect(breakdown.upcomingCount).toBe(2);
    expect(breakdown.upcomingPenalty).toBe(2); // 1 + 1
    expect(breakdown.score).toBe(98);
  });

  it("tracks on-time bonus correctly", () => {
    const deadlines: DeadlineForScore[] = [
      { dueDate: baseNow - 5 * DAY_MS, completedAt: baseNow - 6 * DAY_MS },
      { dueDate: baseNow - 10 * DAY_MS, completedAt: baseNow - 11 * DAY_MS },
    ];
    const breakdown = calculateScoreBreakdown(deadlines, baseNow);
    expect(breakdown.onTimeCount).toBe(2);
    expect(breakdown.onTimeBonus).toBe(2);
    expect(breakdown.score).toBe(100); // 100 + 2 capped at 100
  });
});

describe("getScoreStatus", () => {
  it("returns Healthy/green for score >= 80", () => {
    expect(getScoreStatus(100)).toEqual({ label: "Healthy", color: "green" });
    expect(getScoreStatus(80)).toEqual({ label: "Healthy", color: "green" });
    expect(getScoreStatus(95)).toEqual({ label: "Healthy", color: "green" });
  });

  it("returns Needs Attention/yellow for score 60-79", () => {
    expect(getScoreStatus(79)).toEqual({
      label: "Needs Attention",
      color: "yellow",
    });
    expect(getScoreStatus(60)).toEqual({
      label: "Needs Attention",
      color: "yellow",
    });
    expect(getScoreStatus(70)).toEqual({
      label: "Needs Attention",
      color: "yellow",
    });
  });

  it("returns At Risk/red for score < 60", () => {
    expect(getScoreStatus(59)).toEqual({ label: "At Risk", color: "red" });
    expect(getScoreStatus(0)).toEqual({ label: "At Risk", color: "red" });
    expect(getScoreStatus(30)).toEqual({ label: "At Risk", color: "red" });
  });
});

describe("getScoreColorClasses", () => {
  it("returns correct bg classes for each status", () => {
    expect(getScoreColorClasses(90, "bg")).toContain("bg-green");
    expect(getScoreColorClasses(70, "bg")).toContain("bg-amber");
    expect(getScoreColorClasses(50, "bg")).toContain("bg-red");
  });

  it("returns correct text classes for each status", () => {
    expect(getScoreColorClasses(90, "text")).toContain("text-green");
    expect(getScoreColorClasses(70, "text")).toContain("text-amber");
    expect(getScoreColorClasses(50, "text")).toContain("text-red");
  });

  it("returns correct border classes for each status", () => {
    expect(getScoreColorClasses(90, "border")).toContain("border-green");
    expect(getScoreColorClasses(70, "border")).toContain("border-amber");
    expect(getScoreColorClasses(50, "border")).toContain("border-red");
  });

  it("defaults to text classes", () => {
    expect(getScoreColorClasses(90)).toContain("text-green");
  });
});
