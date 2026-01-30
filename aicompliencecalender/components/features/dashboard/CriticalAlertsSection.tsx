"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DeadlineAlertItem } from "./DeadlineAlertItem";
import { AlertTriangle } from "lucide-react";
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

interface CriticalAlertsSectionProps {
  overdue: Deadline[];
  dueToday: Deadline[];
  className?: string;
}

function getDaysOverdue(dueDate: number): number {
  const now = Date.now();
  return Math.floor((now - dueDate) / (24 * 60 * 60 * 1000));
}

export function CriticalAlertsSection({
  overdue,
  dueToday,
  className,
}: CriticalAlertsSectionProps) {
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

  // Don't render if no critical items
  if (overdue.length === 0 && dueToday.length === 0) {
    return null;
  }

  const totalCount = overdue.length + dueToday.length;

  return (
    <Card
      className={`bg-red-50 dark:bg-red-950/20 border-2 border-red-300 dark:border-red-900 ${className}`}
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
          <AlertTriangle className="h-5 w-5" />
          <span>Requires Immediate Attention</span>
          <span className="ml-auto text-sm font-normal bg-red-200 dark:bg-red-900 px-2 py-0.5 rounded-full">
            {totalCount} {totalCount === 1 ? "item" : "items"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {overdue.map((deadline) => (
          <DeadlineAlertItem
            key={deadline._id}
            deadline={deadline}
            urgency="overdue"
            urgencyText={`${getDaysOverdue(deadline.dueDate)} ${getDaysOverdue(deadline.dueDate) === 1 ? "day" : "days"} overdue`}
            onComplete={handleComplete}
            isCompleting={completingId === deadline._id}
          />
        ))}
        {dueToday.map((deadline) => (
          <DeadlineAlertItem
            key={deadline._id}
            deadline={deadline}
            urgency="today"
            urgencyText="Due today"
            onComplete={handleComplete}
            isCompleting={completingId === deadline._id}
          />
        ))}
      </CardContent>
    </Card>
  );
}
