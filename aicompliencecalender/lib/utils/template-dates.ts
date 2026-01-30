import type { TemplateDeadline } from "@/types/template";

/**
 * Calculate the default due date for a template deadline based on its anchor type.
 *
 * - fixed_date: Uses defaultMonth/Day in current or next year (if date has passed)
 * - anniversary: Returns null (requires user input)
 * - custom: Returns null (requires user input)
 *
 * @param deadline - The template deadline definition
 * @param referenceDate - Optional reference date for calculations (defaults to now)
 * @returns The calculated due date timestamp, or null if user input is required
 */
export function calculateDefaultDueDate(
  deadline: TemplateDeadline,
  referenceDate?: Date,
): number | null {
  const today = referenceDate ?? new Date();
  today.setHours(0, 0, 0, 0);

  switch (deadline.anchorType) {
    case "fixed_date":
      return calculateFixedDate(
        deadline.defaultMonth,
        deadline.defaultDay,
        today,
      );

    case "anniversary":
      // Anniversary dates require user input (e.g., license issue date)
      return null;

    case "custom":
      // Custom dates require user input
      return null;

    default:
      return null;
  }
}

/**
 * Calculate a fixed date deadline in the current or next year.
 *
 * @param month - Month (1-12)
 * @param day - Day of month (1-31)
 * @param reference - Reference date for comparison
 * @returns The calculated timestamp, or null if month/day are not provided
 */
function calculateFixedDate(
  month: number | undefined,
  day: number | undefined,
  reference: Date,
): number | null {
  if (month === undefined || day === undefined) {
    return null;
  }

  // Validate month and day
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  let year = reference.getFullYear();

  // Create the target date
  let targetDate = new Date(year, month - 1, day);
  targetDate.setHours(23, 59, 59, 999);

  // If the date has already passed this year, use next year
  if (targetDate <= reference) {
    year++;
    targetDate = new Date(year, month - 1, day);
    targetDate.setHours(23, 59, 59, 999);
  }

  // Handle invalid dates (e.g., Feb 30)
  if (targetDate.getMonth() !== month - 1) {
    // Day was adjusted (overflow), use last day of intended month
    targetDate = new Date(year, month, 0); // Last day of month
    targetDate.setHours(23, 59, 59, 999);
  }

  return targetDate.getTime();
}

/**
 * Calculate the next occurrence of a recurring deadline.
 *
 * @param baseDate - The base date timestamp
 * @param recurrence - The recurrence configuration
 * @param afterDate - Optional date to find next occurrence after (defaults to now)
 * @returns The next occurrence timestamp
 */
export function calculateNextOccurrence(
  baseDate: number,
  recurrence: TemplateDeadline["recurrence"],
  afterDate?: Date,
): number {
  const reference = afterDate ?? new Date();
  const base = new Date(baseDate);

  switch (recurrence.type) {
    case "weekly":
      return addDays(base, reference, 7);

    case "monthly":
      return addMonths(base, reference, 1);

    case "quarterly":
      return addMonths(base, reference, 3);

    case "semi_annual":
      return addMonths(base, reference, 6);

    case "annual":
      return addYears(base, reference, 1);

    case "custom":
      if (recurrence.interval) {
        return addDays(base, reference, recurrence.interval);
      }
      return baseDate;

    default:
      return baseDate;
  }
}

/**
 * Add days to a date, finding the next occurrence after a reference date.
 */
function addDays(base: Date, reference: Date, days: number): number {
  let next = new Date(base);

  while (next <= reference) {
    next = new Date(next.getTime() + days * 24 * 60 * 60 * 1000);
  }

  return next.getTime();
}

/**
 * Add months to a date, finding the next occurrence after a reference date.
 */
function addMonths(base: Date, reference: Date, months: number): number {
  let next = new Date(base);

  while (next <= reference) {
    const currentMonth = next.getMonth();
    const currentYear = next.getFullYear();
    const currentDay = next.getDate();

    // Calculate new month and year
    const totalMonths = currentMonth + months;
    const newYear = currentYear + Math.floor(totalMonths / 12);
    const newMonth = totalMonths % 12;

    // Create new date, handling day overflow
    next = new Date(
      newYear,
      newMonth,
      Math.min(currentDay, daysInMonth(newYear, newMonth)),
    );
  }

  return next.getTime();
}

/**
 * Add years to a date, finding the next occurrence after a reference date.
 */
function addYears(base: Date, reference: Date, years: number): number {
  let next = new Date(base);

  while (next <= reference) {
    const currentYear = next.getFullYear();
    const month = next.getMonth();
    const day = next.getDate();

    const newYear = currentYear + years;

    // Handle Feb 29 on non-leap years
    const maxDay = daysInMonth(newYear, month);
    next = new Date(newYear, month, Math.min(day, maxDay));
  }

  return next.getTime();
}

/**
 * Get the number of days in a month.
 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Check if a deadline requires user input for due date.
 */
export function requiresCustomDate(deadline: TemplateDeadline): boolean {
  return (
    deadline.anchorType === "anniversary" || deadline.anchorType === "custom"
  );
}

/**
 * Format a deadline's anchor type for display.
 */
export function formatAnchorType(
  anchorType: TemplateDeadline["anchorType"],
): string {
  switch (anchorType) {
    case "fixed_date":
      return "Fixed Date (Annual)";
    case "anniversary":
      return "Anniversary-based";
    case "custom":
      return "Custom Date";
    default:
      return "Unknown";
  }
}

/**
 * Get a human-readable description of when a deadline occurs.
 */
export function describeDeadlineTiming(deadline: TemplateDeadline): string {
  const { recurrence, anchorType, defaultMonth, defaultDay } = deadline;

  let timing = "";

  // Describe recurrence
  switch (recurrence.type) {
    case "weekly":
      timing = "Weekly";
      break;
    case "monthly":
      timing = "Monthly";
      break;
    case "quarterly":
      timing = "Quarterly";
      break;
    case "semi_annual":
      timing = "Twice a year";
      break;
    case "annual":
      timing = "Annually";
      break;
    case "custom":
      if (recurrence.interval) {
        timing = `Every ${recurrence.interval} days`;
      } else {
        timing = "Custom schedule";
      }
      break;
  }

  // Add date info for fixed dates
  if (anchorType === "fixed_date" && defaultMonth && defaultDay) {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    timing += ` (${monthNames[defaultMonth - 1]} ${defaultDay})`;
  } else if (anchorType === "anniversary") {
    timing += " (from anniversary date)";
  } else if (anchorType === "custom") {
    timing += " (date varies)";
  }

  return timing;
}
