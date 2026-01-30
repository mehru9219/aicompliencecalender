"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format, formatDistanceToNow } from "date-fns";
import { Clock, Mail, MoreHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Invitation {
  _id: Id<"invitations">;
  email: string;
  role: string;
  invitedBy: string;
  createdAt: number;
  expiresAt: number;
}

interface PendingInvitationsProps {
  orgId: Id<"organizations">;
}

export function PendingInvitations({ orgId }: PendingInvitationsProps) {
  const invitations = useQuery(api.team.listPendingInvitations, { orgId });
  const revokeInvitation = useMutation(api.team.revokeInvitation);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = async (invitationId: Id<"invitations">) => {
    setRevokingId(invitationId);
    try {
      await revokeInvitation({ orgId, invitationId });
    } catch (error) {
      console.error("Failed to revoke invitation:", error);
    } finally {
      setRevokingId(null);
    }
  };

  if (invitations === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return null; // Don't show section if no pending invitations
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pending Invitations</CardTitle>
        <CardDescription>
          Invitations expire after 7 days if not accepted
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.map((invitation: Invitation) => {
          const expiresIn = formatDistanceToNow(
            new Date(invitation.expiresAt),
            {
              addSuffix: true,
            },
          );

          return (
            <div
              key={invitation._id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                  <Mail className="size-4 text-muted-foreground" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-medium text-sm">{invitation.email}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Sent {format(new Date(invitation.createdAt), "MMM d")}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      Expires {expiresIn}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {invitation.role}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={revokingId === invitation._id}
                    >
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Invitation actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleRevoke(invitation._id)}
                    >
                      <X className="size-4 mr-2" />
                      Revoke Invitation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
