"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DeadlineAlertItem } from "./DeadlineAlertItem";
import { Clock } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

interface Deadline {
  _id: Id<"deadlines">;
  title: string;
  category: string;
  dueDate: number;
  assignedTo?: string;
}

interface DueThisWeekSectionProps {
  deadlines: Deadline[];
  className?: string;
}

function getDaysUntilDue(dueDate: number): number {
  const now = Date.now();
  return Math.ceil((dueDate - now) / (24 * 60 * 60 * 1000));
}

function formatDaysUntil(days: number): string {
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export function DueThisWeekSection({
  deadlines,
  className,
}: DueThisWeekSectionProps) {
  const [completingId, setCompletingId] = useState<Id<"deadlines"> | null>(
    null,
  );
  const completeDeadline = useMutation(api.deadlines.complete);

  const handleComplete = async (id: Id<"deadlines">) => {
    setCompletingId(id);
    try {
      await completeDeadline({ id, userId: "temp-user" });
    } finally {
      setCompletingId(null);
    }
  };

  // Don't render if empty
  if (deadlines.length === 0) {
    return null;
  }

  return (
    <Card
      className={`bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 ${className}`}
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <Clock className="h-5 w-5" />
          <span>Due This Week</span>
          <span className="ml-auto text-sm font-normal bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded-full">
            {deadlines.length} {deadlines.length === 1 ? "item" : "items"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {deadlines.map((deadline) => {
          const daysUntil = getDaysUntilDue(deadline.dueDate);
          return (
            <DeadlineAlertItem
              key={deadline._id}
              deadline={deadline}
              urgency="warning"
              urgencyText={formatDaysUntil(daysUntil)}
              onComplete={handleComplete}
              isCompleting={completingId === deadline._id}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
