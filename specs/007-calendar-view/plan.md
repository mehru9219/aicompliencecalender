# Implementation Plan: Calendar View

**Branch**: `007-calendar-view` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-calendar-view/spec.md`

## Summary

Build a full-featured calendar interface with month/week/day views, drag-and-drop rescheduling, deadline quick-view panels, iCal export for external calendar sync, and print-friendly views for compliance audits.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x
**Primary Dependencies**: FullCalendar React (@fullcalendar/react), ical.js, @react-to-print
**Storage**: Convex (reads from deadlines table)
**Testing**: Vitest (unit), Playwright (E2E for drag-drop)
**Target Platform**: Web (responsive)
**Project Type**: Web application
**Performance Goals**: Calendar render < 500ms, drag-drop response < 100ms
**Constraints**: Works with 1000+ deadlines visible, mobile-friendly
**Scale/Scope**: All org deadlines visible with filtering

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with The Three Laws:
- [x] **Data Integrity**: Drag-drop requires confirmation before saving, atomic updates
- [x] **Alert Reliability**: Rescheduling automatically updates associated alerts
- [x] **Clarity**: Color-coded events by status, clear due dates visible

Additional checks:
- [x] **Security**: Org-scoped queries, permission check on reschedule
- [x] **Code Quality**: TypeScript strict, FullCalendar types
- [x] **Testing**: Drag-drop E2E tests, iCal export validation
- [x] **Performance**: Lazy load event details, virtualized for large datasets
- [x] **External Services**: N/A (iCal is client-side generation)

## Project Structure

### Source Code (repository root)

```text
src/
├── app/
│   └── (dashboard)/
│       └── calendar/
│           └── page.tsx              # Main calendar view
├── api/
│   └── calendar/
│       └── [orgId]/
│           └── feed.ics/
│               └── route.ts          # iCal feed endpoint
├── components/
│   └── features/
│       └── calendar/
│           ├── CalendarFilters.tsx
│           ├── DeadlineQuickView.tsx
│           ├── CalendarPrintView.tsx
│           ├── CalendarExportMenu.tsx
│           ├── MiniCalendar.tsx
│           └── StatusDot.tsx
├── convex/
│   ├── calendar.ts                   # Calendar-specific queries
│   └── schema.ts
└── lib/
    └── calendar/
        └── ical.ts                   # iCal generation utilities
```

## FullCalendar Setup

```typescript
// app/(dashboard)/calendar/page.tsx
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

export default function CalendarPage() {
  const { orgId } = useOrg();
  const deadlines = useQuery(api.deadlines.listForCalendar, { orgId });
  const updateDeadline = useMutation(api.deadlines.update);

  const [filters, setFilters] = useState({
    categories: [],
    assignedTo: null,
    showCompleted: false,
  });

  const events = useMemo(() => {
    if (!deadlines) return [];

    return deadlines
      .filter(d => applyFilters(d, filters))
      .map(d => ({
        id: d._id,
        title: d.title,
        start: new Date(d.dueDate),
        allDay: true,
        backgroundColor: getStatusColor(d),
        borderColor: getStatusColor(d),
        extendedProps: {
          deadline: d,
        },
      }));
  }, [deadlines, filters]);

  const handleEventDrop = async (info: EventDropArg) => {
    const confirmed = await confirm(
      `Move "${info.event.title}" to ${format(info.event.start, 'MMM d, yyyy')}?`
    );

    if (confirmed) {
      await updateDeadline({
        id: info.event.id as Id<"deadlines">,
        dueDate: info.event.start.getTime(),
      });
      toast.success('Deadline rescheduled');
    } else {
      info.revert();
    }
  };

  return (
    <div className="h-[calc(100vh-200px)]">
      <CalendarFilters filters={filters} onChange={setFilters} />

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,listMonth',
        }}
        events={events}
        editable={true}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        eventContent={renderEventContent}
        height="100%"
      />
    </div>
  );
}

function renderEventContent(eventInfo: EventContentArg) {
  const deadline = eventInfo.event.extendedProps.deadline;

  return (
    <div className="flex items-center gap-1 px-1 overflow-hidden">
      <StatusDot status={deadline.status} />
      <span className="truncate text-xs">{eventInfo.event.title}</span>
    </div>
  );
}

function getStatusColor(deadline: Deadline): string {
  if (deadline.completedAt) return '#22c55e'; // green
  const daysUntil = (deadline.dueDate - Date.now()) / (1000*60*60*24);
  if (daysUntil < 0) return '#ef4444'; // red
  if (daysUntil <= 7) return '#f97316'; // orange
  return '#3b82f6'; // blue
}
```

## Calendar Detail Panel

```typescript
// components/features/calendar/DeadlineQuickView.tsx
function DeadlineQuickView({ deadline, onClose }) {
  const complete = useMutation(api.deadlines.complete);

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{deadline.title}</SheetTitle>
          <StatusBadge status={deadline.status} />
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Due Date</Label>
            <p>{format(deadline.dueDate, 'MMMM d, yyyy')}</p>
          </div>

          <div>
            <Label>Category</Label>
            <p>{deadline.category}</p>
          </div>

          <div>
            <Label>Assigned To</Label>
            <UserAvatar userId={deadline.assignedTo} />
          </div>

          {deadline.description && (
            <div>
              <Label>Description</Label>
              <p className="text-sm text-gray-600">{deadline.description}</p>
            </div>
          )}

          <LinkedDocuments deadlineId={deadline._id} />

          <div className="flex gap-2">
            <Button onClick={() => complete({ id: deadline._id })}>
              <Check className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/deadlines/${deadline._id}`}>
                Edit Details
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

## iCal Export

```typescript
// convex/calendar.ts
export const generateICalFeed = action({
  args: { orgId: v.id("organizations") },
  handler: async (ctx, { orgId }) => {
    const deadlines = await ctx.runQuery(api.deadlines.list, {
      orgId,
      includeCompleted: false
    });

    const calendar = new ICAL.Component(['vcalendar', [], []]);
    calendar.updatePropertyWithValue('prodid', '-//Compliance Calendar//EN');
    calendar.updatePropertyWithValue('version', '2.0');
    calendar.updatePropertyWithValue('x-wr-calname', 'Compliance Deadlines');

    for (const d of deadlines) {
      const event = new ICAL.Component('vevent');
      event.updatePropertyWithValue('uid', `${d._id}@compliancecalendar.app`);
      event.updatePropertyWithValue('summary', d.title);
      event.updatePropertyWithValue('description', d.description || '');
      event.updatePropertyWithValue('dtstart', ICAL.Time.fromJSDate(new Date(d.dueDate)));
      event.updatePropertyWithValue('dtend', ICAL.Time.fromJSDate(new Date(d.dueDate)));

      // Add alarms
      const alarmDays = [7, 1];
      for (const days of alarmDays) {
        const alarm = new ICAL.Component('valarm');
        alarm.updatePropertyWithValue('action', 'DISPLAY');
        alarm.updatePropertyWithValue('trigger', `-P${days}D`);
        alarm.updatePropertyWithValue('description', `${d.title} due in ${days} days`);
        event.addSubcomponent(alarm);
      }

      calendar.addSubcomponent(event);
    }

    return calendar.toString();
  },
});

// api/calendar/[orgId]/feed.ics/route.ts
export async function GET(req: Request, { params }: { params: { orgId: string } }) {
  const ical = await generateICalFeed({ orgId: params.orgId });

  return new Response(ical, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="compliance.ics"',
    },
  });
}
```

## Print View

```typescript
// components/features/calendar/CalendarPrintView.tsx
const CalendarPrintView = forwardRef<HTMLDivElement, Props>(
  ({ deadlines, month }, ref) => {
    const weeks = getWeeksInMonth(month);

    return (
      <div ref={ref} className="p-8 bg-white">
        <h1 className="text-2xl font-bold mb-4">
          Compliance Calendar - {format(month, 'MMMM yyyy')}
        </h1>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <th key={day} className="border p-2 bg-gray-100">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, i) => (
              <tr key={i}>
                {week.map(date => (
                  <td key={date.toISOString()} className="border p-2 h-24 align-top">
                    <span className="text-sm text-gray-500">
                      {format(date, 'd')}
                    </span>
                    {getDeadlinesForDate(deadlines, date).map(d => (
                      <div key={d._id} className="text-xs mt-1 truncate">
                        • {d.title}
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="mt-4 text-xs text-gray-500">
          Generated on {format(new Date(), 'PPP')}
        </footer>
      </div>
    );
  }
);
```

## Complexity Tracking

No constitution violations - implements confirmation dialogs for reschedule and automatic alert updates.
