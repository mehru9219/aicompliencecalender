const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Format timestamp to readable date string.
 * Uses user's locale for display.
 */
export function formatDueDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format timestamp with time.
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Get days until due date (negative if overdue).
 * Injectable `now` for testing.
 */
export function getDaysUntil(
  dueDate: number,
  now: number = Date.now(),
): number {
  return Math.ceil((dueDate - now) / MS_PER_DAY);
}

/**
 * Format relative date string for display.
 * "Due in X days", "Due today", "X days overdue"
 */
export function formatRelativeDate(
  dueDate: number,
  now: number = Date.now(),
): string {
  const days = getDaysUntil(dueDate, now);

  if (days === 0) {
    return "Due today";
  }

  if (days === 1) {
    return "Due tomorrow";
  }

  if (days === -1) {
    return "1 day overdue";
  }

  if (days > 1) {
    return `Due in ${days} days`;
  }

  return `${Math.abs(days)} days overdue`;
}

/**
 * Check if date is today.
 */
export function isToday(timestamp: number, now: number = Date.now()): boolean {
  const date = new Date(timestamp);
  const today = new Date(now);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Get start of day timestamp (midnight UTC).
 */
export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Get end of day timestamp (23:59:59.999 UTC).
 */
export function endOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setUTCHours(23, 59, 59, 999);
  return date.getTime();
}
