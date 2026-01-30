"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DeadlineForm } from "@/components/features/deadlines";
import { useState } from "react";

// Temp org ID for dev - replace with actual org from auth
const TEMP_ORG_ID = "placeholder" as Id<"organizations">;

export default function NewDeadlinePage() {
  const router = useRouter();
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
    setIsLoading(true);
    try {
      await createDeadline({
        orgId: TEMP_ORG_ID,
        title: values.title,
        description: values.description,
        dueDate: values.dueDate.getTime(),
        category: values.category,
        recurrence: values.recurrence ?? undefined,
        assignedTo: values.assignedTo,
        createdBy: "temp-user",
      });
      router.push("/deadlines");
    } catch (error) {
      console.error("Failed to create deadline:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
          onCancel={() => router.push("/deadlines")}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
