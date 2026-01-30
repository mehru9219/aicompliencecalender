import type { AlertUrgency } from "@/types/alert";
import { URGENCY_THRESHOLDS } from "@/types/alert";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Calculate urgency level based on days before deadline.
 * Injectable `now` param for testing.
 */
export function getUrgencyLevel(
  dueDate: number,
  now: number = Date.now(),
): AlertUrgency {
  const daysBefore = Math.ceil((dueDate - now) / MS_PER_DAY);

  if (daysBefore <= URGENCY_THRESHOLDS.critical) {
    return "critical";
  }
  if (daysBefore <= URGENCY_THRESHOLDS.high) {
    return "high";
  }
  if (daysBefore <= URGENCY_THRESHOLDS.medium) {
    return "medium";
  }
  return "early";
}

/**
 * Get urgency level from days before deadline (convenience function).
 */
export function getUrgencyFromDays(daysBefore: number): AlertUrgency {
  if (daysBefore <= URGENCY_THRESHOLDS.critical) {
    return "critical";
  }
  if (daysBefore <= URGENCY_THRESHOLDS.high) {
    return "high";
  }
  if (daysBefore <= URGENCY_THRESHOLDS.medium) {
    return "medium";
  }
  return "early";
}

/**
 * Get channels for a given urgency level from preferences.
 */
export function getChannelsForUrgency(
  urgency: AlertUrgency,
  preferences: {
    earlyChannels: string[];
    mediumChannels: string[];
    highChannels: string[];
    criticalChannels: string[];
  },
): string[] {
  switch (urgency) {
    case "critical":
      return preferences.criticalChannels;
    case "high":
      return preferences.highChannels;
    case "medium":
      return preferences.mediumChannels;
    case "early":
      return preferences.earlyChannels;
  }
}

/**
 * Get urgency color for styling.
 */
export function getUrgencyColor(urgency: AlertUrgency): string {
  switch (urgency) {
    case "critical":
      return "bg-red-600 text-white";
    case "high":
      return "bg-orange-500 text-white";
    case "medium":
      return "bg-yellow-500 text-black";
    case "early":
      return "bg-blue-500 text-white";
  }
}

/**
 * Get urgency label for display.
 */
export function getUrgencyLabel(urgency: AlertUrgency): string {
  switch (urgency) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "early":
      return "Early";
  }
}
