"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeadlineStatusBadge } from "./DeadlineStatusBadge";
import { CheckCircle, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

type DeadlineStatus = "upcoming" | "due_soon" | "overdue" | "completed";

interface DeadlineCardProps {
  id: string;
  title: string;
  dueDate: number;
  category: string;
  status: DeadlineStatus;
  assignedTo?: string;
  onClick?: () => void;
  onComplete?: () => void;
  className?: string;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DeadlineCard({
  title,
  dueDate,
  category,
  status,
  assignedTo,
  onClick,
  onComplete,
  className,
}: DeadlineCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md",
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(dueDate)}
              </span>
              <span className="px-2 py-0.5 bg-muted rounded text-xs">
                {category}
              </span>
              {assignedTo && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {assignedTo}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DeadlineStatusBadge status={status} size="sm" />
            {status !== "completed" && onComplete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                title="Mark complete"
              >
                <CheckCircle className="h-5 w-5 text-green-600" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DeadlineCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4" />
            <div className="mt-2 flex gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}
