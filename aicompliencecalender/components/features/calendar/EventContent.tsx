"use client";

import type { EventContentArg } from "@fullcalendar/core";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusDot } from "./StatusDot";
import type { EventStatus, CalendarDeadline } from "@/lib/calendar/transformer";

interface EventExtendedProps {
  deadline: CalendarDeadline;
  status: EventStatus;
  category: string;
  assignedTo: string | null;
  isCompleted: boolean;
}

export function EventContent({ eventInfo }: { eventInfo: EventContentArg }) {
  const { status, category, isCompleted } = eventInfo.event
    .extendedProps as EventExtendedProps;
  const title = eventInfo.event.title;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex items-center gap-1.5 w-full overflow-hidden px-1 py-0.5 cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={`${title} - ${status}`}
          >
            <StatusDot status={status} size="sm" />
            <span
              className={`text-xs truncate ${isCompleted ? "line-through opacity-70" : ""}`}
            >
              {title}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{title}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {category} | {status.replace(/([A-Z])/g, " $1").toLowerCase()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Factory function to create event content renderer for FullCalendar.
 * Use this as the eventContent prop in FullCalendar.
 */
export function renderEventContent(eventInfo: EventContentArg) {
  return <EventContent eventInfo={eventInfo} />;
}
