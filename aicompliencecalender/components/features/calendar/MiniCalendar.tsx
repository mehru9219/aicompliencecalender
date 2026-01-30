"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { STATUS_COLORS } from "@/lib/calendar/config";
import type { CalendarDeadline } from "@/lib/calendar/transformer";

interface MiniCalendarProps {
  deadlines: CalendarDeadline[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  className?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MiniCalendar({
  deadlines,
  currentMonth,
  onMonthChange,
  className,
}: MiniCalendarProps) {
  const router = useRouter();

  // Group deadlines by date
  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, CalendarDeadline[]>();
    for (const deadline of deadlines) {
      const dateKey = format(new Date(deadline.dueDate), "yyyy-MM-dd");
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(deadline);
    }
    return map;
  }, [deadlines]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  const handleDayClick = (day: Date) => {
    const dateParam = format(day, "yyyy-MM-dd");
    router.push(`/calendar?date=${dateParam}`);
  };

  return (
    <div className={cn("p-3 bg-background border rounded-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handlePrevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleNextMonth}
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-muted-foreground font-medium py-1"
          >
            {day[0]}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayDeadlines = deadlinesByDate.get(dateKey) || [];
          const hasDeadlines = dayDeadlines.length > 0;
          const hasOverdue = dayDeadlines.some(
            (d) => !d.completedAt && d.dueDate < Date.now(),
          );
          const hasDueSoon = dayDeadlines.some((d) => {
            if (d.completedAt) return false;
            const daysUntil = (d.dueDate - Date.now()) / (1000 * 60 * 60 * 24);
            return daysUntil >= 0 && daysUntil <= 7;
          });
          const inCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={dateKey}
              onClick={() => handleDayClick(day)}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-md text-xs transition-colors",
                "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                !inCurrentMonth && "text-muted-foreground/50",
                isToday(day) && "bg-primary/10 font-semibold text-primary",
                inCurrentMonth && !isToday(day) && "text-foreground",
              )}
              aria-label={`${format(day, "MMMM d, yyyy")}${hasDeadlines ? `, ${dayDeadlines.length} deadline${dayDeadlines.length > 1 ? "s" : ""}` : ""}`}
            >
              <span>{format(day, "d")}</span>
              {hasDeadlines && (
                <div className="absolute bottom-0.5 flex gap-0.5">
                  {hasOverdue && (
                    <span
                      className="size-1 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS.overdue }}
                    />
                  )}
                  {hasDueSoon && !hasOverdue && (
                    <span
                      className="size-1 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS.dueSoon }}
                    />
                  )}
                  {!hasOverdue && !hasDueSoon && (
                    <span
                      className="size-1 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS.upcoming }}
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
