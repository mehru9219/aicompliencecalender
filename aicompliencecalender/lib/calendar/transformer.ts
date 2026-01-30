/**
 * Transform deadlines into FullCalendar events.
 */

import type { EventInput } from "@fullcalendar/core";
import { STATUS_COLORS, DUE_SOON_DAYS } from "./config";
import type { Id } from "@/convex/_generated/dataModel";

// Deadline type from calendar query
export interface CalendarDeadline {
  _id: Id<"deadlines">;
  title: string;
  dueDate: number;
  category: string;
  completedAt: number | null;
  assignedTo: string | null;
  description: string | null;
  recurrence: {
    type:
      | "weekly"
      | "monthly"
      | "quarterly"
      | "semi_annual"
      | "annual"
      | "custom";
    interval?: number;
  } | null;
}

// Filter options
export interface CalendarFilters {
  categories?: string[];
  assignedTo?: string | null;
  showCompleted?: boolean;
  searchQuery?: string;
}

// Event status for coloring
export type EventStatus = "completed" | "overdue" | "dueSoon" | "upcoming";

/**
 * Get status of a deadline based on completion and due date.
 */
export function getDeadlineStatus(
  deadline: CalendarDeadline,
  now: number = Date.now(),
): EventStatus {
  if (deadline.completedAt) {
    return "completed";
  }

  const daysUntilDue = (deadline.dueDate - now) / (1000 * 60 * 60 * 24);

  if (daysUntilDue < 0) {
    return "overdue";
  }

  if (daysUntilDue <= DUE_SOON_DAYS) {
    return "dueSoon";
  }

  return "upcoming";
}

/**
 * Get color for a deadline status.
 */
export function getStatusColor(status: EventStatus): string {
  return STATUS_COLORS[status];
}

/**
 * Check if deadline matches filters.
 */
export function matchesFilters(
  deadline: CalendarDeadline,
  filters: CalendarFilters,
): boolean {
  // Category filter
  if (filters.categories && filters.categories.length > 0) {
    if (!filters.categories.includes(deadline.category)) {
      return false;
    }
  }

  // Assigned to filter
  if (filters.assignedTo !== undefined && filters.assignedTo !== null) {
    if (deadline.assignedTo !== filters.assignedTo) {
      return false;
    }
  }

  // Show completed filter
  if (filters.showCompleted === false) {
    if (deadline.completedAt) {
      return false;
    }
  }

  // Search query filter
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    if (!deadline.title.toLowerCase().includes(query)) {
      return false;
    }
  }

  return true;
}

/**
 * Transform a single deadline into a FullCalendar event.
 */
export function transformDeadlineToEvent(
  deadline: CalendarDeadline,
  now: number = Date.now(),
): EventInput {
  const status = getDeadlineStatus(deadline, now);
  const color = getStatusColor(status);

  return {
    id: deadline._id,
    title: deadline.title,
    start: new Date(deadline.dueDate),
    allDay: true,
    backgroundColor: color,
    borderColor: color,
    textColor: "#ffffff",
    classNames: [
      `deadline-${status}`,
      deadline.completedAt ? "deadline-completed" : "",
    ].filter(Boolean),
    extendedProps: {
      deadline,
      status,
      category: deadline.category,
      assignedTo: deadline.assignedTo,
      isCompleted: !!deadline.completedAt,
    },
  };
}

/**
 * Transform deadlines array into FullCalendar events with filtering.
 */
export function transformToEvents(
  deadlines: CalendarDeadline[],
  filters: CalendarFilters = {},
  now: number = Date.now(),
): EventInput[] {
  return deadlines
    .filter((d) => matchesFilters(d, filters))
    .map((d) => transformDeadlineToEvent(d, now));
}

/**
 * Calculate next occurrence date for recurring deadline.
 */
export function calculateNextOccurrence(
  currentDate: number,
  recurrence: NonNullable<CalendarDeadline["recurrence"]>,
): number {
  const date = new Date(currentDate);

  switch (recurrence.type) {
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "semi_annual":
      date.setMonth(date.getMonth() + 6);
      break;
    case "annual":
      date.setFullYear(date.getFullYear() + 1);
      break;
    case "custom":
      date.setDate(date.getDate() + (recurrence.interval || 30));
      break;
  }

  return date.getTime();
}

/**
 * Get recurring events (current + next 2 occurrences).
 */
export function getRecurringEvents(
  deadline: CalendarDeadline,
  now: number = Date.now(),
): EventInput[] {
  const events: EventInput[] = [transformDeadlineToEvent(deadline, now)];

  if (!deadline.recurrence || deadline.completedAt) {
    return events;
  }

  let nextDate = deadline.dueDate;
  for (let i = 0; i < 2; i++) {
    nextDate = calculateNextOccurrence(nextDate, deadline.recurrence);

    const futureDeadline: CalendarDeadline = {
      ...deadline,
      dueDate: nextDate,
    };

    const event = transformDeadlineToEvent(futureDeadline, now);
    // Mark future occurrences as faded
    event.classNames = [
      ...(event.classNames || []),
      "deadline-future-occurrence",
    ];
    event.backgroundColor = event.backgroundColor + "80"; // Add alpha for transparency

    events.push(event);
  }

  return events;
}

/**
 * Transform deadlines including recurring event expansion.
 */
export function transformToEventsWithRecurrence(
  deadlines: CalendarDeadline[],
  filters: CalendarFilters = {},
  now: number = Date.now(),
): EventInput[] {
  const filtered = deadlines.filter((d) => matchesFilters(d, filters));

  const events: EventInput[] = [];
  for (const deadline of filtered) {
    if (deadline.recurrence && !deadline.completedAt) {
      events.push(...getRecurringEvents(deadline, now));
    } else {
      events.push(transformDeadlineToEvent(deadline, now));
    }
  }

  return events;
}

/**
 * Group deadlines by date for agenda/print views.
 */
export function groupDeadlinesByDate(
  deadlines: CalendarDeadline[],
): Map<string, CalendarDeadline[]> {
  const groups = new Map<string, CalendarDeadline[]>();

  for (const deadline of deadlines) {
    const dateKey = new Date(deadline.dueDate).toISOString().split("T")[0];
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(deadline);
  }

  // Sort deadlines within each day by title
  for (const [, deadlines] of groups) {
    deadlines.sort((a, b) => a.title.localeCompare(b.title));
  }

  return groups;
}
