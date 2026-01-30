"use client";

import { cn } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/calendar/config";
import type { EventStatus } from "@/lib/calendar/transformer";

interface StatusDotProps {
  status: EventStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "size-1.5",
  md: "size-2",
  lg: "size-2.5",
} as const;

const statusLabels: Record<EventStatus, string> = {
  completed: "Completed",
  overdue: "Overdue",
  dueSoon: "Due soon",
  upcoming: "Upcoming",
};

export function StatusDot({ status, size = "md", className }: StatusDotProps) {
  const color = STATUS_COLORS[status];
  const label = statusLabels[status];

  return (
    <span
      className={cn(
        "inline-block rounded-full shrink-0",
        sizeClasses[size],
        className,
      )}
      style={{ backgroundColor: color }}
      role="img"
      aria-label={label}
      title={label}
    />
  );
}
