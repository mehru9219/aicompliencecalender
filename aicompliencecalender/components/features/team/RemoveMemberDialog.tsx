"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Member {
  userId: string;
  email: string | null;
  name: string | null;
  deadlineCount: number;
}

interface RemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: Id<"organizations">;
  member: Member;
  onRemoved?: () => void;
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  orgId,
  member,
  onRemoved,
}: RemoveMemberDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const removeMember = useMutation(api.team.removeMember);

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await removeMember({
        orgId,
        memberId: member.userId,
      });
      onOpenChange(false);
      onRemoved?.();
    } catch (error) {
      console.error("Failed to remove member:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const memberName = member.name || member.email || "this member";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Remove Team Member
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to remove <strong>{memberName}</strong> from
              the team?
            </p>
            {member.deadlineCount > 0 && (
              <p className="text-amber-600 dark:text-amber-400">
                This member has {member.deadlineCount} assigned deadline
                {member.deadlineCount !== 1 ? "s" : ""} that will become
                unassigned.
              </p>
            )}
            <p className="text-muted-foreground">
              This action cannot be undone. The member will need to be
              re-invited to rejoin the organization.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isLoading}
          >
            {isLoading ? "Removing..." : "Remove Member"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
