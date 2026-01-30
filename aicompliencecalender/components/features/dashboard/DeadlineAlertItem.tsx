"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Id } from "@/convex/_generated/dataModel";

interface DeadlineAlertItemProps {
  deadline: {
    _id: Id<"deadlines">;
    title: string;
    category: string;
    dueDate: number;
    assignedTo?: string;
  };
  urgency: "overdue" | "today" | "warning" | "upcoming";
  urgencyText: string;
  onComplete?: (id: Id<"deadlines">) => void;
  isCompleting?: boolean;
  className?: string;
}

export function DeadlineAlertItem({
  deadline,
  urgency,
  urgencyText,
  onComplete,
  isCompleting = false,
  className,
}: DeadlineAlertItemProps) {
  const urgencyStyles = {
    overdue: {
      bg: "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50",
      border: "border-red-200 dark:border-red-900",
      icon: AlertCircle,
      iconColor: "text-red-500",
      textColor: "text-red-700 dark:text-red-400",
    },
    today: {
      bg: "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50",
      border: "border-red-200 dark:border-red-900",
      icon: Clock,
      iconColor: "text-red-500",
      textColor: "text-red-700 dark:text-red-400",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50",
      border: "border-amber-200 dark:border-amber-900",
      icon: Clock,
      iconColor: "text-amber-500",
      textColor: "text-amber-700 dark:text-amber-400",
    },
    upcoming: {
      bg: "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50",
      border: "border-blue-200 dark:border-blue-900",
      icon: Clock,
      iconColor: "text-blue-500",
      textColor: "text-blue-700 dark:text-blue-400",
    },
  };

  const style = urgencyStyles[urgency];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        style.bg,
        style.border,
        className,
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", style.iconColor)} />

      <div className="flex-1 min-w-0">
        <Link href={`/deadlines/${deadline._id}`} className="block group">
          <p className="font-medium truncate group-hover:underline">
            {deadline.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {deadline.category}
            </Badge>
            <span className={cn("text-xs font-medium", style.textColor)}>
              {urgencyText}
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onComplete && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onComplete(deadline._id)}
            disabled={isCompleting}
            className="h-8 px-3 text-xs min-w-[44px] min-h-[44px]"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Complete
          </Button>
        )}
        <Link href={`/deadlines/${deadline._id}`}>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 min-w-[44px] min-h-[44px]"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">View details</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
