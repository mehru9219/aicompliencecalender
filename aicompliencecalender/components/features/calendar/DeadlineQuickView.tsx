"use client";

import { useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Calendar,
  CheckCircle,
  ExternalLink,
  FileText,
  Tag,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusDot } from "./StatusDot";
import type { CalendarDeadline, EventStatus } from "@/lib/calendar/transformer";
import type { Id } from "@/convex/_generated/dataModel";

interface DeadlineQuickViewProps {
  deadline: CalendarDeadline | null;
  status: EventStatus | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkComplete?: (deadlineId: Id<"deadlines">) => void;
  linkedDocuments?: Array<{ _id: string; name: string }>;
}

const statusLabels: Record<EventStatus, string> = {
  completed: "Completed",
  overdue: "Overdue",
  dueSoon: "Due Soon",
  upcoming: "Upcoming",
};

const statusVariants: Record<
  EventStatus,
  "default" | "destructive" | "secondary" | "outline"
> = {
  completed: "default",
  overdue: "destructive",
  dueSoon: "secondary",
  upcoming: "outline",
};

export function DeadlineQuickView({
  deadline,
  status,
  open,
  onOpenChange,
  onMarkComplete,
  linkedDocuments = [],
}: DeadlineQuickViewProps) {
  const handleMarkComplete = useCallback(() => {
    if (deadline && onMarkComplete) {
      onMarkComplete(deadline._id);
      onOpenChange(false);
    }
  }, [deadline, onMarkComplete, onOpenChange]);

  if (!deadline || !status) {
    return null;
  }

  const dueDate = new Date(deadline.dueDate);
  const isCompleted = !!deadline.completedAt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <StatusDot status={status} size="lg" className="mt-1" />
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg pr-8">
                {deadline.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusVariants[status]} className="text-xs">
                  {statusLabels[status]}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-2">
            {/* Due Date */}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-muted-foreground">Due: </span>
                <span className="font-medium">
                  {format(dueDate, "MMMM d, yyyy")}
                </span>
                {deadline.recurrence && (
                  <span className="text-muted-foreground ml-2">
                    (Repeats {deadline.recurrence.type})
                  </span>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="flex items-center gap-3 text-sm">
              <Tag className="size-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-muted-foreground">Category: </span>
                <span className="font-medium capitalize">
                  {deadline.category}
                </span>
              </div>
            </div>

            {/* Assigned To */}
            {deadline.assignedTo && (
              <div className="flex items-center gap-3 text-sm">
                <User className="size-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-muted-foreground">Assigned to: </span>
                  <span className="font-medium">{deadline.assignedTo}</span>
                </div>
              </div>
            )}

            {/* Completed At */}
            {deadline.completedAt && (
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="size-4 text-green-500 shrink-0" />
                <div>
                  <span className="text-muted-foreground">Completed: </span>
                  <span className="font-medium">
                    {format(new Date(deadline.completedAt), "MMMM d, yyyy")}
                  </span>
                </div>
              </div>
            )}

            {/* Description */}
            {deadline.description && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{deadline.description}</p>
              </div>
            )}

            {/* Linked Documents */}
            {linkedDocuments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="size-4" />
                  Linked Documents
                </p>
                <ul className="space-y-1">
                  {linkedDocuments.map((doc) => (
                    <li key={doc._id}>
                      <Link
                        href={`/documents/${doc._id}`}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {doc.name}
                        <ExternalLink className="size-3" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          {!isCompleted && onMarkComplete && (
            <Button
              onClick={handleMarkComplete}
              className="flex-1 sm:flex-none gap-1"
            >
              <CheckCircle className="size-4" />
              Mark Complete
            </Button>
          )}
          <Button
            variant="outline"
            asChild
            className="flex-1 sm:flex-none gap-1"
          >
            <Link href={`/deadlines/${deadline._id}`}>
              <ExternalLink className="size-4" />
              Edit Details
            </Link>
          </Button>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="sm:hidden">
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
