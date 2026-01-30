"use client";

import React, { forwardRef } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from "date-fns";
import type { CalendarDeadline } from "@/lib/calendar/transformer";

interface CalendarPrintViewProps {
  deadlines: CalendarDeadline[];
  currentMonth: Date;
  organizationName?: string;
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const CalendarPrintView = forwardRef<
  HTMLDivElement,
  CalendarPrintViewProps
>(function CalendarPrintView(
  { deadlines, currentMonth, organizationName },
  ref,
) {
  // Group deadlines by date
  const deadlinesByDate = React.useMemo(() => {
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
  const calendarWeeks = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      day = addDays(day, 1);
    }

    return weeks;
  }, [currentMonth]);

  const today = new Date();

  return (
    <div
      ref={ref}
      className="p-8 bg-white text-black print:p-4"
      style={{ minHeight: "100vh" }}
    >
      {/* Header */}
      <div className="text-center mb-6 print:mb-4">
        {organizationName && (
          <p className="text-sm text-gray-600 mb-1">{organizationName}</p>
        )}
        <h1 className="text-2xl font-bold">
          {format(currentMonth, "MMMM yyyy")}
        </h1>
        <p className="text-sm text-gray-500">Compliance Calendar</p>
      </div>

      {/* Calendar Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {WEEKDAYS.map((day) => (
              <th
                key={day}
                className="border border-gray-300 bg-gray-100 p-2 text-sm font-medium text-center"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calendarWeeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayDeadlines = deadlinesByDate.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, today);

                return (
                  <td
                    key={dateKey}
                    className={`border border-gray-300 p-1 align-top h-24 print:h-20 ${
                      !isCurrentMonth ? "bg-gray-50" : ""
                    }`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        !isCurrentMonth
                          ? "text-gray-400"
                          : isToday
                            ? "bg-black text-white rounded-full w-6 h-6 flex items-center justify-center"
                            : ""
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayDeadlines.slice(0, 4).map((deadline) => (
                        <div
                          key={deadline._id}
                          className={`text-xs truncate px-1 py-0.5 rounded ${
                            deadline.completedAt
                              ? "line-through text-gray-400"
                              : deadline.dueDate < Date.now()
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                          title={deadline.title}
                        >
                          {deadline.title}
                        </div>
                      ))}
                      {dayDeadlines.length > 4 && (
                        <div className="text-xs text-gray-500 px-1">
                          +{dayDeadlines.length - 4} more
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-500 print:mt-4">
        <span>Generated: {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</span>
        <span>AI Compliance Calendar</span>
      </div>

      {/* Legend */}
      <div className="mt-4 flex gap-6 text-xs print:mt-2">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-100 rounded" />
          <span>Upcoming</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-100 rounded" />
          <span>Overdue</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-gray-100 rounded line-through" />
          <span>Completed</span>
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5in;
          }

          table {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
});
