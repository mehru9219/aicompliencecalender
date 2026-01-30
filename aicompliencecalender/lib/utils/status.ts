import type { Deadline, DeadlineStatus } from "@/types/deadline";
import { DUE_SOON_DAYS } from "@/types/deadline";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Calculate deadline status from due date and completion state.
 * Injectable `now` param for testing.
 */
export function calculateStatus(
  deadline: Pick<Deadline, "dueDate" | "completedAt">,
  now: number = Date.now(),
): DeadlineStatus {
  if (deadline.completedAt) {
    return "completed";
  }

  const daysUntilDue = (deadline.dueDate - now) / MS_PER_DAY;

  if (daysUntilDue < 0) {
    return "overdue";
  }

  if (daysUntilDue <= DUE_SOON_DAYS) {
    return "due_soon";
  }

  return "upcoming";
}

/**
 * Get status color class for Tailwind
 */
export function getStatusColor(status: DeadlineStatus): string {
  switch (status) {
    case "overdue":
      return "bg-status-overdue text-white";
    case "due_soon":
      return "bg-status-due-soon text-black";
    case "upcoming":
      return "bg-status-upcoming text-white";
    case "completed":
      return "bg-status-completed text-white";
  }
}

/**
 * Get status label for display
 */
export function getStatusLabel(status: DeadlineStatus): string {
  switch (status) {
    case "overdue":
      return "Overdue";
    case "due_soon":
      return "Due Soon";
    case "upcoming":
      return "Upcoming";
    case "completed":
      return "Completed";
  }
}
