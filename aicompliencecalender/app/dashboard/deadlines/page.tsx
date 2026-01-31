"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
  DeadlineCard,
  DeadlineCardSkeleton,
  DeadlineFilters,
} from "@/components/features/deadlines";
import { useOrgContext } from "@/components/providers/OrgProvider";

export default function DeadlinesPage() {
  const { orgId, isLoading: orgLoading } = useOrgContext();
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  const deadlines = useQuery(
    api.deadlines.list,
    orgId
      ? {
          orgId,
          status: statusFilter.length > 0 ? statusFilter : undefined,
          category: categoryFilter.length > 0 ? categoryFilter : undefined,
        }
      : "skip"
  );

  const completeDeadline = useMutation(api.deadlines.complete);

  const handleComplete = async (id: Id<"deadlines">) => {
    await completeDeadline({ id, userId: "temp-user" });
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setCategoryFilter([]);
  };

  if (orgLoading) {
    return (
      <div className="space-y-6">
        <DeadlineCardSkeleton />
        <DeadlineCardSkeleton />
        <DeadlineCardSkeleton />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Organization Selected</h2>
        <p className="text-muted-foreground">
          Please select an organization to view deadlines.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deadlines</h2>
          <p className="text-muted-foreground">
            Manage your compliance deadlines
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/deadlines/new">
            <Plus className="h-4 w-4 mr-2" />
            New Deadline
          </Link>
        </Button>
      </div>

      <DeadlineFilters
        status={statusFilter}
        category={categoryFilter}
        onStatusChange={setStatusFilter}
        onCategoryChange={setCategoryFilter}
        onClear={clearFilters}
      />

      <div className="space-y-3">
        {deadlines === undefined ? (
          <>
            <DeadlineCardSkeleton />
            <DeadlineCardSkeleton />
            <DeadlineCardSkeleton />
          </>
        ) : deadlines.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">No deadlines found</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/dashboard/deadlines/new">Create your first deadline</Link>
            </Button>
          </div>
        ) : (
          deadlines.map(
            (deadline: {
              _id: Id<"deadlines">;
              title: string;
              dueDate: number;
              category: string;
              status: "upcoming" | "due_soon" | "overdue" | "completed";
              assignedTo?: string;
            }) => (
              <Link key={deadline._id} href={`/dashboard/deadlines/${deadline._id}`}>
                <DeadlineCard
                  id={deadline._id}
                  title={deadline.title}
                  dueDate={deadline.dueDate}
                  category={deadline.category}
                  status={deadline.status}
                  assignedTo={deadline.assignedTo}
                  onComplete={() => handleComplete(deadline._id)}
                />
              </Link>
            ),
          )
        )}
      </div>
    </div>
  );
}
