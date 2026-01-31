"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { DeadlineForm } from "@/components/features/deadlines";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useOrgContext } from "@/components/providers/OrgProvider";

export default function NewDeadlinePage() {
  const router = useRouter();
  const { orgId, isLoading: orgLoading } = useOrgContext();
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const createDeadline = useMutation(api.deadlines.create);

  const handleSubmit = async (values: {
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
    if (!orgId || !userId) return;
    setIsLoading(true);
    try {
      await createDeadline({
        orgId,
        title: values.title,
        description: values.description,
        dueDate: values.dueDate.getTime(),
        category: values.category,
        recurrence: values.recurrence ?? undefined,
        assignedTo: values.assignedTo,
        createdBy: userId,
      });
      router.push("/dashboard/deadlines");
    } catch (error) {
      console.error("Failed to create deadline:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (orgLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!orgId || !userId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">No Organization Selected</h2>
        <p className="text-muted-foreground">
          Please select an organization to create a deadline.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">New Deadline</h2>
        <p className="text-muted-foreground">
          Create a new compliance deadline
        </p>
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <DeadlineForm
          onSubmit={handleSubmit}
          onCancel={() => router.push("/dashboard/deadlines")}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
