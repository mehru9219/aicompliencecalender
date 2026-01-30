"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DeadlineStatusBadge,
  DeadlineForm,
} from "@/components/features/deadlines";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Edit,
  RefreshCw,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DeadlineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const deadlineId = params.id as Id<"deadlines">;

  const deadline = useQuery(api.deadlines.get, { id: deadlineId });
  const auditLog = useQuery(api.deadlines.auditHistory, {
    deadlineId,
  });

  const updateDeadline = useMutation(api.deadlines.update);
  const completeDeadline = useMutation(api.deadlines.complete);
  const deleteDeadline = useMutation(api.deadlines.softDelete);

  const handleUpdate = async (values: {
    title: string;
    description?: string;
    dueDate: Date;
    category: string;
    recurrence?: {
      type:
        | "weekly"
        | "monthly"
        | "quarterly"
        | "semi_annual"
        | "annual"
        | "custom";
      interval?: number;
      endDate?: number;
      baseDate?: "due_date" | "completion_date";
    };
    assignedTo?: string;
  }) => {
    await updateDeadline({
      id: deadlineId,
      title: values.title,
      description: values.description,
      dueDate: values.dueDate.getTime(),
      category: values.category,
      recurrence: values.recurrence ?? undefined,
      assignedTo: values.assignedTo,
      userId: "temp-user",
    });
    setIsEditing(false);
  };

  const handleComplete = async () => {
    await completeDeadline({ id: deadlineId, userId: "temp-user" });
    setIsCompleting(false);
  };

  const handleDelete = async () => {
    await deleteDeadline({ id: deadlineId, userId: "temp-user" });
    router.push("/deadlines");
  };

  if (deadline === undefined) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!deadline) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Deadline not found</p>
        <Button asChild className="mt-4">
          <Link href="/deadlines">Back to deadlines</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/deadlines">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h2 className="text-2xl font-bold flex-1">{deadline.title}</h2>
        <DeadlineStatusBadge status={deadline.status} />
      </div>

      {isEditing ? (
        <Card>
          <CardContent className="p-6">
            <DeadlineForm
              defaultValues={{
                title: deadline.title,
                description: deadline.description,
                dueDate: new Date(deadline.dueDate),
                category: deadline.category,
                recurrence: deadline.recurrence as
                  | {
                      type:
                        | "weekly"
                        | "monthly"
                        | "quarterly"
                        | "semi_annual"
                        | "annual"
                        | "custom";
                      interval?: number;
                      endDate?: number;
                      baseDate?: "due_date" | "completion_date";
                    }
                  | undefined,
                assignedTo: deadline.assignedTo,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-6 space-y-4">
              {deadline.description && (
                <p className="text-muted-foreground">{deadline.description}</p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Due: {new Date(deadline.dueDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-muted rounded text-sm">
                    {deadline.category}
                  </span>
                </div>

                {deadline.assignedTo && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{deadline.assignedTo}</span>
                  </div>
                )}

                {deadline.recurrence && (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <span>Repeats {deadline.recurrence.type}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {deadline.status !== "completed" && (
                  <Dialog open={isCompleting} onOpenChange={setIsCompleting}>
                    <DialogTrigger asChild>
                      <Button variant="default">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Complete Deadline</DialogTitle>
                        <DialogDescription>
                          {deadline.recurrence
                            ? "This is a recurring deadline. A new deadline will be created for the next occurrence."
                            : "Mark this deadline as completed?"}
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsCompleting(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleComplete}>Confirm</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>

                <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Deadline</DialogTitle>
                      <DialogDescription>
                        This will move the deadline to trash. You can restore it
                        within 30 days.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleting(false)}
                      >
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDelete}>
                        Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLog === undefined ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : auditLog.length === 0 ? (
                <p className="text-muted-foreground text-sm">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {auditLog.map(
                    (log: {
                      _id: string;
                      timestamp: number;
                      action: string;
                      userId: string;
                    }) => (
                      <div
                        key={log._id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <span className="capitalize">{log.action}</span>
                        <span className="text-muted-foreground">
                          by {log.userId}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
