"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventClickArg,
  EventDropArg,
  DateSelectArg,
} from "@fullcalendar/core";
import { toast } from "sonner";
import { Printer, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useOrgContext } from "@/components/providers/OrgProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarFilters,
  DeadlineQuickView,
  renderEventContent,
  CalendarExportMenu,
  CalendarPrintView,
} from "@/components/features/calendar";
import { baseCalendarOptions, viewOptions } from "@/lib/calendar/config";
import {
  transformToEventsWithRecurrence,
  type CalendarFilters as FilterType,
  type CalendarDeadline,
  type EventStatus,
} from "@/lib/calendar/transformer";
import { format } from "date-fns";

export default function CalendarPage() {
  const { orgId, isLoading: orgLoading } = useOrgContext();
  const searchParams = useSearchParams();
  const calendarRef = useRef<FullCalendar>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Parse initial filters from URL
  const initialFilters: FilterType = useMemo(() => {
    const categories = searchParams.get("categories");
    const assignedTo = searchParams.get("assignedTo");
    const showCompleted = searchParams.get("showCompleted");

    return {
      categories: categories ? categories.split(",") : [],
      assignedTo: assignedTo || null,
      showCompleted: showCompleted !== "false",
      searchQuery: searchParams.get("q") || "",
    };
  }, [searchParams]);

  // State
  const [filters, setFilters] = useState<FilterType>(initialFilters);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDeadline, setSelectedDeadline] =
    useState<CalendarDeadline | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | null>(
    null,
  );
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [rescheduleDialog, setRescheduleDialog] = useState<{
    open: boolean;
    deadline: CalendarDeadline | null;
    newDate: Date | null;
    revertFunc: (() => void) | null;
  }>({ open: false, deadline: null, newDate: null, revertFunc: null });

  // Queries - skip if no org selected
  const deadlines = useQuery(
    api.calendar.listForCalendar,
    orgId ? { orgId, includeCompleted: filters.showCompleted } : "skip"
  );

  const categories = useQuery(
    api.calendar.getCategories,
    orgId ? { orgId } : "skip"
  );

  const assignees = useQuery(
    api.calendar.getAssignees,
    orgId ? { orgId } : "skip"
  );

  // Mutations
  const updateDeadline = useMutation(api.deadlines.update);
  const completeDeadline = useMutation(api.deadlines.complete);

  // Transform deadlines to events
  const events = useMemo(() => {
    if (!deadlines) return [];
    return transformToEventsWithRecurrence(deadlines, filters);
  }, [deadlines, filters]);

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Calendar-${format(currentMonth, "yyyy-MM")}`,
  });

  // Event click handler
  const handleEventClick = useCallback((info: EventClickArg) => {
    const { deadline, status } = info.event.extendedProps as {
      deadline: CalendarDeadline;
      status: EventStatus;
    };
    setSelectedDeadline(deadline);
    setSelectedStatus(status);
    setQuickViewOpen(true);
  }, []);

  // Event drop handler (drag and drop rescheduling)
  const handleEventDrop = useCallback((info: EventDropArg) => {
    const { deadline } = info.event.extendedProps as {
      deadline: CalendarDeadline;
    };

    if (!info.event.start) {
      info.revert();
      return;
    }

    // Show confirmation dialog
    setRescheduleDialog({
      open: true,
      deadline,
      newDate: info.event.start,
      revertFunc: info.revert,
    });
  }, []);

  // Confirm reschedule
  const handleConfirmReschedule = useCallback(async () => {
    const { deadline, newDate } = rescheduleDialog;
    if (!deadline || !newDate) return;

    try {
      await updateDeadline({
        id: deadline._id,
        dueDate: newDate.getTime(),
        userId: "current-user", // TODO: Replace with actual user ID from auth
      });
      toast.success("Deadline rescheduled", {
        description: `${deadline.title} moved to ${format(newDate, "MMMM d, yyyy")}`,
      });
    } catch {
      toast.error("Failed to reschedule", {
        description: "Please try again",
      });
      rescheduleDialog.revertFunc?.();
    } finally {
      setRescheduleDialog({
        open: false,
        deadline: null,
        newDate: null,
        revertFunc: null,
      });
    }
  }, [rescheduleDialog, updateDeadline]);

  // Cancel reschedule
  const handleCancelReschedule = useCallback(() => {
    rescheduleDialog.revertFunc?.();
    setRescheduleDialog({
      open: false,
      deadline: null,
      newDate: null,
      revertFunc: null,
    });
  }, [rescheduleDialog]);

  // Date select handler (for creating new deadline)
  const handleDateSelect = useCallback((info: DateSelectArg) => {
    // Navigate to new deadline page with date pre-filled
    const date = info.start.toISOString().split("T")[0];
    window.location.href = `/dashboard/deadlines/new?date=${date}`;
  }, []);

  // Mark complete handler
  const handleMarkComplete = useCallback(
    async (deadlineId: Id<"deadlines">) => {
      try {
        await completeDeadline({
          id: deadlineId,
          userId: "current-user", // TODO: Replace with actual user ID from auth
        });
        toast.success("Deadline marked as complete");
      } catch {
        toast.error("Failed to mark as complete");
      }
    },
    [completeDeadline],
  );

  // Track current month from FullCalendar
  const handleDatesSet = useCallback((arg: { start: Date }) => {
    // Get the middle of the visible range to determine the current month
    setCurrentMonth(arg.start);
  }, []);

  // Loading state
  if (orgLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No org selected
  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Organization Selected</h2>
        <p className="text-muted-foreground">
          Please select an organization to view the calendar.
        </p>
      </div>
    );
  }

  // Data loading state
  if (
    deadlines === undefined ||
    categories === undefined ||
    assignees === undefined
  ) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-[calc(100vh-250px)] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-2">
          <CalendarExportMenu orgId={orgId} />
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => handlePrint()}
          >
            <Printer className="size-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <CalendarFilters
        categories={categories}
        assignees={assignees}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Calendar */}
      <div
        className="bg-background border rounded-lg p-4"
        style={{ height: "calc(100vh - 280px)" }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
          ]}
          {...baseCalendarOptions}
          views={viewOptions}
          events={events}
          eventContent={renderEventContent}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          select={handleDateSelect}
          datesSet={handleDatesSet}
          editable={true}
          droppable={true}
          height="100%"
        />
      </div>

      {/* Hidden Print View */}
      <div className="hidden print:block">
        <CalendarPrintView
          ref={printRef}
          deadlines={deadlines}
          currentMonth={currentMonth}
          organizationName="AI Compliance Calendar"
        />
      </div>

      {/* Quick View Dialog */}
      <DeadlineQuickView
        deadline={selectedDeadline}
        status={selectedStatus}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        onMarkComplete={handleMarkComplete}
      />

      {/* Reschedule Confirmation Dialog */}
      <Dialog
        open={rescheduleDialog.open}
        onOpenChange={() => handleCancelReschedule()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Deadline</DialogTitle>
            <DialogDescription>
              Are you sure you want to move &quot;
              {rescheduleDialog.deadline?.title}&quot; to{" "}
              {rescheduleDialog.newDate &&
                format(rescheduleDialog.newDate, "MMMM d, yyyy")}
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelReschedule}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReschedule}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
