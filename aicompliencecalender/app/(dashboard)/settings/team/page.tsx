"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Users, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InviteModal,
  MemberCard,
  PendingInvitations,
  WorkloadChart,
} from "@/components/features/team";
import { hasPermission, type Role } from "@/lib/permissions";

interface TeamMember {
  userId: string;
  email: string | null;
  name: string | null;
  role: string;
  joinedAt: number;
  deadlineCount: number;
  isCurrentUser: boolean;
}

// TODO: Get from context/props in real implementation
const MOCK_ORG_ID = "placeholder" as Id<"organizations">;

export default function TeamSettingsPage() {
  // In production, get orgId from org context
  const orgId = MOCK_ORG_ID;

  const members = useQuery(api.team.listMembers, { orgId });
  const currentUserRole = useQuery(api.team.getCurrentUserRole, { orgId });

  const isLoading = members === undefined || currentUserRole === undefined;
  const userRole = (currentUserRole as Role) || "viewer";
  const canInvite = hasPermission(userRole, "users:invite");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="size-6" />
            Team Members
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization&apos;s team members and their roles
          </p>
        </div>
        {canInvite && <InviteModal orgId={orgId} currentUserRole={userRole} />}
      </div>

      {/* Workload Overview */}
      {members && members.length > 1 && <WorkloadChart members={members} />}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {members?.length || 0} Team Member
            {members?.length !== 1 ? "s" : ""}
          </CardTitle>
          <CardDescription>
            Members have different permissions based on their role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {members && members.length > 0 ? (
            members.map((member: TeamMember) => (
              <MemberCard
                key={member.userId}
                member={member}
                orgId={orgId}
                currentUserRole={userRole}
              />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="size-12 mx-auto mb-3 opacity-50" />
              <p>No team members yet</p>
              {canInvite && (
                <p className="text-sm mt-1">
                  Invite your first team member to get started
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <PendingInvitations orgId={orgId} />
    </div>
  );
}
