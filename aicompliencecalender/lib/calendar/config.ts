/**
 * FullCalendar configuration for compliance calendar.
 */

import type { CalendarOptions } from "@fullcalendar/core";

// Status colors - matches dashboard color scheme
export const STATUS_COLORS = {
  completed: "#22c55e", // green-500
  overdue: "#ef4444", // red-500
  dueSoon: "#f97316", // orange-500
  upcoming: "#3b82f6", // blue-500
} as const;

// Category colors for visual distinction
export const CATEGORY_COLORS: Record<string, string> = {
  licenses: "#8b5cf6", // purple
  certifications: "#06b6d4", // cyan
  training: "#ec4899", // pink
  reporting: "#f59e0b", // amber
  insurance: "#14b8a6", // teal
  other: "#6b7280", // gray
} as const;

// Days threshold for "due soon" status
export const DUE_SOON_DAYS = 7;

// Base calendar options
export const baseCalendarOptions: Partial<CalendarOptions> = {
  initialView: "dayGridMonth",
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,listMonth",
  },
  buttonText: {
    today: "Today",
    month: "Month",
    week: "Week",
    list: "List",
  },
  // Event display options
  eventDisplay: "block",
  eventTimeFormat: {
    hour: "numeric",
    minute: "2-digit",
    meridiem: "short",
  },
  // Day/date options
  dayMaxEvents: 3, // Show max 3 events, then "+X more"
  moreLinkClick: "popover",
  navLinks: true,
  nowIndicator: true,
  // Interaction options
  selectable: true,
  selectMirror: true,
  // Accessibility
  weekNumbers: false,
  fixedWeekCount: false,
  // Performance
  lazyFetching: true,
};

// View-specific options
export const viewOptions = {
  dayGridMonth: {
    titleFormat: { year: "numeric", month: "long" },
  },
  timeGridWeek: {
    titleFormat: { year: "numeric", month: "short", day: "numeric" },
    slotMinTime: "08:00:00",
    slotMaxTime: "18:00:00",
    allDaySlot: true,
  },
  listMonth: {
    titleFormat: { year: "numeric", month: "long" },
    noEventsMessage: "No deadlines this month",
  },
} as const;
