"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeadlineAlertItem } from "./DeadlineAlertItem";
import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";
import { format } from "date-fns";

interface Deadline {
  _id: Id<"deadlines">;
  title: string;
  category: string;
  dueDate: number;
  assignedTo?: string;
}

interface UpcomingSectionProps {
  deadlines: Deadline[];
  maxItems?: number;
  className?: string;
}

export function UpcomingSection({
  deadlines,
  maxItems = 5,
  className,
}: UpcomingSectionProps) {
  const displayedDeadlines = deadlines.slice(0, maxItems);
  const hasMore = deadlines.length > maxItems;

  if (deadlines.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5" />
            Upcoming (Next 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No upcoming deadlines in the next 30 days.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-5 w-5" />
          <span>Upcoming (Next 30 Days)</span>
          <span className="ml-2 text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {deadlines.length}
          </span>
        </CardTitle>
        <Link href="/dashboard/deadlines?filter=upcoming">
          <Button variant="ghost" size="sm" className="text-xs">
            View all
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {displayedDeadlines.map((deadline) => (
          <DeadlineAlertItem
            key={deadline._id}
            deadline={deadline}
            urgency="upcoming"
            urgencyText={format(new Date(deadline.dueDate), "MMM d")}
          />
        ))}
        {hasMore && (
          <Link href="/dashboard/deadlines?filter=upcoming">
            <Button variant="outline" className="w-full mt-2">
              View {deadlines.length - maxItems} more
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
