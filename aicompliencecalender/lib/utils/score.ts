/**
 * Compliance Score Calculation
 *
 * Score starts at 100 and is adjusted based on deadline statuses:
 * - Overdue: -2 per day overdue (max -20 per deadline)
 * - Due in 7 days: -5 per deadline
 * - Due in 30 days: -1 per deadline
 * - Bonus: +1 per recent on-time completion (max +10)
 *
 * Final score is clamped to 0-100 range.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DeadlineForScore {
  dueDate: number;
  completedAt?: number | null;
}

export interface ScoreBreakdown {
  score: number;
  overdueCount: number;
  overduePenalty: number;
  dueSoonCount: number;
  dueSoonPenalty: number;
  upcomingCount: number;
  upcomingPenalty: number;
  onTimeCount: number;
  onTimeBonus: number;
}

/**
 * Calculate compliance score from deadlines.
 *
 * @param deadlines - Array of deadlines with dueDate and optional completedAt
 * @param now - Current timestamp (injectable for testing)
 * @returns Compliance score (0-100)
 */
export function calculateComplianceScore(
  deadlines: DeadlineForScore[],
  now: number = Date.now(),
): number {
  const breakdown = calculateScoreBreakdown(deadlines, now);
  return breakdown.score;
}

/**
 * Calculate compliance score with detailed breakdown.
 *
 * @param deadlines - Array of deadlines with dueDate and optional completedAt
 * @param now - Current timestamp (injectable for testing)
 * @returns Score breakdown with penalties and bonuses
 */
export function calculateScoreBreakdown(
  deadlines: DeadlineForScore[],
  now: number = Date.now(),
): ScoreBreakdown {
  if (deadlines.length === 0) {
    return {
      score: 100,
      overdueCount: 0,
      overduePenalty: 0,
      dueSoonCount: 0,
      dueSoonPenalty: 0,
      upcomingCount: 0,
      upcomingPenalty: 0,
      onTimeCount: 0,
      onTimeBonus: 0,
    };
  }

  let score = 100;
  let overdueCount = 0;
  let overduePenalty = 0;
  let dueSoonCount = 0;
  let dueSoonPenalty = 0;
  let upcomingCount = 0;
  let upcomingPenalty = 0;

  // Active deadlines (not completed)
  const activeDeadlines = deadlines.filter((d) => !d.completedAt);

  for (const deadline of activeDeadlines) {
    const daysUntilDue = (deadline.dueDate - now) / DAY_MS;

    if (daysUntilDue < 0) {
      // Overdue: -2 per day overdue, max -20 per deadline
      const daysOverdue = Math.abs(daysUntilDue);
      const penalty = Math.min(20, Math.floor(daysOverdue) * 2);
      overduePenalty += penalty;
      score -= penalty;
      overdueCount++;
    } else if (daysUntilDue <= 7) {
      // Due soon (within 7 days): -5 per deadline
      dueSoonPenalty += 5;
      score -= 5;
      dueSoonCount++;
    } else if (daysUntilDue <= 30) {
      // Upcoming (within 30 days): -1 per deadline
      upcomingPenalty += 1;
      score -= 1;
      upcomingCount++;
    }
  }

  // Bonus for on-time completions in the last 30 days
  const thirtyDaysAgo = now - 30 * DAY_MS;
  const recentOnTimeCompletions = deadlines.filter(
    (d) =>
      d.completedAt &&
      d.completedAt >= thirtyDaysAgo &&
      d.completedAt <= d.dueDate,
  );

  const onTimeCount = recentOnTimeCompletions.length;
  const onTimeBonus = Math.min(10, onTimeCount);
  score += onTimeBonus;

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    overdueCount,
    overduePenalty,
    dueSoonCount,
    dueSoonPenalty,
    upcomingCount,
    upcomingPenalty,
    onTimeCount,
    onTimeBonus,
  };
}

/**
 * Get score status label based on score value.
 */
export function getScoreStatus(score: number): {
  label: string;
  color: "green" | "yellow" | "red";
} {
  if (score >= 80) {
    return { label: "Healthy", color: "green" };
  } else if (score >= 60) {
    return { label: "Needs Attention", color: "yellow" };
  } else {
    return { label: "At Risk", color: "red" };
  }
}

/**
 * Get CSS classes for score color.
 */
export function getScoreColorClasses(
  score: number,
  type: "bg" | "text" | "border" = "text",
): string {
  const status = getScoreStatus(score);

  const colorMap = {
    green: {
      bg: "bg-green-50 dark:bg-green-950",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-800",
    },
    yellow: {
      bg: "bg-amber-50 dark:bg-amber-950",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-950",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-200 dark:border-red-800",
    },
  };

  return colorMap[status.color][type];
}
