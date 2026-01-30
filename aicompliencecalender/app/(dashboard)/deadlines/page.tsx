"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import {
  DeadlineCard,
  DeadlineCardSkeleton,
  DeadlineFilters,
} from "@/components/features/deadlines";

// Temp org ID for dev - replace with actual org from auth
const TEMP_ORG_ID = "placeholder" as Id<"organizations">;

export default function DeadlinesPage() {
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  // This will fail until we have real org data
  const deadlines = useQuery(api.deadlines.list, {
    orgId: TEMP_ORG_ID,
    status: statusFilter.length > 0 ? statusFilter : undefined,
    category: categoryFilter.length > 0 ? categoryFilter : undefined,
  });

  const completeDeadline = useMutation(api.deadlines.complete);

  const handleComplete = async (id: Id<"deadlines">) => {
    await completeDeadline({ id, userId: "temp-user" });
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setCategoryFilter([]);
  };

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
          <Link href="/deadlines/new">
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
              <Link href="/deadlines/new">Create your first deadline</Link>
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
              <Link key={deadline._id} href={`/deadlines/${deadline._id}`}>
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
