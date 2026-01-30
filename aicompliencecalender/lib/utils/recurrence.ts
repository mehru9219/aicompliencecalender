import type { Deadline, RecurrencePattern } from "@/types/deadline";

/**
 * Calculate next due date based on recurrence pattern.
 * Returns null if recurrence has ended.
 */
export function calculateNextDueDate(
  currentDueDate: number,
  recurrence: RecurrencePattern,
  completionDate?: number,
): number | null {
  const baseDate =
    recurrence.baseDate === "completion_date" && completionDate
      ? completionDate
      : currentDueDate;

  const date = new Date(baseDate);
  let nextDate: Date;

  switch (recurrence.type) {
    case "weekly":
      nextDate = addDays(date, 7);
      break;
    case "monthly":
      nextDate = addMonths(date, 1);
      break;
    case "quarterly":
      nextDate = addMonths(date, 3);
      break;
    case "semi_annual":
      nextDate = addMonths(date, 6);
      break;
    case "annual":
      nextDate = addMonths(date, 12);
      break;
    case "custom":
      if (!recurrence.interval) return null;
      nextDate = addDays(date, recurrence.interval);
      break;
    default:
      return null;
  }

  const nextTimestamp = nextDate.getTime();

  // Check if recurrence has ended
  if (recurrence.endDate && nextTimestamp > recurrence.endDate) {
    return null;
  }

  return nextTimestamp;
}

/**
 * Generate next deadline object from completed deadline.
 * Returns null if no recurrence or recurrence ended.
 */
export function generateNextDeadline(
  completed: Deadline,
): Omit<Deadline, "_id" | "_creationTime"> | null {
  if (!completed.recurrence) {
    return null;
  }

  const nextDueDate = calculateNextDueDate(
    completed.dueDate,
    completed.recurrence,
    completed.completedAt,
  );

  if (!nextDueDate) {
    return null;
  }

  return {
    orgId: completed.orgId,
    title: completed.title,
    description: completed.description,
    dueDate: nextDueDate,
    category: completed.category,
    recurrence: completed.recurrence,
    assignedTo: completed.assignedTo,
    completedAt: undefined,
    completedBy: undefined,
    deletedAt: undefined,
    createdAt: Date.now(),
    createdBy: completed.createdBy,
  };
}

/** Add days to date */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Add months handling edge cases (Jan 31 + 1 month = Feb 28) */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();

  result.setMonth(result.getMonth() + months);

  // Handle month-end overflow (e.g., Jan 31 -> Feb 28)
  if (result.getDate() !== day) {
    result.setDate(0); // Go to last day of previous month
  }

  return result;
}
